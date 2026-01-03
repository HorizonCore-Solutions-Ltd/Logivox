import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { put } from '@vercel/blob';

const uploadPhotoSchema = z.object({
  photoType: z.enum([
    'DRIVER_ID',
    'DRIVER_FACE',
    'TRUCK_FRONT',
    'TRUCK_SIDE',
    'TRUCK_REAR',
    'CARGO',
    'SEAL',
    'DAMAGE',
    'LICENSE_PLATE',
    'OTHER',
  ]),
  description: z.string().optional(),
  capturedBy: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const gateEntryId = params.id;

    // Verify gate entry exists and belongs to organization
    const gateEntry = await prisma.gateEntry.findFirst({
      where: {
        id: gateEntryId,
        organizationId: session.user.organizationId,
      },
    });

    if (!gateEntry) {
      return NextResponse.json({ error: 'Gate entry not found' }, { status: 404 });
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const photoType = formData.get('photoType') as string;
    const description = formData.get('description') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const data = uploadPhotoSchema.parse({
      photoType,
      description: description || undefined,
      capturedBy: session.user.id,
    });

    // Upload to blob storage
    const blob = await put(
      `gate-photos/${gateEntryId}/${Date.now()}-${file.name}`,
      file,
      {
        access: 'public',
      }
    );

    // Create photo record
    const photo = await prisma.gatePhoto.create({
      data: {
        gateEntryId,
        photoType: data.photoType,
        photoUrl: blob.url,
        description: data.description,
        capturedBy: data.capturedBy,
        capturedAt: new Date(),
      },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error uploading photo:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const gateEntryId = params.id;

    // Verify gate entry exists and belongs to organization
    const gateEntry = await prisma.gateEntry.findFirst({
      where: {
        id: gateEntryId,
        organizationId: session.user.organizationId,
      },
    });

    if (!gateEntry) {
      return NextResponse.json({ error: 'Gate entry not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const photoType = searchParams.get('photoType');

    const where: any = { gateEntryId };
    if (photoType) {
      where.photoType = photoType;
    }

    const photos = await prisma.gatePhoto.findMany({
      where,
      orderBy: { capturedAt: 'desc' },
    });

    return NextResponse.json({ photos });
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    );
  }
}
