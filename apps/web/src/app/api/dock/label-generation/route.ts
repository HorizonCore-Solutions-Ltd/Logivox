import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const generateLabelSchema = z.object({
  shipmentId: z.string(),
  carrierId: z.string(),
  carrierService: z.string(),
  fromAddress: z.object({
    name: z.string(),
    company: z.string().optional(),
    addressLine1: z.string(),
    addressLine2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
    phone: z.string(),
  }),
  toAddress: z.object({
    name: z.string(),
    company: z.string().optional(),
    addressLine1: z.string(),
    addressLine2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
    phone: z.string(),
  }),
  packageDetails: z.object({
    weight: z.number().positive(),
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
    weightUnit: z.enum(['LBS', 'KG']),
    dimensionUnit: z.enum(['IN', 'CM']),
  }),
  labelFormat: z.enum(['PDF', 'PNG', 'ZPL']).default('PDF'),
  insuranceValue: z.number().optional(),
  requireSignature: z.boolean().default(false),
});

const batchGenerateSchema = z.object({
  shipmentIds: z.array(z.string()),
  carrierId: z.string(),
  labelFormat: z.enum(['PDF', 'PNG', 'ZPL']).default('PDF'),
});

const getRateSchema = z.object({
  carrierId: z.string(),
  serviceLevel: z.string(),
  fromZip: z.string(),
  toZip: z.string(),
  weight: z.number().positive(),
  dimensions: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
  }),
});

// Mock database
interface ShippingLabel {
  id: string;
  shipmentId: string;
  carrierId: string;
  carrierName: string;
  carrierService: string;
  trackingNumber: string;
  labelUrl: string;
  labelFormat: string;
  status: string;
  generatedAt: Date;
  generatedBy: string;
  cost: number;
  weight: number;
  dimensions: string;
  fromAddress: string;
  toAddress: string;
  estimatedDelivery?: Date;
  voidedAt?: Date;
  voidedBy?: string;
}

interface Carrier {
  id: string;
  name: string;
  code: string;
  logo: string;
  services: Array<{
    id: string;
    name: string;
    transitDays: string;
    features: string[];
  }>;
  apiCredentials?: {
    accountNumber: string;
    apiKey: string;
    endpoint: string;
  };
  status: string;
}

interface RateQuote {
  carrierId: string;
  carrierName: string;
  serviceId: string;
  serviceName: string;
  rate: number;
  estimatedDays: number;
  deliveryDate: Date;
  features: string[];
}

interface LabelMetrics {
  totalLabels: number;
  labelsToday: number;
  avgCostPerLabel: number;
  totalShippingCost: number;
  carrierBreakdown: Array<{
    carrierId: string;
    carrierName: string;
    labelCount: number;
    totalCost: number;
    avgCost: number;
    percentage: number;
  }>;
  serviceBreakdown: Array<{
    service: string;
    count: number;
    percentage: number;
  }>;
  labelsByFormat: Record<string, number>;
}

// Mock data
const carriers: Carrier[] = [
  {
    id: 'ups',
    name: 'UPS',
    code: 'UPS',
    logo: '/carriers/ups-logo.png',
    services: [
      { id: 'ups_ground', name: 'UPS Ground', transitDays: '1-5', features: ['Tracking', 'Signature'] },
      { id: 'ups_2day', name: 'UPS 2nd Day Air', transitDays: '2', features: ['Tracking', 'Signature', 'Insurance'] },
      { id: 'ups_next', name: 'UPS Next Day Air', transitDays: '1', features: ['Tracking', 'Signature', 'Insurance', 'Priority'] },
    ],
    status: 'ACTIVE',
  },
  {
    id: 'fedex',
    name: 'FedEx',
    code: 'FEDEX',
    logo: '/carriers/fedex-logo.png',
    services: [
      { id: 'fedex_ground', name: 'FedEx Ground', transitDays: '1-5', features: ['Tracking'] },
      { id: 'fedex_2day', name: 'FedEx 2Day', transitDays: '2', features: ['Tracking', 'Signature'] },
      { id: 'fedex_overnight', name: 'FedEx Priority Overnight', transitDays: '1', features: ['Tracking', 'Signature', 'Insurance', 'Priority'] },
    ],
    status: 'ACTIVE',
  },
  {
    id: 'usps',
    name: 'USPS',
    code: 'USPS',
    logo: '/carriers/usps-logo.png',
    services: [
      { id: 'usps_priority', name: 'USPS Priority Mail', transitDays: '1-3', features: ['Tracking'] },
      { id: 'usps_express', name: 'USPS Priority Mail Express', transitDays: '1-2', features: ['Tracking', 'Insurance'] },
      { id: 'usps_first', name: 'USPS First Class', transitDays: '1-5', features: ['Tracking'] },
    ],
    status: 'ACTIVE',
  },
];

