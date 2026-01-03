export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema
const getRatesSchema = z.object({
  salesOrderId: z.string(),
  weight: z.number().positive(),
  weightUnit: z.string().optional().default("kg"),
  dimensions: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
    unit: z.string()
  }).optional(),
  carriers: z.array(z.string()).optional() // Optional filter
});

interface ShippingRate {
  carrier: string;
  carrierCode: string;
  service: string;
  serviceCode: string;
  deliveryDays: number;
  estimatedDelivery: string;
  cost: number;
  currency: string;
  available: boolean;
}

/**
 * @route POST /api/shipments/rates
 * @desc Get shipping rates from multiple carriers
 * @access Private
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = getRatesSchema.parse(body);

    // Get organization ID from session
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: {
          where: { isActive: true },
          include: { organization: true }
        }
      }
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json(
        { error: "No active organization found" },
        { status: 403 }
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    // Verify sales order exists
    const salesOrder = await prisma.salesOrder.findFirst({
      where: {
        id: validatedData.salesOrderId,
        organizationId
      },
      include: {
        customer: true
      }
    });

    if (!salesOrder) {
      return NextResponse.json(
        { error: "Sales order not found" },
        { status: 404 }
      );
    }

    // Get active carrier configurations
    const carrierConfigs = await prisma.carrierConfig.findMany({
      where: {
        organizationId,
        isActive: true,
        ...(validatedData.carriers && {
          carrierType: {
            in: validatedData.carriers as any
          }
        })
      }
    });

    // Mock rate calculation (in production, this would call actual carrier APIs)
    const rates: ShippingRate[] = [];
    
    // Define service offerings per carrier
    const services = {
      UPS: [
        { code: "GROUND", name: "UPS Ground", days: 5, baseCost: 15 },
        { code: "3DAY", name: "UPS 3 Day Select", days: 3, baseCost: 25 },
        { code: "2DAY", name: "UPS 2nd Day Air", days: 2, baseCost: 35 },
        { code: "NEXT_DAY", name: "UPS Next Day Air", days: 1, baseCost: 50 }
      ],
      FEDEX: [
        { code: "GROUND", name: "FedEx Ground", days: 5, baseCost: 14 },
        { code: "EXPRESS_SAVER", name: "FedEx Express Saver", days: 3, baseCost: 24 },
        { code: "2DAY", name: "FedEx 2Day", days: 2, baseCost: 33 },
        { code: "PRIORITY_OVERNIGHT", name: "FedEx Priority Overnight", days: 1, baseCost: 48 },
        { code: "STANDARD_OVERNIGHT", name: "FedEx Standard Overnight", days: 1, baseCost: 45 }
      ],
      DHL: [
        { code: "DOMESTIC", name: "DHL Domestic", days: 4, baseCost: 16 },
        { code: "EXPRESS", name: "DHL Express", days: 2, baseCost: 40 },
        { code: "EXPRESS_WORLDWIDE", name: "DHL Express Worldwide", days: 3, baseCost: 55 }
      ],
      USPS: [
        { code: "FIRST_CLASS", name: "USPS First Class", days: 3, baseCost: 8 },
        { code: "PRIORITY", name: "USPS Priority Mail", days: 3, baseCost: 12 },
        { code: "PRIORITY_EXPRESS", name: "USPS Priority Mail Express", days: 1, baseCost: 28 }
      ]
    };

    // Calculate rates based on weight and dimensions
    const weightInLbs = validatedData.weightUnit === "kg" 
      ? validatedData.weight * 2.20462 
      : validatedData.weight;

    // Calculate dimensional weight if dimensions provided
    let dimWeight = 0;
    if (validatedData.dimensions) {
      const { length, width, height, unit } = validatedData.dimensions;
      const dimFactor = unit === "in" ? 139 : 5000; // UPS/FedEx dim factor
      dimWeight = (length * width * height) / dimFactor;
    }

    // Use greater of actual or dimensional weight
    const chargeableWeight = Math.max(weightInLbs, dimWeight);

    // Generate rates for active carriers
    for (const config of carrierConfigs) {
      const carrierServices = services[config.carrierType as keyof typeof services] || [];
      
      for (const service of carrierServices) {
        // Calculate cost based on weight
        const weightFactor = Math.ceil(chargeableWeight);
        const cost = service.baseCost + (weightFactor * 2); // $2 per lb

        // Calculate estimated delivery
        const estimatedDelivery = new Date();
        estimatedDelivery.setDate(estimatedDelivery.getDate() + service.days);

        rates.push({
          carrier: config.carrierName,
          carrierCode: config.carrierType,
          service: service.name,
          serviceCode: service.code,
          deliveryDays: service.days,
          estimatedDelivery: estimatedDelivery.toISOString().split('T')[0] || "",
          cost: parseFloat(cost.toFixed(2)),
          currency: "USD",
          available: true
        });
      }
    }

    // Sort by cost (lowest first)
    rates.sort((a, b) => a.cost - b.cost);

    // If no carrier configs found, return mock data for demo
    if (rates.length === 0) {
      const mockCarriers = ["UPS", "FEDEX", "USPS"];
      for (const carrier of mockCarriers) {
        const carrierServices = services[carrier as keyof typeof services] || [];
        for (const service of carrierServices) {
          const weightFactor = Math.ceil(chargeableWeight);
          const cost = service.baseCost + (weightFactor * 2);
          const estimatedDelivery = new Date();
          estimatedDelivery.setDate(estimatedDelivery.getDate() + service.days);

          rates.push({
            carrier: carrier === "UPS" ? "United Parcel Service" : 
                     carrier === "FEDEX" ? "FedEx" : "United States Postal Service",
            carrierCode: carrier,
            service: service.name,
            serviceCode: service.code,
            deliveryDays: service.days,
            estimatedDelivery: estimatedDelivery.toISOString().split('T')[0] || "",
            cost: parseFloat(cost.toFixed(2)),
            currency: "USD",
            available: true
          });
        }
      }
      rates.sort((a, b) => a.cost - b.cost);
    }

    return NextResponse.json({
      salesOrderId: validatedData.salesOrderId,
      weight: validatedData.weight,
      weightUnit: validatedData.weightUnit,
      chargeableWeight: parseFloat(chargeableWeight.toFixed(2)),
      rates,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Error getting shipping rates:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to get shipping rates" },
      { status: 500 }
    );
  }
}
