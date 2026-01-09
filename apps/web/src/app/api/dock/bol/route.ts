import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const createBOLSchema = z.object({
  shipmentId: z.string(),
  carrierName: z.string(),
  shipperInfo: z.object({
    name: z.string(),
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    phone: z.string(),
  }),
  consigneeInfo: z.object({
    name: z.string(),
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    phone: z.string(),
  }),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().int().positive(),
    weight: z.number().positive(),
    packageType: z.string(),
    class: z.string().optional(),
    nmfc: z.string().optional(),
  })),
  specialInstructions: z.string().optional(),
  declaredValue: z.number().optional(),
  freightCharges: z.enum(['PREPAID', 'COLLECT', 'THIRD_PARTY']),
});

const signBOLSchema = z.object({
  bolId: z.string(),
  signerName: z.string(),
  signerRole: z.enum(['SHIPPER', 'CARRIER', 'CONSIGNEE']),
  signatureData: z.string(),
  notes: z.string().optional(),
});

const attachDocumentSchema = z.object({
  bolId: z.string(),
  documentType: z.enum(['PACKING_LIST', 'COMMERCIAL_INVOICE', 'CERTIFICATE', 'INSPECTION_REPORT', 'CUSTOM_FORM', 'OTHER']),
  fileName: z.string(),
  fileUrl: z.string(),
  description: z.string().optional(),
});

// Mock database
interface BOL {
  id: string;
  bolNumber: string;
  shipmentId: string;
  carrierName: z.string();
  status: string;
  createdAt: Date;
  createdBy: string;
  shipperInfo: any;
  consigneeInfo: any;
  items: Array<{
    description: string;
    quantity: number;
    weight: number;
    packageType: string;
    class?: string;
    nmfc?: string;
  }>;
  totalWeight: number;
  totalPieces: number;
  specialInstructions?: string;
  declaredValue?: number;
  freightCharges: string;
  signatures: Array<{
    signerName: string;
    signerRole: string;
    signedAt: Date;
    signatureUrl: string;
    notes?: string;
  }>;
  attachedDocuments: Array<{
    id: string;
    documentType: string;
    fileName: string;
    fileUrl: string;
    uploadedAt: Date;
    description?: string;
  }>;
  pdfUrl?: string;
}

interface BOLMetrics {
  totalBOLs: number;
  bolsToday: number;
  pendingSignatures: number;
  completedBOLs: number;
  avgProcessingTime: number;
  complianceRate: number;
  bolsByCarrier: Array<{
    carrier: string;
    count: number;
    percentage: number;
  }>;
  documentTypes: Array<{
    type: string;
    count: number;
  }>;
}

// Mock data
const bols: BOL[] = [
  {
    id: 'BOL-001',
    bolNumber: 'BOL-2024-001234',
    shipmentId: 'SHIP-2401-001',
    carrierName: 'Swift Transport',
    status: 'SIGNED',
    createdAt: new Date('2024-01-08T08:00:00'),
    createdBy: 'System',
    shipperInfo: {
      name: 'Warehouse Solutions Inc',
      address: '123 Industrial Blvd',
      city: 'Chicago',
      state: 'IL',
      zip: '60601',
      phone: '312-555-0100',
    },
    consigneeInfo: {
      name: 'Retail Distributors LLC',
      address: '456 Commerce Ave',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      phone: '212-555-0200',
    },
    items: [
      {
        description: 'Electronic Components - Boxes',
        quantity: 45,
        weight: 235.5,
        packageType: 'Box',
        class: '100',
        nmfc: '12345-03',
      },
      {
        description: 'Industrial Parts - Pallets',
        quantity: 12,
        weight: 480.0,
        packageType: 'Pallet',
        class: '85',
        nmfc: '67890-01',
      },
    ],
    totalWeight: 715.5,
    totalPieces: 57,
    specialInstructions: 'Handle with care. Temperature sensitive.',
    declaredValue: 45000,
    freightCharges: 'PREPAID',
    signatures: [
      {
        signerName: 'John Manager',
        signerRole: 'SHIPPER',
        signedAt: new Date('2024-01-08T08:15:00'),
        signatureUrl: '/signatures/shipper-001.png',
      },
      {
        signerName: 'Mike Driver',
        signerRole: 'CARRIER',
        signedAt: new Date('2024-01-08T08:20:00'),
        signatureUrl: '/signatures/carrier-001.png',
        notes: 'All items loaded and secured',
      },
    ],
    attachedDocuments: [
      {
        id: 'DOC-001',
        documentType: 'PACKING_LIST',
        fileName: 'packing-list-001.pdf',
        fileUrl: '/documents/packing-list-001.pdf',
        uploadedAt: new Date('2024-01-08T08:10:00'),
      },
    ],
    pdfUrl: '/bols/BOL-2024-001234.pdf',
  },
  {
    id: 'BOL-002',
    bolNumber: 'BOL-2024-001235',
    shipmentId: 'SHIP-2401-002',
    carrierName: 'XPO Logistics',
    status: 'PENDING_CARRIER_SIGNATURE',
    createdAt: new Date('2024-01-08T09:30:00'),
    createdBy: 'System',
    shipperInfo: {
      name: 'Warehouse Solutions Inc',
      address: '123 Industrial Blvd',
      city: 'Chicago',
      state: 'IL',
      zip: '60601',
      phone: '312-555-0100',
    },
    consigneeInfo: {
      name: 'West Coast Wholesale',
      address: '789 Pacific Hwy',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90001',
      phone: '310-555-0300',
    },
    items: [
      {
        description: 'Consumer Goods - Mixed Pallets',
        quantity: 28,
        weight: 1240.0,
        packageType: 'Pallet',
        class: '70',
      },
    ],
    totalWeight: 1240.0,
    totalPieces: 28,
    freightCharges: 'PREPAID',
    signatures: [
      {
        signerName: 'Sarah Supervisor',
        signerRole: 'SHIPPER',
        signedAt: new Date('2024-01-08T09:40:00'),
        signatureUrl: '/signatures/shipper-002.png',
      },
    ],
    attachedDocuments: [],
  },
];

