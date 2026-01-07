/**
 * Business Rules & Escalation Engine
 * Automatically escalates quality issues based on configurable rules
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface EscalationRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  action: string;
  priority: number;
  enabled: boolean;
}

export class EscalationEngine {
  /**
   * Rule 1: Critical NCR must have CAPA within 24 hours
   */
  static async checkCriticalNCRWithoutCAPA() {
    const criticalNCRs = await prisma.nonConformanceReport.findMany({
      where: {
        severity: "CRITICAL",
        status: {
          in: ["OPEN", "INVESTIGATING"],
        },
        capaRequired: true,
        capaIds: {
          isEmpty: true,
        },
      },
    });

    for (const ncr of criticalNCRs) {
      const hoursSinceCreation =
        (Date.now() - new Date(ncr.createdAt).getTime()) / (1000 * 60 * 60);

      if (hoursSinceCreation > 24) {
        // Auto-create CAPA
        const capa = await prisma.correctivePreventiveAction.create({
          data: {
            capaNumber: `CAPA-AUTO-${Date.now()}`,
            organizationId: ncr.organizationId,
            capaType: "CORRECTIVE",
            actionCategory: "PROCESS",
            sourceType: "NCR",
            sourceId: ncr.id,
            ncrId: ncr.id,
            problemStatement: `Auto-generated CAPA for critical NCR ${ncr.ncrNumber}: ${ncr.title}`,
            problemSeverity: "CRITICAL",
            rootCauseMethod: "5_WHYS",
            rootCauseAnalysis: {},
            rootCause: "To be determined",
            immediateActions: [],
            correctiveActions: [],
            preventiveActions: [],
            status: "OPEN",
            targetCompletionDate: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000,
            ), // 7 days
            responsiblePerson: ncr.createdBy,
            createdBy: "SYSTEM",
          },
        });

        // Update NCR with CAPA ID
        await prisma.nonConformanceReport.update({
          where: { id: ncr.id },
          data: {
            capaIds: [capa.id],
          },
        });

        // Send notification
        await this.sendEscalationEmail({
          type: "CAPA_AUTO_CREATED",
          ncrId: ncr.id,
          capaId: capa.id,
          reason: "Critical NCR exceeded 24 hours without CAPA",
        });

        console.log(
          `Auto-created CAPA ${capa.capaNumber} for NCR ${ncr.ncrNumber}`,
        );
      }
    }
  }

  /**
   * Rule 2: 3 consecutive failures trigger quality hold
   */
  static async checkRepeatFailures() {
    // Get all suppliers with recent NCRs
    const suppliers = await prisma.supplier.findMany({
      include: {
        ncrs: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
      },
    });

    for (const supplier of suppliers) {
      const recentNCRs = supplier.ncrs.slice(0, 3);

      if (recentNCRs.length >= 3) {
        // Check if all 3 are within 7 days
        const firstNCRDate = new Date(recentNCRs[2].createdAt);
        const lastNCRDate = new Date(recentNCRs[0].createdAt);
        const daysDiff =
          (lastNCRDate.getTime() - firstNCRDate.getTime()) /
          (1000 * 60 * 60 * 24);

        if (daysDiff <= 7) {
          // Create quality hold
          try {
            const existingHold = await prisma.qualityHold.findFirst({
              where: {
                holdType: "VENDOR",
                status: "ACTIVE",
              },
            });

            if (!existingHold) {
              await prisma.qualityHold.create({
                data: {
                  holdNumber: `QH-VENDOR-${Date.now()}`,
                  organizationId: supplier.organizationId,
                  holdType: "VENDOR",
                  holdLevel: "VENDOR_LEVEL",
                  holdReason: "REPEAT_FAILURES",
                  holdDescription: `Automatic quality hold due to 3 NCRs within 7 days for supplier ${supplier.name}`,
                  sourceType: "NCR",
                  severity: "HIGH",
                  status: "ACTIVE",
                  initiatedBy: "SYSTEM",
                  initiatedDate: new Date(),
                  estimatedValue: 0,
                  quantityOnHold: 0,
                  quantityRemaining: 0,
                  createdBy: "SYSTEM",
                },
              });

              await this.sendEscalationEmail({
                type: "QUALITY_HOLD_CREATED",
                supplierId: supplier.id,
                reason: "3 consecutive NCRs within 7 days",
              });

              console.log(`Created quality hold for supplier ${supplier.name}`);
            }
          } catch (error) {
            console.error("Error creating quality hold:", error);
          }
        }
      }
    }
  }

  /**
   * Rule 3: High RPN CAPA requires management approval
   */
  static async checkHighRPNCapas() {
    const highRiskCapas = await prisma.correctivePreventiveAction.findMany({
      where: {
        status: {
          in: ["OPEN", "IN_PROGRESS"],
        },
      },
    });

    for (const capa of highRiskCapas) {
      const rca = capa.rootCauseAnalysis as any;
      const rpn = rca.rpn || 0;

      if (rpn > 200 && !rca.managementApprovalRequired) {
        // Flag for management approval
        await prisma.correctivePreventiveAction.update({
          where: { id: capa.id },
          data: {
            rootCauseAnalysis: {
              ...rca,
              managementApprovalRequired: true,
              escalatedDate: new Date(),
            },
          },
        });

        await this.sendEscalationEmail({
          type: "HIGH_RPN_APPROVAL",
          capaId: capa.id,
          rpn,
          reason: "RPN exceeds 200, requires management approval",
        });

        console.log(
          `Escalated CAPA ${capa.capaNumber} for management approval (RPN: ${rpn})`,
        );
      }
    }
  }

  /**
   * Rule 4: Overdue CAPA triggers escalation
   */
  static async checkOverdueCapas() {
    const overdueCapas = await prisma.correctivePreventiveAction.findMany({
      where: {
        status: {
          in: ["OPEN", "IN_PROGRESS"],
        },
        targetCompletionDate: {
          lt: new Date(),
        },
      },
    });

    for (const capa of overdueCapas) {
      const daysOverdue = Math.floor(
        (Date.now() - new Date(capa.targetCompletionDate).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      if (daysOverdue > 7) {
        await this.sendEscalationEmail({
          type: "CAPA_OVERDUE",
          capaId: capa.id,
          daysOverdue,
          reason: `CAPA is ${daysOverdue} days overdue`,
        });

        console.log(
          `Escalated overdue CAPA ${capa.capaNumber} (${daysOverdue} days)`,
        );
      }
    }
  }

  /**
   * Rule 5: Tighten sampling plan after failures
   */
  static async adjustSamplingPlans() {
    const failedInspections = await prisma.qualityMeasurement.findMany({
      where: {
        conformanceStatus: "NON_CONFORMING",
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    });

    // Group by product
    const failuresByProduct: { [key: string]: number } = {};
    failedInspections.forEach((inspection) => {
      const key = inspection.productSku || "unknown";
      failuresByProduct[key] = (failuresByProduct[key] || 0) + 1;
    });

    for (const [productSku, failures] of Object.entries(failuresByProduct)) {
      if (failures >= 3) {
        // Skip sampling plan update - schema investigation needed
        console.log(
          `Would tighten sampling plan for product ${productSku} (${failures} failures)`,
        );
      }
    }
  }

  /**
   * Rule 6: Supplier audit trigger
   */
  static async triggerSupplierAudits() {
    // Get suppliers with poor performance
    const suppliers = await prisma.supplier.findMany({
      include: {
        ncrs: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            },
          },
        },
      },
    });

    for (const supplier of suppliers) {
      const criticalNCRs = supplier.ncrs.filter(
        (n) => n.severity === "CRITICAL",
      ).length;
      const totalNCRs = supplier.ncrs.length;

      if (criticalNCRs >= 2 || totalNCRs >= 5) {
        // Check if audit already scheduled
        // Note: This would check Audit model once it's created
        console.log(
          `Supplier ${supplier.name} requires audit: ${criticalNCRs} critical, ${totalNCRs} total NCRs`,
        );

        await this.sendEscalationEmail({
          type: "SUPPLIER_AUDIT_REQUIRED",
          supplierId: supplier.id,
          reason: `${criticalNCRs} critical NCRs and ${totalNCRs} total NCRs in 90 days`,
        });
      }
    }
  }

  /**
   * Send escalation notification
   */
  private static async sendEscalationEmail(data: any) {
    try {
      await fetch("/api/qc/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ESCALATION",
          ...data,
        }),
      });
    } catch (error) {
      console.error("Failed to send escalation email:", error);
    }
  }

  /**
   * Run all escalation rules
   */
  static async runAllRules() {
    console.log("Running escalation rules...");

    try {
      await this.checkCriticalNCRWithoutCAPA();
      await this.checkRepeatFailures();
      await this.checkHighRPNCapas();
      await this.checkOverdueCapas();
      await this.adjustSamplingPlans();
      await this.triggerSupplierAudits();

      console.log("Escalation rules completed");
    } catch (error) {
      console.error("Error running escalation rules:", error);
    }
  }
}

export default EscalationEngine;
