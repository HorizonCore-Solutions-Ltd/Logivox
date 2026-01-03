import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { put } from '@vercel/blob';

const uploadDocumentSchema = z.object({
  documentType: z.enum([
    'BILL_OF_LADING',
    'MANIFEST',
    'PERMIT',
    'INSURANCE',
    'CUSTOMS',
    'INSPECTION',
    'OTHER',
  ]),
  documentNumber: z.string().optional(),
  expiryDate: z.string().datetime().optional(),
  verified: z.boolean().default(false),
  notes: z.string().optional(),
});

const verifyDocumentSchema = z.object({
  verified: z.boolean(),
  verifiedBy: z.string().optional(),
  notes: z.string().optional(),
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
    const documentType = formData.get('documentType') as string;
    const documentNumber = formData.get('documentNumber') as string | null;
    const expiryDate = formData.get('expiryDate') as string | null;
    const notes = formData.get('notes') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const data = uploadDocumentSchema.parse({
      documentType,
      documentNumber: documentNumber || undefined,
      expiryDate: expiryDate || undefined,
      notes: notes || undefined,
    });

    // Upload to blob storage
    const blob = await put(
      `gate-documents/${gateEntryId}/${Date.now()}-${file.name}`,
      file,
      {
        access: 'public',
      }
    );

    // Create document record
    const document = await prisma.gateDocument.create({
      data: {
        gateEntryId,
        documentType: data.documentType,
        documentUrl: blob.url,
        documentNumber: data.documentNumber,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        verified: data.verified,
        uploadedBy: session.user.id,
        notes: data.notes,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
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
    const documentType = searchParams.get('documentType');
    const verified = searchParams.get('verified');

    const where: any = { gateEntryId };
    if (documentType) {
      where.documentType = documentType;
    }
    if (verified !== null) {
      where.verified = verified === 'true';
    }

    const documents = await prisma.gateDocument.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}