const labels: ShippingLabel[] = [
  {
    id: 'LBL-001',
    shipmentId: 'SHIP-2401-001',
    carrierId: 'ups',
    carrierName: 'UPS',
    carrierService: 'UPS Ground',
    trackingNumber: '1Z999AA10123456784',
    labelUrl: '/labels/LBL-001.pdf',
    labelFormat: 'PDF',
    status: 'ACTIVE',
    generatedAt: new Date('2024-01-08T08:30:00'),
    generatedBy: 'System',
    cost: 12.45,
    weight: 5.2,
    dimensions: '12x10x8',
    fromAddress: 'Warehouse A, Chicago, IL 60601',
    toAddress: 'Customer A, New York, NY 10001',
    estimatedDelivery: new Date('2024-01-12T17:00:00'),
  },
  {
    id: 'LBL-002',
    shipmentId: 'SHIP-2401-002',
    carrierId: 'fedex',
    carrierName: 'FedEx',
    carrierService: 'FedEx 2Day',
    trackingNumber: '123456789012',
    labelUrl: '/labels/LBL-002.pdf',
    labelFormat: 'PDF',
    status: 'ACTIVE',
    generatedAt: new Date('2024-01-08T09:15:00'),
    generatedBy: 'System',
    cost: 18.75,
    weight: 8.5,
    dimensions: '16x12x10',
    fromAddress: 'Warehouse A, Chicago, IL 60601',
    toAddress: 'Customer B, Los Angeles, CA 90001',
    estimatedDelivery: new Date('2024-01-10T17:00:00'),
  },
];

// Mock carrier API integration
const generateTrackingNumber = (carrierId: string): string => {
  const prefixes: Record<string, string> = {
    ups: '1Z999AA1',
    fedex: '123456',
    usps: '9400',
  };
  const prefix = prefixes[carrierId] || '000000';
  const random = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
  return prefix + random;
};

const calculateShippingRate = (carrierId: string, service: string, weight: number, distance: number): number => {
  // Simplified rate calculation
  const baseRates: Record<string, number> = {
    ups_ground: 8.50,
    ups_2day: 15.00,
    ups_next: 25.00,
    fedex_ground: 8.00,
    fedex_2day: 14.50,
    fedex_overnight: 24.00,
    usps_priority: 7.50,
    usps_express: 20.00,
    usps_first: 5.50,
  };
  
  const baseRate = baseRates[service] || 10.00;
  const weightMultiplier = 1 + (weight / 10);
  const distanceMultiplier = 1 + (distance / 1000);
  
  return parseFloat((baseRate * weightMultiplier * distanceMultiplier).toFixed(2));
};

