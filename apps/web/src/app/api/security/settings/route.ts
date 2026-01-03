import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SECURITY_PRESETS } from '@/lib/security-config';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { securitySettings: true },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Return current settings or default to SMB_CASUAL
    const settings = organization.securitySettings || SECURITY_PRESETS.SMB_CASUAL;

    return NextResponse.json({
      currentSettings: settings,
      availablePresets: Object.keys(SECURITY_PRESETS),
      presets: SECURITY_PRESETS,
    });
  } catch (error) {
    console.error('Error fetching security settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { preset, customSettings } = body;

    let newSettings;

    if (preset && SECURITY_PRESETS[preset as keyof typeof SECURITY_PRESETS]) {
      // Apply preset
      newSettings = SECURITY_PRESETS[preset as keyof typeof SECURITY_PRESETS];
    } else if (customSettings) {
      // Apply custom settings
      newSettings = customSettings;
    } else {
      return NextResponse.json(
        { error: 'Either preset or customSettings must be provided' },
        { status: 400 }
      );
    }

    const organization = await prisma.organization.update({
      where: { id: session.user.organizationId },
      data: { securitySettings: newSettings },
      select: { id: true, name: true, securitySettings: true },
    });

    // Log configuration change
    await prisma.activityLog.create({
      data: {
        organizationId: session.user.organizationId,
        userId: session.user.id,
        action: 'UPDATE',
        entity: 'SECURITY_SETTINGS',
        entityId: organization.id,
        description: preset 
          ? `Applied ${preset} security preset`
          : 'Updated custom security settings',
        metadata: { preset, appliedSettings: newSettings },
      },
    });

    return NextResponse.json({
      success: true,
      message: preset 
        ? `Applied ${preset} security preset successfully`
        : 'Security settings updated successfully',
      settings: organization.securitySettings,
    });
  } catch (error) {
    console.error('Error updating security settings:', error);
    return NextResponse.json(
      { error: 'Failed to update security settings' },
      { status: 500 }
    );
  }
}
