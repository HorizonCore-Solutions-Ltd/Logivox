export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organizations: true },
    })

    if (!user?.organizations?.[0]?.id) {
      return NextResponse.json(
        { message: "No organization found" },
        { status: 404 }
      )
    }

    const organizationId = user.organizations[0].id

    // Parse form data
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { message: "No file provided" },
        { status: 400 }
      )
    }

    // Read file content
    const text = await file.text()
    const lines = text.split("\n").filter((line) => line.trim())

    if (lines.length < 2) {
      return NextResponse.json(
        { message: "CSV file is empty or invalid" },
        { status: 400 }
      )
    }

    // Parse CSV
    const headers = lines[0]?.split(",").map((h) => h.trim()) || []
    const rows = lines.slice(1)

    // Validate required headers
    const requiredHeaders = ["name", "sku", "quantity", "unit"]
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h))

    if (missingHeaders.length > 0) {
      return NextResponse.json(
        {
          message: `Missing required headers: ${missingHeaders.join(", ")}`,
        },
        { status: 400 }
      )
    }

    let imported = 0
    let failed = 0
    const errors: string[] = []

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      try {
        const values = rows[i]?.split(",").map((v) => {
          // Remove quotes if present
          let val = v.trim()
          if (val.startsWith('"') && val.endsWith('"')) {
            val = val.slice(1, -1).replace(/""/g, '"')
          }
          return val
        }) || []

        const rowData: any = {}
        headers.forEach((header, index) => {
          rowData[header] = values[index] || ""
        })

        // Validate required fields
        if (!rowData.name || !rowData.sku || !rowData.quantity || !rowData.unit) {
          errors.push(`Row ${i + 2}: Missing required fields`)
          failed++
          continue
        }

        // Check if SKU already exists
        const existing = await prisma.inventoryItem.findFirst({
          where: {
            sku: rowData.sku,
            organizationId,
          },
        })

        if (existing) {
          errors.push(`Row ${i + 2}: SKU "${rowData.sku}" already exists`)
          failed++
          continue
        }

        // Parse numeric fields
        const quantity = parseInt(rowData.quantity)
        const minStockLevel = parseInt(rowData.minStockLevel || "0")
        const reorderPoint = parseInt(rowData.reorderPoint || "0")
        const costPrice = parseFloat(rowData.costPrice || "0")
        const sellingPrice = parseFloat(rowData.sellingPrice || "0")

        if (isNaN(quantity)) {
          errors.push(`Row ${i + 2}: Invalid quantity`)
          failed++
          continue
        }

        // Determine status based on quantity
        let status = "IN_STOCK"
        if (quantity === 0) {
          status = "OUT_OF_STOCK"
        } else if (minStockLevel > 0 && quantity <= minStockLevel) {
          status = "LOW_STOCK"
        }

        // Create inventory item
        await prisma.inventoryItem.create({
          data: {
            name: rowData.name,
            sku: rowData.sku,
            description: rowData.description || null,
            barcode: rowData.barcode || null,
            quantity,
            minStockLevel,
            reorderPoint,
            costPrice,
            sellingPrice,
            unit: rowData.unit,
            status,
            warehouseId: rowData.warehouseId || null,
            categoryId: rowData.categoryId || null,
            organizationId,
          },
        })

        // Create activity log
        await prisma.activityLog.create({
          data: {
            action: "CREATE",
            entityType: "inventory",
            entityId: rowData.sku,
            userId: session.user.id,
            details: JSON.stringify({
              source: "bulk_import",
              name: rowData.name,
              quantity,
            }),
            ipAddress: request.headers.get("x-forwarded-for") || "unknown",
            userAgent: request.headers.get("user-agent") || "unknown",
          },
        })

        imported++
      } catch (error) {
        console.error(`Error processing row ${i + 2}:`, error)
        errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : "Unknown error"}`)
        failed++
      }
    }

    return NextResponse.json({
      imported,
      failed,
      total: rows.length,
      errors: errors.slice(0, 10), // Return first 10 errors
    })
  } catch (error) {
    console.error("Import error:", error)
    return NextResponse.json(
      { message: "Failed to import inventory" },
      { status: 500 }
    )
  }
}
