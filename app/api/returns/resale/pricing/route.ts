/**
 * Pricing Recommendation API
 * GET /api/returns/resale/pricing?sku=XXX&condition=GOOD - Get pricing
 */

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ResaleAutomationService } from '@/lib/services/returns/resale-automation';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id, isActive: true },
    });

    if (!membership) {
      return NextResponse.json({ error: 'No active organization' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const sku = searchParams.get('sku');
    const condition = searchParams.get('condition') as any;

    if (!sku || !condition) {
      return NextResponse.json(
        { error: 'SKU and condition are required' },
        { status: 400 }
      );
    }

    // Get product
    const product = await prisma.product.findFirst({
      where: {
        sku,
        organizationId: membership.organizationId,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const resaleService = new ResaleAutomationService();
    const pricing = await resaleService.getPricing({
      productId: product.id,
      sku: product.sku,
      condition,
      originalPrice: product.price?.toNumber() || 0,
    });

    return NextResponse.json({ pricing });
  } catch (error) {
    console.error('Error getting pricing:', error);
    return NextResponse.json(
      { error: 'Failed to get pricing recommendation' },
      { status: 500 }
    );
  }
}
