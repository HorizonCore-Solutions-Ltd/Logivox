/**
 * Resale Automation API
 * GET /api/returns/resale/candidates - List resale candidates
 * POST /api/returns/resale/candidates - Create resale candidate
 * GET /api/returns/resale/listings - List marketplace listings
 * POST /api/returns/resale/listings - Create listing
 * GET /api/returns/resale/pricing - Get pricing recommendation
 */

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ResaleAutomationService } from '@/lib/services/returns/resale-automation';

const createCandidateSchema = z.object({
  rmaItemId: z.string(),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR']),
  notes: z.string().optional(),
});

const createListingSchema = z.object({
  candidateId: z.string(),
  channel: z.enum(['EBAY', 'AMAZON', 'SHOPIFY', 'WALMART', 'MERCARI', 'POSHMARK', 'INTERNAL']),
  price: z.number(),
  quantity: z.number().default(1),
  title: z.string().optional(),
  description: z.string().optional(),
  autoSync: z.boolean().default(true),
});

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
    const type = searchParams.get('type'); // candidates or listings
    const status = searchParams.get('status');
    const channel = searchParams.get('channel');

    if (type === 'listings') {
      let query = `
        SELECT rl.*, rc.sku, rc.condition, p.name as product_name
        FROM resale_listings rl
        JOIN resale_candidates rc ON rc.id = rl.candidate_id
        JOIN "RMAItem" ri ON ri.id = rc.rma_item_id
        JOIN "RMA" r ON r.id = ri.rma_id
        LEFT JOIN "Product" p ON p.id = ri.product_id
        WHERE r.organization_id = $1
      `;

      const params: any[] = [membership.organizationId];

      if (status) {
        query += ` AND rl.status = $${params.length + 1}`;
        params.push(status);
      }

      if (channel) {
        query += ` AND rl.channel = $${params.length + 1}`;
        params.push(channel);
      }

      query += ` ORDER BY rl.created_at DESC LIMIT 100`;

      const listings = await prisma.$queryRawUnsafe(query, ...params);
      return NextResponse.json({ listings });
    }

    // Get candidates
    let query = `
      SELECT rc.*, ri.sku, p.name as product_name, p.sku as product_sku,
             r.rma_number, c.name as customer_name
      FROM resale_candidates rc
      JOIN "RMAItem" ri ON ri.id = rc.rma_item_id
      JOIN "RMA" r ON r.id = ri.rma_id
      LEFT JOIN "Product" p ON p.id = ri.product_id
      LEFT JOIN "Customer" c ON c.id = r.customer_id
      WHERE r.organization_id = $1
    `;

    const params: any[] = [membership.organizationId];

    if (status) {
      query += ` AND rc.status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` ORDER BY rc.created_at DESC LIMIT 100`;

    const candidates = await prisma.$queryRawUnsafe(query, ...params);

    return NextResponse.json({ candidates });
  } catch (error) {
    console.error('Error fetching resale data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resale data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'listing') {
      const data = createListingSchema.parse(body);

      // Get candidate
      const candidate = await prisma.$queryRaw`
        SELECT rc.*, ri.product_id, p.sku, p.name, r.organization_id
        FROM resale_candidates rc
        JOIN "RMAItem" ri ON ri.id = rc.rma_item_id
        JOIN "RMA" r ON r.id = ri.rma_id
        LEFT JOIN "Product" p ON p.id = ri.product_id
        WHERE rc.id = ${data.candidateId}
          AND r.organization_id = ${membership.organizationId}
      ` as any[];

      if (!candidate || candidate.length === 0) {
        return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
      }

      const cand = candidate[0];
      const resaleService = new ResaleAutomationService();

      const listing = await resaleService.createListing({
        candidateId: data.candidateId,
        productId: cand.product_id,
        sku: cand.sku,
        condition: cand.condition,
        channel: data.channel,
        price: data.price,
        quantity: data.quantity,
        title: data.title || cand.name,
        description: data.description,
      });

      await prisma.$executeRaw`
        INSERT INTO resale_listings (
          id, candidate_id, channel, status, price, quantity,
          title, description, metadata, created_at, created_by
        ) VALUES (
          ${listing.id}, ${data.candidateId}, ${data.channel}, ${listing.status},
          ${data.price}, ${data.quantity}, ${listing.title}, ${listing.description},
          '{}'::jsonb, NOW(), ${session.user.id}
        )
      `;

      // Sync to channel if auto-sync enabled
      if (data.autoSync) {
        try {
          const syncResult = await resaleService.syncToChannel(listing.id, data.channel);
          
          await prisma.$executeRaw`
            UPDATE resale_listings
            SET 
              external_id = ${syncResult.externalId},
              external_url = ${syncResult.url},
              status = 'ACTIVE',
              synced_at = NOW()
            WHERE id = ${listing.id}
          `;
        } catch (syncError) {
          console.error('Sync error:', syncError);
          // Continue even if sync fails
        }
      }

      // Update candidate
      await prisma.$executeRaw`
        UPDATE resale_candidates
        SET status = 'LISTED', updated_at = NOW()
        WHERE id = ${data.candidateId}
      `;

      return NextResponse.json({
        listing,
        message: 'Listing created successfully',
      });
    }

    // Create candidate
    const data = createCandidateSchema.parse(body);

    // Verify RMA item
    const rmaItem = await prisma.rMAItem.findFirst({
      where: { id: data.rmaItemId },
      include: {
        rma: true,
        product: true,
      },
    });

    if (!rmaItem || rmaItem.rma.organizationId !== membership.organizationId) {
      return NextResponse.json({ error: 'RMA item not found' }, { status: 404 });
    }

    const resaleService = new ResaleAutomationService();
    const candidate = await resaleService.evaluateForResale({
      productId: rmaItem.productId || '',
      sku: rmaItem.sku || '',
      condition: data.condition,
      originalPrice: rmaItem.unitPrice?.toNumber() || 0,
      returnReason: rmaItem.rma.returnReason as any,
    });

    await prisma.$executeRaw`
      INSERT INTO resale_candidates (
        id, rma_item_id, sku, condition, status,
        original_price, recommended_price, estimated_profit,
        market_data, metadata, created_at, created_by
      ) VALUES (
        ${candidate.id}, ${data.rmaItemId}, ${rmaItem.sku},
        ${data.condition}, 'PENDING', ${candidate.originalPrice},
        ${candidate.recommendedPrice}, ${candidate.estimatedProfit},
        ${JSON.stringify(candidate.marketData)}::jsonb,
        ${JSON.stringify({ notes: data.notes })}::jsonb,
        NOW(), ${session.user.id}
      )
    `;

    // Update RMA item
    await prisma.rMAItem.update({
      where: { id: data.rmaItemId },
      data: { disposition: 'RESELL' },
    });

    return NextResponse.json({
      candidate,
      message: 'Resale candidate created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating resale data:', error);
    return NextResponse.json(
      { error: 'Failed to create resale data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
