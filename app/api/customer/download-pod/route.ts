/**
 * Customer Download POD API
 * Generate and download proof of delivery PDF
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const loadSheetId = searchParams.get("loadSheetId");

    if (!loadSheetId) {
      return NextResponse.json(
        { error: "Load sheet ID is required" },
        { status: 400 },
      );
    }

    // Get load sheet with full details
    const loadSheet = await prisma.loadSheet.findUnique({
      where: { id: loadSheetId },
      include: {
        customer: true,
        containers: {
          include: {
            containerItems: true,
          },
        },
        bayDoor: true,
        events: {
          orderBy: { timestamp: "desc" },
        },
      },
    });

    if (!loadSheet) {
      return NextResponse.json(
        { error: "Load sheet not found" },
        { status: 404 },
      );
    }

    // Generate simple HTML POD (in production, use a PDF library like pdfkit or puppeteer)
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Proof of Delivery - ${loadSheet.loadSheetNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { color: #1e40af; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f3f4f6; }
          .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .section { margin: 30px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Proof of Delivery</h1>
            <p><strong>Load Sheet:</strong> ${loadSheet.loadSheetNumber}</p>
          </div>
          <div>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${loadSheet.status}</p>
          </div>
        </div>

        <div class="section">
          <h2>Customer Information</h2>
          <p><strong>Customer:</strong> ${loadSheet.customer.name}</p>
          <p><strong>Customer Code:</strong> ${loadSheet.customer.code || "N/A"}</p>
        </div>

        <div class="section">
          <h2>Shipment Details</h2>
          <p><strong>Scheduled Date:</strong> ${new Date(loadSheet.shipmentDate).toLocaleString()}</p>
          <p><strong>Departure:</strong> ${loadSheet.actualDepartureTime ? new Date(loadSheet.actualDepartureTime).toLocaleString() : "Pending"}</p>
          <p><strong>Carrier:</strong> ${loadSheet.carrierName || "N/A"}</p>
          <p><strong>Driver:</strong> ${loadSheet.driverName || "N/A"}</p>
          <p><strong>Trailer:</strong> ${loadSheet.trailerNumber || "N/A"}</p>
        </div>

        <div class="section">
          <h2>Containers (${loadSheet.containers.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Container Number</th>
                <th>Weight (kg)</th>
                <th>Volume (m³)</th>
                <th>Items</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${loadSheet.containers
                .map(
                  (container) => `
                <tr>
                  <td>${container.containerNumber}</td>
                  <td>${container.weight}</td>
                  <td>${container.volume.toFixed(2)}</td>
                  <td>${container.containerItems?.length || 0}</td>
                  <td>${container.status}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Summary</h2>
          <p><strong>Total Containers:</strong> ${loadSheet.totalContainers}</p>
          <p><strong>Total Weight:</strong> ${(loadSheet.totalWeight / 1000).toFixed(2)}t</p>
          <p><strong>Total Volume:</strong> ${loadSheet.totalVolume.toFixed(2)}m³</p>
          <p><strong>Total Items:</strong> ${loadSheet.totalItems}</p>
        </div>

        <div class="section">
          <h2>Timeline</h2>
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Description</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              ${loadSheet.events
                .map(
                  (event) => `
                <tr>
                  <td>${event.eventType}</td>
                  <td>${event.description}</td>
                  <td>${new Date(event.timestamp).toLocaleString()}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <div style="margin-top: 50px; text-align: center; color: #666;">
          <p>This is an electronically generated proof of delivery.</p>
          <p>For questions, please contact your warehouse representative.</p>
        </div>
      </body>
      </html>
    `;

    // Return HTML (in production, convert to PDF)
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="POD-${loadSheet.loadSheetNumber}.html"`,
      },
    });
  } catch (error) {
    console.error("POD download error:", error);
    return NextResponse.json(
      { error: "Failed to generate proof of delivery" },
      { status: 500 },
    );
  }
}
