export const dynamic = "force-dynamic"; // Prevent caching
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Mock PDF generation for now to avoid complex jspdf setup in this environment without verifying it works in Node
// Detailed HTML is safer and easier to style for printing
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  try {
    const loadSheet = await prisma.loadSheet.findUnique({
      where: { id },
      include: {
        lines: true,
        bayDoor: true,
      },
    });

    if (!loadSheet) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Load Sheet ${loadSheet.loadSheetNumber}</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          h1 { border-bottom: 2px solid #333; padding-bottom: 10px; }
          .header-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .label { font-weight: bold; color: #555; font-size: 0.9em; }
          .value { font-size: 1.1em; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .footer { margin-top: 50px; font-size: 0.8em; color: #777; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
        </style>
      </head>
      <body>
        <h1>Load Sheet: ${loadSheet.loadSheetNumber}</h1>
        
        <div class="header-grid">
          <div>
            <div class="label">Carrier</div>
            <div class="value">${loadSheet.carrierName || "N/A"}</div>
          </div>
          <div>
             <div class="label">Trailer</div>
             <div class="value">${loadSheet.trailerNumber || "Not Assigned"}</div>
          </div>
          <div>
             <div class="label">Route</div>
             <div class="value">${loadSheet.routeCode || "N/A"}</div>
          </div>
          <div>
             <div class="label">Date</div>
             <div class="value">${new Date(loadSheet.shipmentDate).toLocaleDateString()}</div>
          </div>
           <div>
             <div class="label">Details</div>
             <div class="value">${loadSheet.totalBoxes} items · ${loadSheet.totalWeight} kg</div>
          </div>
        </div>

        <h2>Items</h2>
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Order Ref</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${loadSheet.lines
              .map(
                (line) => `
              <tr>
                <td>${line.sku}</td>
                <td>${line.productName}</td>
                <td>${line.quantity}</td>
                <td>${line.orderNumber || "-"}</td>
                <td>${line.status}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>

        <div class="footer">
          Generated on ${new Date().toLocaleString()} by Flowstock System<br>
          Plan B redundancy document
        </div>
        
        <script>
            // Auto-print when opened
            window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Error generating PDF view:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
