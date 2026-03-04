import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-guard";
import { withObservability } from "@/lib/middleware/observability";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  return withObservability(async () => {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    // Fetch suppliers with aggregate inspection data
    const suppliers = await prisma.supplier.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        code: true,
        // Calculate dynamic risk score or fetch stored one
        qualityScore: true, // Assuming this field exists or we compute it
        riskLevel: true,    // Assuming this field exists
        _count: {
          select: {
             purchaseOrders: true,
             inspections: true
          }
        },
        inspections: {
           take: 50,
           orderBy: { createdAt: 'desc' },
           select: {
             status: true,
             result: true, // PASS/FAIL
             createdAt: true
           }
        }
      },
      take: 100
    });
    
    // Transform data for UI
    const transformed = suppliers.map(s => {
       const totalInspections = s.inspections.length;
       const failed = s.inspections.filter(i => i.result === 'FAIL').length;
       const defectRate = totalInspections > 0 ? (failed / totalInspections * 100).toFixed(1) : "0.0";
       
       return {
         id: s.id,
         name: s.name,
         code: s.code,
         risk: s.riskLevel || (Number(defectRate) > 5 ? "HIGH" : "LOW"),
         score: s.qualityScore || (100 - (Number(defectRate) * 5)),
         defectRate: `${defectRate}%`,
         lastAudit: s.inspections[0]?.createdAt.toISOString().split('T')[0] || "N/A"
       }
    });

    return NextResponse.json(transformed);
  }, request);
}
