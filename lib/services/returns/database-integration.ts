/**
 * Returns Service Database Integration Layer
 * Implements Prisma queries for all return services
 */

import prisma from '@/lib/prisma';
import Stripe from 'stripe';
import crypto from 'crypto';

// Initialize Stripe if configured
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' })
  : null;

// ==========================================
// SERIAL TRACKING DATABASE OPERATIONS
// ==========================================

export async function saveSerialTracking(data: any) {
  return await prisma.serialTracking.create({
    data: {
      rmaId: data.rmaId,
      organizationId: data.organizationId,
      serialNumber: data.serialNumber,
      productSku: data.productSku,
      originalOrderId: data.originalOrderId,
      purchasedDate: data.purchasedDate,
      
      validationStatus: data.validationStatus,
      validationChecks: data.validationChecks,
      
      swapDetected: data.swapDetected,
      swapConfidence: data.swapConfidence,
      swapEvidence: data.swapEvidence,
      counterfeightRisk: data.counterfeightRisk,
      
      lifecycleEvents: data.lifecycleEvents || [],
      
      warrantyStatus: data.warrantyStatus,
      warrantyExpiresAt: data.warrantyExpiresAt,
      
      flagged: data.flagged,
      flagReason: data.flagReason,
      
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

export async function getSerialTracking(serialNumber: string) {
  return await prisma.serialTracking.findFirst({
    where: { serialNumber },
    include: {
      rma: true,
      organization: true,
    },
  });
}

export async function updateSerialLifecycleEvent(serialNumber: string, event: any) {
  const existing = await prisma.serialTracking.findFirst({
    where: { serialNumber },
  });
  
  if (!existing) return null;
  
  return await prisma.serialTracking.update({
    where: { id: existing.id },
    data: {
      lifecycleEvents: {
        push: event,
      },
      updatedAt: new Date(),
    },
  });
}

// ==========================================
// VENDOR CHARGEBACK DATABASE OPERATIONS
// ==========================================

export async function saveVendorChargeback(data: any) {
  return await prisma.vendorChargeback.create({
    data: {
      organizationId: data.organizationId,
      supplierId: data.supplierId,
      rmaIds: data.rmaIds,
      
      defectRate: data.defectRate,
      defectThreshold: data.defectThreshold,
      
      merchandiseCost: data.merchandiseCost,
      inspectionCost: data.inspectionCost,
      handlingFees: data.handlingFees,
      shippingCost: data.shippingCost,
      penaltyAmount: data.penaltyAmount,
      totalChargebackAmount: data.totalChargebackAmount,
      
      invoiceNumber: data.invoiceNumber,
      invoiceUrl: data.invoiceUrl,
      
      disputeStatus: data.disputeStatus,
      disputeReason: data.disputeReason,
      disputeDocuments: data.disputeDocuments || [],
      disputeResolution: data.disputeResolution,
      
      paymentDeduction: data.paymentDeduction,
      
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

export async function getVendorChargebacks(filters: any) {
  return await prisma.vendorChargeback.findMany({
    where: {
      organizationId: filters.organizationId,
      supplierId: filters.supplierId,
      disputeStatus: filters.status,
    },
    include: {
      supplier: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function updateChargebackDispute(chargebackId: string, data: any) {
  return await prisma.vendorChargeback.update({
    where: { id: chargebackId },
    data: {
      disputeStatus: data.status,
      disputeReason: data.reason,
      disputeDocuments: data.documents,
      disputeResolution: data.resolution,
      disputeResolvedAt: data.resolvedAt,
      updatedAt: new Date(),
    },
  });
}

// ==========================================
// SUSTAINABILITY DATABASE OPERATIONS
// ==========================================

export async function saveSustainabilityReport(data: any) {
  return await prisma.sustainabilityReport.create({
    data: {
      organizationId: data.organizationId,
      rmaId: data.rmaId,
      reportType: data.reportType,
      period: data.period,
      
      // Carbon footprint
      shippingEmissions: data.shippingEmissions,
      packagingEmissions: data.packagingEmissions,
      processingEmissions: data.processingEmissions,
      totalCO2Emissions: data.totalCO2Emissions,
      totalCO2Saved: data.totalCO2Saved,
      
      // Circularity
      circularityScore: data.circularityScore,
      circularityGrade: data.circularityGrade,
      restockedCount: data.restockedCount,
      refurbishedCount: data.refurbishedCount,
      donatedCount: data.donatedCount,
      recycledCount: data.recycledCount,
      scrapCount: data.scrapCount,
      
      // Product lifecycle
      productLifecycleExtension: data.productLifecycleExtension,
      secondLifeRevenue: data.secondLifeRevenue,
      
      // Customer engagement
      greenScore: data.greenScore,
      customerMessage: data.customerMessage,
      
      // Certifications
      certifications: data.certifications || [],
      
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

export async function getSustainabilityReports(filters: any) {
  return await prisma.sustainabilityReport.findMany({
    where: {
      organizationId: filters.organizationId,
      reportType: filters.reportType,
      createdAt: filters.period ? {
        gte: filters.period.start,
        lte: filters.period.end,
      } : undefined,
    },
    include: {
      rma: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

// ==========================================
// CROSS-BORDER DATABASE OPERATIONS
// ==========================================

export async function saveCrossBorderReturn(data: any) {
  return await prisma.crossBorderReturn.create({
    data: {
      rmaId: data.rmaId,
      organizationId: data.organizationId,
      
      originCountry: data.originCountry,
      destinationCountry: data.destinationCountry,
      
      routingDecision: data.routingDecision,
      routingReasoning: data.routingReasoning,
      localWarehouseId: data.localWarehouseId,
      localPartner: data.localPartner,
      estimatedCostSavings: data.estimatedCostSavings,
      
      dutyPaid: data.dutyPaid,
      vatPaid: data.vatPaid,
      dutyRefund: data.dutyRefund,
      vatRefund: data.vatRefund,
      
      customsDeclaration: data.customsDeclaration,
      customsStatus: data.customsStatus,
      customsClearanceDate: data.customsClearanceDate,
      
      originalCurrency: data.originalCurrency,
      refundCurrency: data.refundCurrency,
      exchangeRate: data.exchangeRate,
      refundAmountOriginal: data.refundAmountOriginal,
      refundAmountConverted: data.refundAmountConverted,
      
      complianceChecks: data.complianceChecks || [],
      
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

export async function getCrossBorderReturns(filters: any) {
  return await prisma.crossBorderReturn.findMany({
    where: {
      organizationId: filters.organizationId,
      originCountry: filters.country,
      customsStatus: filters.status,
    },
    include: {
      rma: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

// ==========================================
// PREDICTIVE ANALYTICS DATABASE OPERATIONS
// ==========================================

export async function saveReturnRiskPrediction(data: any) {
  return await prisma.returnRiskPrediction.create({
    data: {
      orderId: data.orderId,
      organizationId: data.organizationId,
      rmaId: data.rmaId,
      
      overallRiskScore: data.overallRiskScore,
      riskLevel: data.riskLevel,
      returnProbability: data.returnProbability,
      willReturn: data.willReturn,
      
      productRiskScore: data.productRiskScore,
      customerRiskScore: data.customerRiskScore,
      orderRiskScore: data.orderRiskScore,
      seasonalRiskScore: data.seasonalRiskScore,
      
      riskFactors: data.riskFactors || [],
      preventionOpportunities: data.preventionOpportunities || [],
      preventionActions: data.preventionActions || [],
      
      predictedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

export async function saveProductReturnAnalysis(data: any) {
  return await prisma.productReturnAnalysis.create({
    data: {
      organizationId: data.organizationId,
      productSku: data.productSku,
      
      totalSold: data.totalSold,
      totalReturned: data.totalReturned,
      returnRate: data.returnRate,
      
      financialImpact: data.financialImpact,
      projectedAnnualLoss: data.projectedAnnualLoss,
      
      rootCauses: data.rootCauses || [],
      recommendations: data.recommendations || [],
      
      listingQualityScore: data.listingQualityScore,
      
      customerSentiment: data.customerSentiment,
      
      analysisDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

export async function saveCustomerReturnProfile(data: any) {
  return await prisma.customerReturnProfile.upsert({
    where: {
      customerId: data.customerId,
    },
    create: {
      customerId: data.customerId,
      organizationId: data.organizationId,
      
      totalOrders: data.totalOrders,
      totalReturns: data.totalReturns,
      returnRate: data.returnRate,
      
      serialReturner: data.serialReturner,
      wardrobingDetected: data.wardrobingDetected,
      bracketingDetected: data.bracketingDetected,
      
      riskScore: data.riskScore,
      riskTier: data.riskTier,
      
      lifetimeValue: data.lifetimeValue,
      lifetimeReturnValue: data.lifetimeReturnValue,
      
      recommendations: data.recommendations || [],
      
      instantRefundsReceived: data.instantRefundsReceived || 0,
      instantRefundsAbused: data.instantRefundsAbused || 0,
      
      lastReturnDate: data.lastReturnDate,
      
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    update: {
      totalOrders: data.totalOrders,
      totalReturns: data.totalReturns,
      returnRate: data.returnRate,
      serialReturner: data.serialReturner,
      wardrobingDetected: data.wardrobingDetected,
      bracketingDetected: data.bracketingDetected,
      riskScore: data.riskScore,
      riskTier: data.riskTier,
      lifetimeValue: data.lifetimeValue,
      lifetimeReturnValue: data.lifetimeReturnValue,
      recommendations: data.recommendations,
      instantRefundsReceived: data.instantRefundsReceived,
      instantRefundsAbused: data.instantRefundsAbused,
      lastReturnDate: data.lastReturnDate,
      updatedAt: new Date(),
    },
  });
}

// ==========================================
// RETURN AGGREGATION DATABASE OPERATIONS
// ==========================================

export async function saveAggregatedReturn(data: any) {
  return await prisma.aggregatedReturn.create({
    data: {
      organizationId: data.organizationId,
      customerId: data.customerId,
      rmaIds: data.rmaIds,
      
      totalItems: data.totalItems,
      totalWeight: data.totalWeight,
      
      originalShippingCost: data.originalShippingCost,
      aggregatedShippingCost: data.aggregatedShippingCost,
      costSavings: data.costSavings,
      savingsPercentage: data.savingsPercentage,
      
      consolidatedLabel: data.consolidatedLabel,
      trackingNumber: data.trackingNumber,
      carrier: data.carrier,
      
      packingInstructions: data.packingInstructions || [],
      
      status: data.status,
      
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

export async function findAggregatableReturns(customerId: string, organizationId: string) {
  const returns = await prisma.rMA.findMany({
    where: {
      customerId,
      organizationId,
      status: {
        in: ['PENDING', 'APPROVED'],
      },
      aggregatedReturnId: null, // Not already aggregated
      createdAt: {
        gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // Last 14 days
      },
    },
    include: {
      items: true,
      customer: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  
  return returns;
}

// ==========================================
// STRIPE PAYMENT INTEGRATION
// ==========================================

export async function processStripeRefund(params: {
  paymentIntentId: string;
  amount: number;
  refundId: string;
  customerId: string;
}) {
  if (!stripe) {
    console.warn('Stripe not configured');
    return { success: true, refundId: `mock_${params.refundId}` };
  }
  
  try {
    const refund = await stripe.refunds.create({
      payment_intent: params.paymentIntentId,
      amount: Math.round(params.amount * 100), // Convert to cents
      reason: 'requested_by_customer',
      metadata: {
        refundId: params.refundId,
        customerId: params.customerId,
        type: 'instant_refund',
      },
    });
    
    return {
      success: true,
      stripeRefundId: refund.id,
      status: refund.status,
    };
  } catch (error: any) {
    console.error('Stripe refund failed:', error);
    throw new Error(`Refund processing failed: ${error.message}`);
  }
}

// ==========================================
// ENCRYPTION/SECURITY UTILITIES
// ==========================================

export function encryptQRPayload(text: string): string {
  const key = process.env.QR_CODE_ENCRYPTION_KEY || 'default-dev-key-32-chars-long!';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key.substring(0, 32)), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

export function decryptQRPayload(text: string): string {
  const key = process.env.QR_CODE_ENCRYPTION_KEY || 'default-dev-key-32-chars-long!';
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key.substring(0, 32)), iv);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

export function generateQRSignature(payload: string): string {
  const secret = process.env.QR_CODE_SIGNATURE_SECRET || 'default-secret-key';
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
    .substring(0, 16);
}

export function verifyQRSignature(payload: string, signature: string): boolean {
  const expected = generateQRSignature(payload);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// ==========================================
// EXCHANGE RATE API (Cross-Border)
// ==========================================

export async function getExchangeRate(from: string, to: string): Promise<number> {
  // Mock implementation - in production, use real API
  // Examples: Fixer.io, ExchangeRate-API, Open Exchange Rates
  const mockRates: Record<string, number> = {
    'USD-EUR': 0.85,
    'USD-GBP': 0.73,
    'USD-CAD': 1.25,
    'EUR-USD': 1.18,
    'GBP-USD': 1.37,
    'CAD-USD': 0.80,
  };
  
  const key = `${from}-${to}`;
  return mockRates[key] || 1.0;
}
