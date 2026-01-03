import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const incidentSchema = z.object({
  incidentType: z.enum([
    'THEFT',
    'VANDALISM',
    'TRESPASSING',
    'FIRE',
    'MEDICAL_EMERGENCY',
    'SAFETY_VIOLATION',
    'UNAUTHORIZED_ACCESS',
    'EQUIPMENT_DAMAGE',
    'VEHICLE_ACCIDENT',
    'OTHER'
  ]),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  title: z.string().min(1),
  description: z.string(),
  location: z.string(),
  incidentTime: z.string().datetime(),
  reportedById: z.string(),
  reportedByName: z.string().optional(),
  reportedByRole: z.string().optional(),
  witnessNames: z.array(z.string()).optional(),
  injuriesReported: z.boolean().default(false),
  injuryDetails: z.string().optional(),
  policeNotified: z.boolean().default(false),
  policeReportNumber: z.string().optional(),
  evidencePhotos: z.array(z.string()).optional(),
  evidenceVideos: z.array(z.string()).optional(),
  cameraFootage: z.string().optional(),
  estimatedLoss: z.number().optional(),
  actionsTaken: z.string().optional(),
  investigatorId: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Filters
    const incidentType = searchParams.get('incidentType');
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (incidentType) where.incidentType = incidentType;
    if (severity) where.severity = severity;
    if (status) where.status = status;
    
    if (startDate || endDate) {
      where.incidentTime = {};
      if (startDate) where.incidentTime.gte = new Date(startDate);
      if (endDate) where.incidentTime.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { incidentNumber: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [incidents, total] = await Promise.all([
      prisma.securityIncident.findMany({
        where,
        skip,
        take: limit,
        orderBy: { incidentTime: 'desc' },
        include: {
          reportedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              badgeNumber: true,
            },
          },
          investigator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              badgeNumber: true,
            },
          },
        },
      }),
      prisma.securityIncident.count({ where }),
    ]);

    return NextResponse.json({
      data: incidents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching security incidents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security incidents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = incidentSchema.parse(body);

    // Generate incident number
    const lastIncident = await prisma.securityIncident.findFirst({
      where: { organizationId: session.user.organizationId },
      orderBy: { createdAt: 'desc' },
      select: { incidentNumber: true },
    });

    const lastNumber = lastIncident?.incidentNumber 
      ? parseInt(lastIncident.incidentNumber.replace(/\D/g, '')) 
      : 0;
    const incidentNumber = `INC${String(lastNumber + 1).padStart(6, '0')}`;

    const incident = await prisma.securityIncident.create({
      data: {
        ...validatedData,
        organizationId: session.user.organizationId,
        incidentNumber,
        incidentTime: new Date(validatedData.incidentTime),
        status: 'REPORTED',
      },
      include: {
        reportedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            badgeNumber: true,
          },
        },
        investigator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            badgeNumber: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: session.user.organizationId,
        userId: session.user.id,
        action: 'CREATE',
        entity: 'SECURITY_INCIDENT',
        entityId: incident.id,
        description: `Reported ${validatedData.incidentType} incident: ${validatedData.title}`,
        metadata: {
          incidentNumber,
          severity: validatedData.severity,
          location: validatedData.location,
        },
      },
    });

    return NextResponse.json(incident, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating security incident:', error);
    return NextResponse.json(
      { error: 'Failed to create security incident' },
      { status: 500 }
    );
  }
}
