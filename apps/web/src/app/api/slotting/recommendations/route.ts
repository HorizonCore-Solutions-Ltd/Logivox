export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/slotting/recommendations
 * Get slotting recommendations
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organizationMemberships: { include: { organization: true }, take: 1 } },
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const organizationId = user.organizationMemberships[0].organizationId;
    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get('warehouseId');
    const status = searchParams.get('status');

    const recommendations = await prisma.slottingRecommendation.findMany({
      where: {
        organizationId,
        ...(warehouseId && { warehouseId }),
        ...(status && { status: status as any }),
      },
      include: {
        inventoryItem: { select: { sku: true, name: true } },
        currentLocation: { select: { locationCode: true, name: true } },
        recommendedLocation: { select: { locationCode: true, name: true } },
        rule: { select: { name: true } },
        warehouse: { select: { name: true, code: true } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(recommendations);
  } catch (error: any) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
  }
}

/**
 * POST /api/slotting/recommendations/apply
 * Apply selected recommendations
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organizationMemberships: { include: { organization: true }, take: 1 } },
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const organizationId = user.organizationMemberships[0].organizationId;
    const { recommendationIds } = await req.json();

    if (!recommendationIds || !Array.isArray(recommendationIds)) {
      return NextResponse.json({ error: 'recommendationIds array is required' }, { status: 400 });
    }

    const appliedCount = 0;
    const results: any[] = [];

    for (const recId of recommendationIds) {
      const recommendation = await prisma.slottingRecommendation.findFirst({
        where: {
          id: recId,
          organizationId,
          status: 'PENDING',
        },
      });

      if (!recommendation) {
        results.push({ id: recId, success: false, error: 'Recommendation not found or already applied' });
        continue;
      }

      try {
        // Update inventory item location
        await prisma.inventoryItem.update({
          where: { id: recommendation.inventoryItemId },
          data: { locationId: recommendation.recommendedLocationId },
        });

        // Create movement record
        await prisma.inventoryMovement.create({
          data: {
            organizationId,
            inventoryItemId: recommendation.inventoryItemId,
            fromLocationId: recommendation.currentLocationId,
            toLocationId: recommendation.recommendedLocationId,
            quantity: 1, // Placeholder - should be actual quantity
            movementType: 'SLOTTING',
            reason: recommendation.reason,
            status: 'COMPLETED',
          },
        });

        // Update recommendation status
        await prisma.slottingRecommendation.update({
          where: { id: recId },
          data: {
            status: 'APPLIED',
            appliedAt: new Date(),
            appliedById: session.user.id,
          },
        });

        results.push({ id: recId, success: true });
      } catch (error: any) {
        results.push({ id: recId, success: false, error: error.message });
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: session.user.id,
        action: 'SLOTTING_RECOMMENDATIONS_APPLIED',
        entityType: 'SlottingRecommendation',
        metadata: {
          appliedCount: results.filter(r => r.success).length,
          failedCount: results.filter(r => !r.success).length,
        },
      },
    });

    return NextResponse.json({
      success: true,
      appliedCount: results.filter(r => r.success).length,
      failedCount: results.filter(r => !r.success).length,
      results,
    });
  } catch (error: any) {
    console.error('Error applying recommendations:', error);
    return NextResponse.json({ error: 'Failed to apply recommendations' }, { status: 500 });
  }
}
