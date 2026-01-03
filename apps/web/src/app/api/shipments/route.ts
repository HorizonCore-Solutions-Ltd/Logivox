export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// Validation schema
const createShipmentSchema = z.object({
  salesOrderId: z.string(),
  packId: z.string().optional(),
  carrierCode: z.string(),
  carrierService: z.string(),
  
  // Recipient info
  recipientName: z.string().optional(),
  recipientPhone: z.string().optional(),
  recipientEmail: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  
  // Shipment details
  weight: z.number().optional(),
  weightUnit: z.string().optional(),
  dimensions: z.object({
    length: z.number(),
    width: z.number(),
    height: z.number(),
    unit: z.string()
  }).optional(),
  
  // Options
  signatureRequired: z.boolean().optional(),
  saturdayDelivery: z.boolean().optional(),
  insuranceAmount: z.number().optional(),
  
  notes: z.string().optional()
});

/**
 * @route POST /api/shipments
 * @desc Create a new shipment
 * @access Private
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = createShipmentSchema.parse(body);

    // Get organization ID from session
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: {
          where: { isActive: true },
          include: { organization: true }
        }
      }
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json(
        { error: "No active organization found" },
        { status: 403 }
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    // Transaction to create shipment
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Verify sales order exists
      const salesOrder = await tx.salesOrder.findFirst({
        where: {
          id: validatedData.salesOrderId,
          organizationId
        },
        include: {
          customer: true
        }
      });

      if (!salesOrder) {
        throw new Error("Sales order not found");
      }

      // Check SO status - should be PACKED or ready to ship
      if (!["PACKED", "PACKING", "SHIPPING"].includes(salesOrder.status)) {
        throw new Error(
          `Sales order must be packed before shipping. Current status: ${salesOrder.status}`
        );
      }

      // Generate shipment number (SHIP-YYYYMMDD-XXX)
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      
      const lastShipment = await tx.shipment.findFirst({
        where: {
          organizationId,
          shipmentNumber: {
            startsWith: `SHIP-${dateStr}`
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      let sequence = 1;
      if (lastShipment?.shipmentNumber) {
        const lastSeq = parseInt(lastShipment.shipmentNumber.split('-')[2]);
        if (!isNaN(lastSeq)) {
          sequence = lastSeq + 1;
        }
      }

      const shipmentNumber = `SHIP-${dateStr}-${sequence.toString().padStart(3, '0')}`;

      // Get carrier name from code
      const carrierNames: Record<string, string> = {
        UPS: "United Parcel Service",
        FEDEX: "FedEx",
        DHL: "DHL Express",
        USPS: "United States Postal Service"
      };

      // Create shipment
      const shipment = await tx.shipment.create({
        data: {
          organizationId,
          shipmentNumber,
          salesOrderId: validatedData.salesOrderId,
          packId: validatedData.packId,
          status: "PENDING",
          
          carrierCode: validatedData.carrierCode,
          carrierName: carrierNames[validatedData.carrierCode] || validatedData.carrierCode,
          carrierService: validatedData.carrierService,
          
          recipientName: validatedData.recipientName || salesOrder.customer.name,
          recipientPhone: validatedData.recipientPhone || salesOrder.customer.phone,
          recipientEmail: validatedData.recipientEmail || salesOrder.customer.email,
          addressLine1: validatedData.addressLine1 || salesOrder.shippingAddress,
          addressLine2: validatedData.addressLine2,
          city: validatedData.city || salesOrder.shippingCity,
          state: validatedData.state || salesOrder.shippingState,
          postalCode: validatedData.postalCode || salesOrder.shippingZip,
          country: validatedData.country || salesOrder.shippingCountry,
          
          weight: validatedData.weight,
          weightUnit: validatedData.weightUnit || "kg",
          dimensions: validatedData.dimensions as any,
          
          signatureRequired: validatedData.signatureRequired || false,
          saturdayDelivery: validatedData.saturdayDelivery || false,
          insuranceAmount: validatedData.insuranceAmount,
          
          notes: validatedData.notes,
          createdById: session.user.id
        }
      });

      // Update sales order status if not already shipping
      if (salesOrder.status !== "SHIPPING") {
        await tx.salesOrder.update({
          where: { id: validatedData.salesOrderId },
          data: { status: "SHIPPING" }
        });
      }

      // Create activity log
      await tx.activityLog.create({
        data: {
          organizationId,
          userId: session.user.id,
          action: "SHIPMENT_CREATED",
          entityType: "SHIPMENT",
          entityId: shipment.id,
          metadata: {
            shipmentNumber,
            salesOrderNumber: salesOrder.soNumber,
            carrier: validatedData.carrierCode,
            service: validatedData.carrierService
          }
        }
      });

      return shipment;
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error: any) {
    console.error("Error creating shipment:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create shipment" },
      { status: 500 }
    );
  }
}

/**
 * @route GET /api/shipments
 * @desc List all shipments with filtering
 * @access Private
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get organization ID from session
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: {
          where: { isActive: true },
          include: { organization: true }
        }
      }
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json(
        { error: "No active organization found" },
        { status: 403 }
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const carrierCode = searchParams.get("carrierCode");
    const salesOrderId = searchParams.get("salesOrderId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { organizationId };
    if (status) where.status = status;
    if (carrierCode) where.carrierCode = carrierCode;
    if (salesOrderId) where.salesOrderId = salesOrderId;
    if (search) {
      where.OR = [
        { shipmentNumber: { contains: search, mode: 'insensitive' } },
        { trackingNumber: { contains: search, mode: 'insensitive' } },
        { recipientName: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Fetch shipments
    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        include: {
          salesOrder: {
            select: {
              id: true,
              soNumber: true,
              customer: {
                select: {
                  id: true,
                  name: true,
                  code: true
                }
              }
            }
          },
          pack: {
            select: {
              id: true,
              packNumber: true,
              totalPackages: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.shipment.count({ where })
    ]);

    return NextResponse.json({
      shipments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error("Error fetching shipments:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch shipments" },
      { status: 500 }
    );
  }
}