const estimateDeliveryDate = (service: string): Date => {
  const transitDays: Record<string, number> = {
    ups_ground: 4,
    ups_2day: 2,
    ups_next: 1,
    fedex_ground: 4,
    fedex_2day: 2,
    fedex_overnight: 1,
    usps_priority: 2,
    usps_express: 1,
    usps_first: 3,
  };
  
  const days = transitDays[service] || 3;
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + days);
  return deliveryDate;
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
      case 'generate_label': {
        const data = generateLabelSchema.parse(body);
        
        // Calculate shipping cost (mock calculation)
        const distance = 500; // Mock distance in miles
        const cost = calculateShippingRate(
          data.carrierId,
          data.carrierService,
          data.packageDetails.weight,
          distance
        );

        // Generate tracking number
        const trackingNumber = generateTrackingNumber(data.carrierId);

        // Generate label (in production, call actual carrier API)
        const newLabel: ShippingLabel = {
          id: `LBL-${String(labels.length + 1).padStart(3, '0')}`,
          shipmentId: data.shipmentId,
          carrierId: data.carrierId,
          carrierName: carriers.find(c => c.id === data.carrierId)?.name || 'Unknown',
          carrierService: data.carrierService,
          trackingNumber: trackingNumber,
          labelUrl: `/labels/LBL-${String(labels.length + 1).padStart(3, '0')}.${data.labelFormat.toLowerCase()}`,
          labelFormat: data.labelFormat,
          status: 'ACTIVE',
          generatedAt: new Date(),
          generatedBy: session.user.name || 'Unknown',
          cost: cost,
          weight: data.packageDetails.weight,
          dimensions: `${data.packageDetails.length}x${data.packageDetails.width}x${data.packageDetails.height}`,
          fromAddress: `${data.fromAddress.city}, ${data.fromAddress.state} ${data.fromAddress.postalCode}`,
          toAddress: `${data.toAddress.city}, ${data.toAddress.state} ${data.toAddress.postalCode}`,
          estimatedDelivery: estimateDeliveryDate(data.carrierService),
        };

        labels.push(newLabel);

        return NextResponse.json({
          success: true,
          label: newLabel,
          message: 'Shipping label generated successfully',
        });
      }

      case 'batch_generate': {
        const data = batchGenerateSchema.parse(body);
        
        const generatedLabels: ShippingLabel[] = [];
        
        for (const shipmentId of data.shipmentIds) {
          // In production, fetch shipment details and generate label
          const trackingNumber = generateTrackingNumber(data.carrierId);
          const cost = calculateShippingRate(data.carrierId, 'ground', 5, 500);
          
          const newLabel: ShippingLabel = {
            id: `LBL-${String(labels.length + generatedLabels.length + 1).padStart(3, '0')}`,
            shipmentId: shipmentId,
            carrierId: data.carrierId,
            carrierName: carriers.find(c => c.id === data.carrierId)?.name || 'Unknown',
            carrierService: 'Ground',
            trackingNumber: trackingNumber,
            labelUrl: `/labels/batch-${shipmentId}.${data.labelFormat.toLowerCase()}`,
            labelFormat: data.labelFormat,
            status: 'ACTIVE',
            generatedAt: new Date(),
            generatedBy: session.user.name || 'Unknown',
            cost: cost,
            weight: 5,
            dimensions: '12x10x8',
            fromAddress: 'Warehouse, Chicago, IL',
            toAddress: 'Customer Address',
            estimatedDelivery: new Date(),
          };
          
          generatedLabels.push(newLabel);
        }

        labels.push(...generatedLabels);

        return NextResponse.json({
          success: true,
          labels: generatedLabels,
          count: generatedLabels.length,
          message: `${generatedLabels.length} labels generated successfully`,
        });
      }

      case 'void_label': {
        const { labelId } = body;
        
        const label = labels.find(l => l.id === labelId);
        if (!label) {
          return NextResponse.json({ error: 'Label not found' }, { status: 404 });
        }

        if (label.status === 'VOIDED') {
          return NextResponse.json({ error: 'Label already voided' }, { status: 400 });
        }

        label.status = 'VOIDED';
        label.voidedAt = new Date();
        label.voidedBy = session.user.name || 'Unknown';

        // In production, call carrier API to void label and get refund

        return NextResponse.json({
          success: true,
          label: label,
          refundAmount: label.cost,
          message: 'Label voided successfully',
        });
      }

      case 'get_rates': {
        const data = getRateSchema.parse(body);
        
        const carrier = carriers.find(c => c.id === data.carrierId);
        if (!carrier) {
          return NextResponse.json({ error: 'Carrier not found' }, { status: 404 });
        }

        // Mock distance calculation
        const distance = 500;

        const rates: RateQuote[] = carrier.services.map(service => ({
          carrierId: carrier.id,
          carrierName: carrier.name,
          serviceId: service.id,
          serviceName: service.name,
          rate: calculateShippingRate(carrier.id, service.id, data.weight, distance),
          estimatedDays: parseInt(service.transitDays.split('-')[0]),
          deliveryDate: estimateDeliveryDate(service.id),
          features: service.features,
        }));

        return NextResponse.json({
          success: true,
          rates: rates,
        });
      }

      case 'compare_rates': {
        const { weight, fromZip, toZip, dimensions } = body;
        
        const distance = 500; // Mock
        const allRates: RateQuote[] = [];

        carriers.forEach(carrier => {
          carrier.services.forEach(service => {
            allRates.push({
              carrierId: carrier.id,
              carrierName: carrier.name,
              serviceId: service.id,
              serviceName: service.name,
              rate: calculateShippingRate(carrier.id, service.id, weight, distance),
              estimatedDays: parseInt(service.transitDays.split('-')[0]),
              deliveryDate: estimateDeliveryDate(service.id),
              features: service.features,
            });
          });
        });

        // Sort by rate (cheapest first)
        allRates.sort((a, b) => a.rate - b.rate);

        return NextResponse.json({
          success: true,
          rates: allRates,
          cheapest: allRates[0],
          fastest: allRates.reduce((prev, curr) => 
            prev.estimatedDays < curr.estimatedDays ? prev : curr
          ),
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in label generation API:', error);
    
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
    const labelId = searchParams.get('labelId');

    switch (action) {
      case 'label': {
        if (!labelId) {
          return NextResponse.json({ error: 'Label ID required' }, { status: 400 });
        }

        const label = labels.find(l => l.id === labelId);
        if (!label) {
          return NextResponse.json({ error: 'Label not found' }, { status: 404 });
        }

        return NextResponse.json({ label });
      }

      case 'recent_labels': {
        const limit = parseInt(searchParams.get('limit') || '50');
        const recentLabels = labels
          .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
          .slice(0, limit);

        return NextResponse.json({
          labels: recentLabels,
        });
      }

      case 'carriers': {
        return NextResponse.json({
          carriers: carriers,
        });
      }

      case 'label_metrics': {
        const totalLabels = labels.length;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const labelsToday = labels.filter(l => {
          const labelDate = new Date(l.generatedAt);
          return labelDate >= today;
        }).length;

        const activeLabels = labels.filter(l => l.status === 'ACTIVE');
        const totalCost = activeLabels.reduce((sum, l) => sum + l.cost, 0);
        const avgCostPerLabel = totalLabels > 0 ? totalCost / totalLabels : 0;

        // Carrier breakdown
        const carrierStats = activeLabels.reduce((acc, label) => {
          if (!acc[label.carrierId]) {
            acc[label.carrierId] = {
              carrierId: label.carrierId,
              carrierName: label.carrierName,
              labelCount: 0,
              totalCost: 0,
            };
          }
          acc[label.carrierId].labelCount++;
          acc[label.carrierId].totalCost += label.cost;
          return acc;
        }, {} as Record<string, any>);

        const carrierBreakdown = Object.values(carrierStats).map((stat: any) => ({
          ...stat,
          avgCost: stat.labelCount > 0 ? stat.totalCost / stat.labelCount : 0,
          percentage: totalLabels > 0 ? (stat.labelCount / totalLabels) * 100 : 0,
        })).sort((a, b) => b.labelCount - a.labelCount);

        // Service breakdown
        const serviceStats = activeLabels.reduce((acc, label) => {
          acc[label.carrierService] = (acc[label.carrierService] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const serviceBreakdown = Object.entries(serviceStats).map(([service, count]) => ({
          service,
          count,
          percentage: totalLabels > 0 ? (count / totalLabels) * 100 : 0,
        })).sort((a, b) => b.count - a.count);

        // Labels by format
        const labelsByFormat = labels.reduce((acc, label) => {
          acc[label.labelFormat] = (acc[label.labelFormat] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const metrics: LabelMetrics = {
          totalLabels,
          labelsToday,
          avgCostPerLabel,
          totalShippingCost: totalCost,
          carrierBreakdown,
          serviceBreakdown,
          labelsByFormat,
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
    console.error('Error in label generation API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
