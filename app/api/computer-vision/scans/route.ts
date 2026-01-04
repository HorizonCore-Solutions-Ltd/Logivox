import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/computer-vision/scans
 * Retrieve scan history with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');
    const locationId = searchParams.get('locationId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (mode) {
      where.mode = mode;
    }

    if (locationId) {
      where.locationId = locationId;
    }

    const [scans, total] = await Promise.all([
      prisma.computerVisionScan.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          location: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      }),
      prisma.computerVisionScan.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        scans,
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

  } catch (error) {
    console.error('Failed to fetch scans:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch scans',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/computer-vision/scans/:id
 * Delete a specific scan
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const scanId = searchParams.get('id');

    if (!scanId) {
      return NextResponse.json(
        { error: 'Scan ID is required' },
        { status: 400 }
      );
    }

    // Verify scan belongs to user's organization
    const scan = await prisma.computerVisionScan.findFirst({
      where: {
        id: scanId,
        organizationId: session.user.organizationId,
      },
    });

    if (!scan) {
      return NextResponse.json(
        { error: 'Scan not found' },
        { status: 404 }
      );
    }

    await prisma.computerVisionScan.delete({
      where: { id: scanId },
    });

    return NextResponse.json({
      success: true,
      message: 'Scan deleted successfully',
    });

  } catch (error) {
    console.error('Failed to delete scan:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete scan',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
