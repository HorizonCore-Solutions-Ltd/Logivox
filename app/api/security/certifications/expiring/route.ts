import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/security/certifications/expiring - Get expiring certifications
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const daysParam = searchParams.get('days');
    const days = daysParam ? parseInt(daysParam) : 30;

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    const certifications = await prisma.guardCertification.findMany({
      where: {
        organizationId,
        status: { in: ['VALID', 'EXPIRING_SOON'] },
        expiryDate: {
          lte: expiryDate,
          gte: new Date(),
        },
      },
      orderBy: { expiryDate: 'asc' },
    });

    return NextResponse.json(certifications);
  } catch (error: any) {
    console.error('Error fetching expiring certifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
