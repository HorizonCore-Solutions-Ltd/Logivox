import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const lprCaptureSchema = z.object({
  licensePlate: z.string().min(1),
  confidence: z.number().min(0).max(100),
  gateId: z.string(),
  imageUrl: z.string().url().optional(),
  timestamp: z.string().datetime(),
  direction: z.enum(['IN', 'OUT']),
  cameraId: z.string().optional(),
  vehicleType: z.string().optional(),
  organizationId: z.string(), // API key will map to organization
});

export async function POST(req: NextRequest) {
  try {
    // Verify API key from headers
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }

    // Validate API key and get organization
    const validApiKey = await prisma.apiKey.findFirst({
      where: {
        key: apiKey,
        isActive: true,
      },
      include: {
        organization: true,
      },
    });

    if (!validApiKey) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const body = await req.json();
    const data = lprCaptureSchema.parse({
      ...body,
      organizationId: validApiKey.organizationId,
    });

    // Only process high-confidence reads (> 80%)
    if (data.confidence < 80) {
      return NextResponse.json({
        status: 'LOW_CONFIDENCE',
        message: 'Confidence too low for automatic processing',
        requiresManualReview: true,
      });
    }

    const licensePlate = data.licensePlate.toUpperCase();

    // Check blacklist first
    const blacklisted = await prisma.vehicleBlacklist.findFirst({
      where: {
        organizationId: validApiKey.organizationId,
        licensePlate,
        isActive: true,
        OR: [
          { bannedUntil: null },
          { bannedUntil: { gte: new Date() } },
        ],
      },
    });

    if (blacklisted) {
      // Create alert for blacklisted vehicle
      await prisma.securityAlert.create({
        data: {
          organizationId: validApiKey.organizationId,
          type: 'BLACKLISTED_VEHICLE',
          severity: blacklisted.severity === 'PERMANENT' || blacklisted.severity === 'CRITICAL'
            ? 'CRITICAL'
            : 'HIGH',
          message: `BLACKLISTED VEHICLE DETECTED: ${licensePlate} - ${blacklisted.reason}`,
          metadata: {
            licensePlate,
            blacklistId: blacklisted.id,
            severity: blacklisted.severity,
            gateId: data.gateId,
            imageUrl: data.imageUrl,
          },
        },
      });

      return NextResponse.json({
        status: 'BLOCKED',
        reason: 'BLACKLISTED',
        severity: blacklisted.severity,
        message: blacklisted.reason,
        alert: true,
      });
    }

    // Check whitelist
    const whitelisted = await prisma.vehicleWhitelist.findFirst({
      where: {
        organizationId: validApiKey.organizationId,
        type: 'VEHICLE',
        identifier: licensePlate,
        isActive: true,
        validFrom: { lte: new Date() },
        OR: [
          { validUntil: null },
          { validUntil: { gte: new Date() } },
        ],
      },
    });

    // Check if vehicle has an appointment
    const appointment = await prisma.dockAppointment.findFirst({
      where: {
        organizationId: validApiKey.organizationId,
        licensePlate,
        scheduledArrival: {
          gte: new Date(Date.now() - 4 * 60 * 60 * 1000), // -4 hours
          lte: new Date(Date.now() + 4 * 60 * 60 * 1000), // +4 hours
        },
        status: { in: ['SCHEDULED', 'CHECKED_IN'] },
      },
    });

    // Auto-create gate entry if whitelisted and/or has appointment
    if ((whitelisted && whitelisted.autoApprove) || appointment) {
      const gate = await prisma.gate.findFirst({
        where: { id: data.gateId },
      });

      const gateEntry = await prisma.gateEntry.create({
        data: {
          organizationId: validApiKey.organizationId,
          entryNumber: `LPR-${Date.now()}`,
          entryType: 'DELIVERY',
          direction: data.direction,
          warehouseId: gate?.warehouseId,
          gateNumber: gate?.gateNumber,
          licensePlate,
          vehicleType: data.vehicleType as any,
          entryTime: new Date(data.timestamp),
          securityCheckPassed: whitelisted?.skipInspection || false,
          appointmentId: appointment?.id,
          metadata: {
            source: 'LPR_AUTO',
            confidence: data.confidence,
            cameraId: data.cameraId,
            imageUrl: data.imageUrl,
          },
        },
      });

      // Create photo record from LPR capture
      if (data.imageUrl) {
        await prisma.gatePhoto.create({
          data: {
            gateEntryId: gateEntry.id,
            photoType: 'LICENSE_PLATE',
            photoUrl: data.imageUrl,
            capturedAt: new Date(data.timestamp),
            description: `LPR Auto-capture (${data.confidence}% confidence)`,
          },
        });
      }

      return NextResponse.json({
        status: 'AUTO_APPROVED',
        reason: whitelisted ? 'WHITELISTED' : 'HAS_APPOINTMENT',
        gateEntry,
        skipWeighBridge: whitelisted?.skipWeighBridge || false,
        skipInspection: whitelisted?.skipInspection || false,
      });
    }

    // Not auto-approved - add to queue for manual processing
    const queueEntry = await prisma.gateQueue.create({
      data: {
        organizationId: validApiKey.organizationId,
        licensePlate,
        gateId: data.gateId,
        position: await prisma.gateQueue.count({
          where: {
            organizationId: validApiKey.organizationId,
            status: { in: ['WAITING', 'CALLED'] },
          },
        }) + 1,
        status: 'WAITING',
        metadata: {
          source: 'LPR',
          confidence: data.confidence,
          cameraId: data.cameraId,
          imageUrl: data.imageUrl,
        },
      },
    });

    return NextResponse.json({
      status: 'PENDING_MANUAL_REVIEW',
      reason: 'NOT_WHITELISTED',
      queueEntry,
      requiresApproval: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error processing LPR capture:', error);
    return NextResponse.json(
      { error: 'Failed to process LPR capture' },
      { status: 500 }
    );
  }
}
