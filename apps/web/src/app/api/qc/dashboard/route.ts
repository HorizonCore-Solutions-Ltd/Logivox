// apps/web/src/app/api/qc/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Using standard auth for dashboard
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Default to user's organization or context
    // In a real app we'd filter strongly by organizationId
    const organizationId = session.user.organizationId; 
    
    if (!organizationId) {
       // Fallback for dev environment if org is missing on user object
       // return NextResponse.json({ error: "No organization context" }, { status: 400 });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 1. Calculate Pass Rate (7d)
    const [totalInspections7d, passedInspections7d] = await Promise.all([
        prisma.qCInspection.count({
            where: {
                organizationId,
                createdAt: { gte: sevenDaysAgo },
                status: 'COMPLETED'
            }
        }),
        prisma.qCInspection.count({
            where: {
                organizationId,
                createdAt: { gte: sevenDaysAgo },
                status: 'COMPLETED',
                result: 'PASS'
            }
        })
    ]);

    const passRate = totalInspections7d > 0 
        ? ((passedInspections7d / totalInspections7d) * 100).toFixed(1) 
        : "100.0"; // Default to 100 if no inspections

    // 2. Pending Inspections
    const pendingInspections = await prisma.qCInspection.count({
        where: {
            organizationId,
            status: { in: ['PENDING', 'IN_PROGRESS', 'ASSIGNED'] }
        }
    });

    // 3. Open CAPAs
    const openCapas = await prisma.correctivePreventiveAction.count({
        where: {
            organizationId,
            status: { in: ['OPEN', 'IN_PROGRESS', 'VERIFICATION'] }
        }
    });
    
    // 4. Critical Open CAPAs (for Actions Required)
    const criticalCapas = await prisma.correctivePreventiveAction.findMany({
        where: {
            organizationId,
            status: { in: ['OPEN', 'IN_PROGRESS'] },
            priority: { in: ['CRITICAL', 'HIGH'] }
        },
        orderBy: { dueDate: 'asc' },
        take: 3,
        select: { id: true, title: true, priority: true, status: true, dueDate: true, capaNumber: true }
    });

    // 5. Recent Activity (Latest Inspections)
    const recentInspections = await prisma.qCInspection.findMany({
        where: {
            organizationId
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
            supplier: { select: { name: true } }
        }
    });

    // 6. Deviations (Fail rate)
    // We can just use (100 - passRate) or count failed inspections specifically
    const failedInspections7d = totalInspections7d - passedInspections7d;
    const deviationRate = totalInspections7d > 0
        ? ((failedInspections7d / totalInspections7d) * 100).toFixed(1)
        : "0.0";


    return NextResponse.json({
        stats: {
            passRate: `${passRate}%`, // String with % for display
            pendingInspections,
            openCapas,
            deviationRate: `${deviationRate}%`
        },
        recentActivity: recentInspections,
        actionRequired: {
            criticalCapas
        }
    });

  } catch (error) {
    console.error("QC Dashboard Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
