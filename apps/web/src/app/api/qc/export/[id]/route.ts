import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "ncr";
    const format = (searchParams.get("format") || "pdf").toLowerCase();

    let data: any;
    let title: string;

    // Fetch data based on type
    switch (type) {
      case "ncr":
        data = await prisma.nonConformanceReport.findUnique({
          where: { id },
        });
        title = `NCR-${data?.ncrNumber || id}`;
        break;
      case "capa":
        data = await prisma.correctivePreventiveAction.findUnique({
          where: { id },
        });
        title = `CAPA-${data?.capaNumber || id}`;
        break;
      case "hold":
        data = await prisma.qualityHold.findUnique({
          where: { id },
        });
        title = `HOLD-${data?.holdNumber || id}`;
        break;
      case "report":
        data = await prisma.qualityReport.findUnique({
          where: { id },
        });
        title = `REPORT-${data?.reportNumber || id}`;
        break;
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const exportData = {
      type,
      title,
      data,
      exportedAt: new Date().toISOString(),
    };

    if (format === "json") {
      return NextResponse.json(exportData, {
        headers: {
          "Content-Disposition": `attachment; filename="${title}.json"`,
        },
      });
    }

    const pdf = await generatePdf(title, exportData);

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${title}.pdf"`,
        "Content-Length": pdf.length.toString(),
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 },
    );
  }
}

async function generatePdf(title: string, payload: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on("data", (chunk) => buffers.push(chunk as Buffer));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      doc.fontSize(18).text(title, { underline: true });
      doc.moveDown();
      doc.fontSize(10).fillColor("gray").text(`Generated: ${new Date().toISOString()}`);
      doc.moveDown();

      doc.fillColor("black").fontSize(12).text("Summary", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).text(`Type: ${payload.type}`);
      doc.text(`Title: ${payload.title}`);
      doc.text(`Exported At: ${payload.exportedAt}`);
      doc.moveDown();

      doc.fontSize(12).text("Data", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).text(JSON.stringify(payload.data, null, 2), {
        width: 500,
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
