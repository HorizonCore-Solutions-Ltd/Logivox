/**
 * Customer Portal API
 * Public tracking and photo upload
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Track load sheet by number (public)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const number = searchParams.get('number');

    if (!number) {
      return NextResponse.json(
        { error: 'Tracking number is required' },
        { status: 400 }
      );
    }

    // Find load sheet by number (public access)
    const loadSheet = await prisma.loadSheet.findFirst({
      where: {
        loadSheetNumber: number,
      },
      include: {
        customer: {
          select: {
            name: true,
            code: true,
          },
        },
        bayDoor: {
          select: {
            doorNumber: true,
          },
        },
        containers: {
          include: {
            containerItems: {
              select: {
                productName: true,
                quantity: true,
                sku: true,
              },
            },
          },
        },
        events: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!loadSheet) {
      return NextResponse.json(
        { error: 'Load sheet not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      loadSheet,
      message: 'Load sheet found',
    });
  } catch (error) {
    console.error('Customer track error:', error);
    return NextResponse.json(
      { error: 'Failed to track shipment' },
      { status: 500 }
    );
  }
}
