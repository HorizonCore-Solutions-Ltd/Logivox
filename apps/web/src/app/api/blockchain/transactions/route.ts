import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transactions = await (prisma as any).blockchainTransaction.findMany({
      orderBy: {
        timestamp: 'desc',
      },
      take: 100,
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching blockchain transactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