const generateBOLNumber = (): string => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `BOL-${year}-${random}`;
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create_bol': {
        const data = createBOLSchema.parse(body);
        
        const totalWeight = data.items.reduce((sum, item) => sum + item.weight, 0);
        const totalPieces = data.items.reduce((sum, item) => sum + item.quantity, 0);

        const newBOL: BOL = {
          id: `BOL-${String(bols.length + 1).padStart(3, '0')}`,
          bolNumber: generateBOLNumber(),
          shipmentId: data.shipmentId,
          carrierName: data.carrierName,
          status: 'DRAFT',
          createdAt: new Date(),
          createdBy: session.user.name || 'Unknown',
          shipperInfo: data.shipperInfo,
          consigneeInfo: data.consigneeInfo,
          items: data.items,
          totalWeight,
          totalPieces,
          specialInstructions: data.specialInstructions,
          declaredValue: data.declaredValue,
          freightCharges: data.freightCharges,
          signatures: [],
          attachedDocuments: [],
        };

        bols.push(newBOL);

        return NextResponse.json({
          success: true,
          bol: newBOL,
          message: 'BOL created successfully',
        });
      }

      case 'sign_bol': {
        const data = signBOLSchema.parse(body);
        
        const bol = bols.find(b => b.id === data.bolId);
        if (!bol) {
          return NextResponse.json({ error: 'BOL not found' }, { status: 404 });
        }

        // Check if role already signed
        const existingSignature = bol.signatures.find(s => s.signerRole === data.signerRole);
        if (existingSignature) {
          return NextResponse.json({ error: 'Role already signed this BOL' }, { status: 400 });
        }

        bol.signatures.push({
          signerName: data.signerName,
          signerRole: data.signerRole,
          signedAt: new Date(),
          signatureUrl: data.signatureData, // In production, save to storage
          notes: data.notes,
        });

        // Update status based on signatures
        if (data.signerRole === 'SHIPPER' && bol.status === 'DRAFT') {
          bol.status = 'PENDING_CARRIER_SIGNATURE';
        } else if (data.signerRole === 'CARRIER' && bol.signatures.some(s => s.signerRole === 'SHIPPER')) {
          bol.status = 'SIGNED';
        } else if (data.signerRole === 'CONSIGNEE') {
          bol.status = 'DELIVERED';
        }

        // Generate PDF if fully signed
        if (bol.status === 'SIGNED' && !bol.pdfUrl) {
          bol.pdfUrl = `/bols/${bol.bolNumber}.pdf`;
        }

        return NextResponse.json({
          success: true,
          bol: bol,
          message: 'BOL signed successfully',
        });
      }

      case 'attach_document': {
        const data = attachDocumentSchema.parse(body);
        
        const bol = bols.find(b => b.id === data.bolId);
        if (!bol) {
          return NextResponse.json({ error: 'BOL not found' }, { status: 404 });
        }

        const newDocument = {
          id: `DOC-${String(bol.attachedDocuments.length + 1).padStart(3, '0')}`,
          documentType: data.documentType,
          fileName: data.fileName,
          fileUrl: data.fileUrl,
          uploadedAt: new Date(),
          description: data.description,
        };

        bol.attachedDocuments.push(newDocument);

        return NextResponse.json({
          success: true,
          document: newDocument,
          message: 'Document attached successfully',
        });
      }

      case 'void_bol': {
        const { bolId, reason } = body;
        
        const bol = bols.find(b => b.id === bolId);
        if (!bol) {
          return NextResponse.json({ error: 'BOL not found' }, { status: 404 });
        }

        if (bol.status === 'DELIVERED' || bol.status === 'VOIDED') {
          return NextResponse.json({ 
            error: 'Cannot void BOL in current status' 
          }, { status: 400 });
        }

        bol.status = 'VOIDED';

        return NextResponse.json({
          success: true,
          bol: bol,
          message: 'BOL voided successfully',
        });
      }

      case 'generate_pdf': {
        const { bolId } = body;
        
        const bol = bols.find(b => b.id === bolId);
        if (!bol) {
          return NextResponse.json({ error: 'BOL not found' }, { status: 404 });
        }

        // In production, generate actual PDF
        bol.pdfUrl = `/bols/${bol.bolNumber}.pdf`;

        return NextResponse.json({
          success: true,
          pdfUrl: bol.pdfUrl,
          message: 'PDF generated successfully',
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in BOL API:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const bolId = searchParams.get('bolId');

    switch (action) {
      case 'bol': {
        if (!bolId) {
          return NextResponse.json({ error: 'BOL ID required' }, { status: 400 });
        }

        const bol = bols.find(b => b.id === bolId);
        if (!bol) {
          return NextResponse.json({ error: 'BOL not found' }, { status: 404 });
        }

        return NextResponse.json({ bol });
      }

      case 'recent_bols': {
        const limit = parseInt(searchParams.get('limit') || '20');
        const recentBOLs = bols
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit);

        return NextResponse.json({
          bols: recentBOLs,
        });
      }

      case 'pending_signatures': {
        const pendingBOLs = bols.filter(
          b => b.status === 'PENDING_CARRIER_SIGNATURE' || b.status === 'DRAFT'
        );

        return NextResponse.json({
          bols: pendingBOLs,
          count: pendingBOLs.length,
        });
      }

      case 'bol_metrics': {
        const totalBOLs = bols.length;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const bolsToday = bols.filter(b => {
          const bolDate = new Date(b.createdAt);
          return bolDate >= today;
        }).length;

        const pendingSignatures = bols.filter(
          b => b.status === 'PENDING_CARRIER_SIGNATURE' || b.status === 'DRAFT'
        ).length;

        const completedBOLs = bols.filter(b => b.status === 'SIGNED' || b.status === 'DELIVERED').length;

        // Calculate average processing time (from creation to full signature)
        const signedBOLs = bols.filter(b => b.status === 'SIGNED' || b.status === 'DELIVERED');
        const processingTimes = signedBOLs
          .filter(b => b.signatures.length >= 2)
          .map(b => {
            const created = new Date(b.createdAt).getTime();
            const lastSigned = Math.max(...b.signatures.map(s => new Date(s.signedAt).getTime()));
            return (lastSigned - created) / 1000 / 60; // minutes
          });

        const avgProcessingTime = processingTimes.length > 0
          ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
          : 0;

        // Compliance rate (BOLs with all required docs)
        const compliantBOLs = bols.filter(b => 
          b.status === 'SIGNED' && b.attachedDocuments.length > 0
        ).length;
        const complianceRate = completedBOLs > 0 ? (compliantBOLs / completedBOLs) * 100 : 0;

        // BOLs by carrier
        const carrierStats = bols.reduce((acc, b) => {
          acc[b.carrierName] = (acc[b.carrierName] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const bolsByCarrier = Object.entries(carrierStats).map(([carrier, count]) => ({
          carrier,
          count,
          percentage: (count / totalBOLs) * 100,
        })).sort((a, b) => b.count - a.count);

        // Document types
        const allDocs = bols.flatMap(b => b.attachedDocuments);
        const docTypeStats = allDocs.reduce((acc, doc) => {
          acc[doc.documentType] = (acc[doc.documentType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const documentTypes = Object.entries(docTypeStats).map(([type, count]) => ({
          type,
          count,
        })).sort((a, b) => b.count - a.count);

        const metrics: BOLMetrics = {
          totalBOLs,
          bolsToday,
          pendingSignatures,
          completedBOLs,
          avgProcessingTime,
          complianceRate,
          bolsByCarrier,
          documentTypes,
        };

        return NextResponse.json({ metrics });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in BOL API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
