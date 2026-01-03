import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateCertificationSchema = z.object({
  guardId: z.string(),
  guardName: z.string(),
  certificationType: z.enum(['SIA_LICENSE', 'FIRST_AID', 'FIRE_SAFETY', 'CPR', 'DRIVERS_LICENSE', 'FORKLIFT', 'CCTV_OPERATOR', 'CONFLICT_MANAGEMENT', 'HEALTH_SAFETY', 'OTHER']),
  certificationName: z.string(),
  certificationNumber: z.string().optional(),
  issuer: z.string().optional(),
  issueDate: z.string(),
  expiryDate: z.string().optional(),
  documentUrl: z.string().optional(),
  notes: z.string().optional(),
});

// POST /api/security/certifications - Add certification
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await req.json();
    const body = CreateCertificationSchema.parse(json);

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
    }

    // Determine status based on expiry
    let status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' = 'VALID';
    if (body.expiryDate) {
      const expiryDate = new Date(body.expiryDate);
      const now = new Date();
      const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry < 0) {
        status = 'EXPIRED';
      } else if (daysUntilExpiry <= 30) {
        status = 'EXPIRING_SOON';
      }
    }

    const certification = await prisma.guardCertification.create({
      data: {
        organizationId,
        guardId: body.guardId,
        guardName: body.guardName,
        certificationType: body.certificationType,
        certificationName: body.certificationName,
        certificationNumber: body.certificationNumber,
        issuer: body.issuer,
        issueDate: new Date(body.issueDate),
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        status,
        documentUrl: body.documentUrl,
        notes: body.notes,
      },
    });

    return NextResponse.json(certification);
  } catch (error: any) {
    console.error('Error creating certification:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/security/certifications - List certifications
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
    const guardId = searchParams.get('guardId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const certifications = await prisma.guardCertification.findMany({
      where: {
        organizationId,
        ...(guardId && { guardId }),
        ...(status && { status: status as any }),
        ...(type && { certificationType: type as any }),
      },
      orderBy: [
        { expiryDate: 'asc' },
        { guardName: 'asc' },
      ],
    });

    return NextResponse.json(certifications);
  } catch (error: any) {
    console.error('Error listing certifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
