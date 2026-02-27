/**
 * Instant Refund Service
 *
 * Evaluates customer trust scores and processes instant refunds for qualifying RMAs.
 * Requires a connected payment processor (e.g., Stripe) for live disbursements.
 * When STRIPE_SECRET_KEY is not configured, refund is recorded in DB as PENDING_PROCESSOR.
 */

import { prisma } from "@/lib/prisma";

function getPaymentIntentId(metadata: unknown): string | undefined {
  if (!metadata || typeof metadata !== "object") return undefined;
  const value = (metadata as Record<string, unknown>).paymentIntentId;
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

export type RefundMethod =
  | "ORIGINAL_PAYMENT"
  | "STORE_CREDIT"
  | "BANK_TRANSFER"
  | "CHECK";

interface EligibilityResult {
  eligible: boolean;
  trustScore: number;
  trustTier: "PLATINUM" | "GOLD" | "SILVER" | "BASIC";
  trustFactors: Record<string, number>;
  riskFactors: Record<string, string>;
  estimatedRefundAmount: number;
  reason?: string;
}

interface InstantRefundResult {
  id: string;
  rmaId: string;
  refundAmount: number;
  refundMethod: string;
  transactionId: string;
  verificationDeadline: Date;
  verificationStatus: "PENDING" | "VERIFIED" | "FAILED";
  requiresPhotos: boolean;
  requiresSerialNumber: boolean;
  requiresTrackingUpdate: boolean;
  requiresSignature: boolean;
}

const TRUST_TIER_THRESHOLDS = {
  PLATINUM: 85,
  GOLD: 70,
  SILVER: 55,
  BASIC: 0,
} as const;

function getTrustTier(
  score: number,
): "PLATINUM" | "GOLD" | "SILVER" | "BASIC" {
  if (score >= TRUST_TIER_THRESHOLDS.PLATINUM) return "PLATINUM";
  if (score >= TRUST_TIER_THRESHOLDS.GOLD) return "GOLD";
  if (score >= TRUST_TIER_THRESHOLDS.SILVER) return "SILVER";
  return "BASIC";
}

/** Minimum trust score required for instant refund eligibility */
const MIN_SCORE_FOR_INSTANT = 55;

/**
 * Compute a trust score for a customer based on their order/return history.
 */
async function computeTrustScore(
  customerId: string,
  organizationId: string,
): Promise<{
  score: number;
  factors: Record<string, number>;
  riskFactors: Record<string, string>;
}> {
  const [customer, orders, priorRmas] = await Promise.all([
    prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, createdAt: true },
    }),
    prisma.salesOrder.findMany({
      where: { customerId, organizationId },
      select: {
        id: true,
        status: true,
        createdAt: true,
        total: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.rMA.findMany({
      where: { customerId, organizationId },
      select: {
        id: true,
        status: true,
        createdAt: true,
        instantRefund: { select: { verificationStatus: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  if (!customer) {
    return {
      score: 0,
      factors: {},
      riskFactors: { customer: "Customer not found" },
    };
  }

  const factors: Record<string, number> = {};
  const riskFactors: Record<string, string> = {};

  // Account age (max 20 points)
  const ageMonths =
    (Date.now() - customer.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30);
  factors.accountAge = Math.min(20, Math.round(ageMonths / 3));

  // Order history (max 30 points)
  const completedOrders = orders.filter((o) =>
    ["DELIVERED", "FULFILLED", "COMPLETED"].includes(o.status),
  );
  factors.orderHistory = Math.min(30, completedOrders.length * 3);

  // Order value (max 20 points)
  const totalSpend = orders.reduce(
    (acc, o) => acc + Number(o.total ?? 0),
    0,
  );
  factors.orderValue = Math.min(20, Math.round(totalSpend / 500));

  // Return rate risk
  const returnRate =
    orders.length > 0 ? priorRmas.length / orders.length : 0;
  if (returnRate > 0.5) {
    riskFactors.returnRate = `High return rate: ${(returnRate * 100).toFixed(0)}%`;
    factors.returnBehavior = 0;
  } else {
    factors.returnBehavior = Math.round((1 - returnRate) * 15);
  }

  // Prior instant refund compliance (max 15 points)
  const priorInstants = priorRmas.filter((r) => r.instantRefund);
  const compliantInstants = priorInstants.filter(
    (r) => r.instantRefund?.verificationStatus === "VERIFIED",
  );
  if (priorInstants.length > 0) {
    const complianceRate = compliantInstants.length / priorInstants.length;
    if (complianceRate < 0.6) {
      riskFactors.instantRefundCompliance = `Low verification compliance: ${(complianceRate * 100).toFixed(0)}%`;
    }
    factors.instantRefundCompliance = Math.round(complianceRate * 15);
  } else {
    factors.instantRefundCompliance = 10; // neutral for new customers
  }

  const score = Object.values(factors).reduce((a, b) => a + b, 0);
  return { score: Math.min(100, score), factors, riskFactors };
}

export const instantRefundService = {
  async evaluateEligibility(input: {
    rmaId: string;
    organizationId: string;
  }): Promise<EligibilityResult> {
    const rma = await prisma.rMA.findUnique({
      where: { id: input.rmaId },
      include: {
        items: {
          include: { inventoryItem: { select: { sellingPrice: true } } },
        },
        customer: { select: { id: true } },
        instantRefund: { select: { id: true } },
      },
    });

    if (!rma) {
      return {
        eligible: false,
        trustScore: 0,
        trustTier: "BASIC",
        trustFactors: {},
        riskFactors: {},
        estimatedRefundAmount: 0,
        reason: "RMA not found",
      };
    }

    if (rma.organizationId !== input.organizationId) {
      return {
        eligible: false,
        trustScore: 0,
        trustTier: "BASIC",
        trustFactors: {},
        riskFactors: {},
        estimatedRefundAmount: 0,
        reason: "Organization mismatch",
      };
    }

    if (rma.instantRefund) {
      return {
        eligible: false,
        trustScore: 0,
        trustTier: "BASIC",
        trustFactors: {},
        riskFactors: { duplicate: "Instant refund already issued" },
        estimatedRefundAmount: 0,
        reason: "Instant refund already processed for this RMA",
      };
    }

    if (!["PENDING", "APPROVED"].includes(rma.status)) {
      return {
        eligible: false,
        trustScore: 0,
        trustTier: "BASIC",
        trustFactors: {},
        riskFactors: { status: `RMA status is ${rma.status}` },
        estimatedRefundAmount: 0,
        reason: `RMA must be PENDING or APPROVED for instant refund (current: ${rma.status})`,
      };
    }

    const { score, factors, riskFactors } = await computeTrustScore(
      rma.customer.id,
      input.organizationId,
    );

    const estimatedAmount =
      Number(rma.totalRefundAmount) ||
      rma.items.reduce(
        (acc: number, item) => acc + Number(item.inventoryItem?.sellingPrice ?? 0),
        0,
      );

    const tier = getTrustTier(score);
    const eligible = score >= MIN_SCORE_FOR_INSTANT;

    return {
      eligible,
      trustScore: score,
      trustTier: tier,
      trustFactors: factors,
      riskFactors,
      estimatedRefundAmount: estimatedAmount,
      reason: eligible
        ? undefined
        : `Trust score ${score} below minimum threshold of ${MIN_SCORE_FOR_INSTANT}`,
    };
  },

  async processInstantRefund(input: {
    rmaId: string;
    organizationId: string;
    refundMethod?: RefundMethod;
  }): Promise<InstantRefundResult> {
    const eligibility = await this.evaluateEligibility({
      rmaId: input.rmaId,
      organizationId: input.organizationId,
    });

    if (!eligibility.eligible) {
      throw new Error(
        eligibility.reason ?? "Customer is not eligible for instant refund",
      );
    }

    const rma = await prisma.rMA.findUniqueOrThrow({
      where: { id: input.rmaId },
      include: {
        customer: { select: { id: true } },
      },
    });

    const refundMethod = input.refundMethod ?? "ORIGINAL_PAYMENT";
    const refundAmount = eligibility.estimatedRefundAmount;

    // Attempt payment processor disbursement if configured
    let transactionId = `IR-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    let paymentProcessor = "manual";

    if (process.env.STRIPE_SECRET_KEY && refundMethod === "ORIGINAL_PAYMENT") {
      const paymentIntentId = getPaymentIntentId(rma.metadata);

      if (paymentIntentId) {
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: "2025-12-15.clover",
        });

        const refund = await stripe.refunds.create({
          payment_intent: paymentIntentId,
          amount: Math.round(refundAmount * 100),
          reason: "requested_by_customer",
          metadata: {
            rmaId: input.rmaId,
            organizationId: input.organizationId,
          },
        });

        transactionId = refund.id;
        paymentProcessor = "stripe";
      } else {
        paymentProcessor = "stripe_missing_payment_reference";
      }
    }

    const verificationDeadline = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    ); // 7 days

    const record = await prisma.instantRefund.create({
      data: {
        rmaId: input.rmaId,
        customerId: rma.customer.id,
        organizationId: input.organizationId,
        customerTrustScore: eligibility.trustScore,
        trustTier: eligibility.trustTier,
        trustFactors: eligibility.trustFactors,
        riskFactors: eligibility.riskFactors ?? {},
        refundAmount,
        refundMethod,
        refundIssuedAt: new Date(),
        paymentProcessor,
        transactionId,
        verificationDeadline,
        requiresPhotos: eligibility.trustScore < TRUST_TIER_THRESHOLDS.GOLD,
        requiresSerialNumber: eligibility.trustScore < TRUST_TIER_THRESHOLDS.GOLD,
        requiresTrackingUpdate: true,
        requiresSignature: eligibility.trustScore < TRUST_TIER_THRESHOLDS.PLATINUM,
        verificationStatus: "PENDING",
        discrepancies: [],
      },
    });

    return {
      id: record.id,
      rmaId: record.rmaId,
      refundAmount: Number(record.refundAmount),
      refundMethod: record.refundMethod,
      transactionId: record.transactionId,
      verificationDeadline: record.verificationDeadline,
      verificationStatus: record.verificationStatus as "PENDING",
      requiresPhotos: record.requiresPhotos,
      requiresSerialNumber: record.requiresSerialNumber,
      requiresTrackingUpdate: record.requiresTrackingUpdate,
      requiresSignature: record.requiresSignature,
    };
  },

  async listByOrganization(organizationId: string) {
    return prisma.instantRefund.findMany({
      where: { organizationId },
      include: {
        rma: { select: { rmaNumber: true, status: true } },
        customer: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  },
};
