import { NextResponse } from 'next/server';
import DocumentService from '@/lib/services/document.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/qc/documents
 * Get all documents
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || 'org-1';
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const where: any = { organizationId };
    if (type) where.type = type;
    if (status) where.status = status;

    const documents = await prisma.document.findMany({
      where,
      include: {
        revisions: {
          orderBy: { changeDate: 'desc' },
          take: 1
        },
        trainingRecords: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: documents
    });

  } catch (error: any) {
    console.error('Get documents error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get documents' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/qc/documents
 * Create new document
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Calculate next review date if not provided
    const nextReviewDate = body.reviewDate 
      ? new Date(body.reviewDate)
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // Default: 1 year

    const document = await prisma.document.create({
      data: {
        docNumber: `DOC-${Date.now()}`,
        organizationId: body.organizationId,
        title: body.title,
        type: body.type,
        description: body.description,
        filePath: body.filePath,
        fileSize: body.fileSize,
        fileType: body.fileType,
        owner: body.owner,
        department: body.department,
        status: 'DRAFT',
        trainingRequired: body.trainingRequired || false,
        effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : null,
        nextReviewDate,
        createdBy: body.createdBy
      }
    });

    return NextResponse.json({
      success: true,
      data: document
    });

  } catch (error: any) {
    console.error('Create document error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create document' },
      { status: 500 }
    );
  }
}
