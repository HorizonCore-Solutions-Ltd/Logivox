import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/reports/download?type=inventory
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "general";

  // Mock Data Generators
  let csvContent = "";
  const filename = `${type}_report_${new Date().toISOString().split('T')[0]}.csv`;

  switch (type) {
    case "inventory":
        csvContent = "SKU,Description,Quantity,Location,Value\n";
        csvContent += "WIDGET-A,Standard Widget,150,A-01-01,1500.00\n";
        csvContent += "WIDGET-B,Premium Widget,45,B-02-10,900.00\n";
        csvContent += "BOLT-X,Industrial Bolt,5000,C-05-01,250.00\n";
        break;
    case "picking":
        csvContent = "TaskId,User,Wave,Status,TimeTaken\n";
        csvContent += "T-101,John Doe,W-Morning,COMPLETED,45s\n";
        csvContent += "T-102,Jane Smith,W-Morning,COMPLETED,32s\n";
        break;
    default:
        csvContent = "ReportType,Date,Status\n";
        csvContent += `${type},${new Date().toISOString()},Generated\n`;
  }

  // Return CSV File
  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
