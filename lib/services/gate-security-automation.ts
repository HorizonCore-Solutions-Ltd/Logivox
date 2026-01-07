import { prisma } from "@/lib/prisma";

/**
 * Gate Security Automation Service
 * Monitors and automates various gate security operations
 */

export class GateSecurityAutomationService {
  /**
   * Check for vehicles exceeding dwell time limits
   */
  static async checkDwellTimeViolations() {
    try {
      const maxDwellHours = 24; // Configurable per organization
      const dwellTimeThreshold = new Date(
        Date.now() - maxDwellHours * 60 * 60 * 1000,
      );

      // Find vehicles on-site longer than threshold
      const overdueVehicles = await prisma.gateEntry.findMany({
        where: {
          entryTime: { lte: dwellTimeThreshold },
          exitTime: null, // Still on-site
          status: { in: ["CHECKED_IN", "LOADING", "UNLOADING"] },
        },
        include: {
          organization: true,
          parkingSpot: true,
        },
      });

      // Create alerts for each overdue vehicle
      for (const vehicle of overdueVehicles) {
        const dwellHours = Math.floor(
          (Date.now() - vehicle.entryTime.getTime()) / (1000 * 60 * 60),
        );

        // Check if alert already exists
        const existingAlert = await prisma.securityAlert.findFirst({
          where: {
            type: "DWELL_TIME_EXCEEDED",
            metadata: {
              path: ["gateEntryId"],
              equals: vehicle.id,
            },
            resolvedAt: null,
          },
        });

        if (!existingAlert) {
          await prisma.securityAlert.create({
            data: {
              organizationId: vehicle.organizationId,
              type: "DWELL_TIME_EXCEEDED",
              severity: dwellHours > maxDwellHours * 2 ? "HIGH" : "MEDIUM",
              message: `Vehicle ${vehicle.licensePlate || vehicle.vehicleNumber} has been on-site for ${dwellHours} hours`,
              metadata: {
                gateEntryId: vehicle.id,
                licensePlate: vehicle.licensePlate,
                dwellHours,
                entryTime: vehicle.entryTime,
                parkingSpot: vehicle.parkingSpot?.spotNumber,
              },
            },
          });
        }
      }

      return {
        checked: overdueVehicles.length,
        alertsCreated: overdueVehicles.length,
      };
    } catch (error) {
      console.error("Error checking dwell time violations:", error);
      throw error;
    }
  }

  /**
   * Monitor temperature logs for refrigerated vehicles
   */
  static async monitorTemperatures() {
    try {
      // Find recent temperature logs that are out of range
      const recentOutOfRange = await prisma.temperatureLog.findMany({
        where: {
          isOutOfRange: true,
          recordedAt: {
            gte: new Date(Date.now() - 30 * 60 * 1000), // Last 30 minutes
          },
        },
        include: {
          gateEntry: true,
        },
      });

      // Group by gate entry and check if multiple violations
      const violations: Record<string, any[]> = {};
      for (const log of recentOutOfRange) {
        if (!violations[log.gateEntryId]) {
          violations[log.gateEntryId] = [];
        }
        violations[log.gateEntryId].push(log);
      }

      // Create critical alerts for repeated violations
      const criticalAlerts = [];
      for (const [gateEntryId, logs] of Object.entries(violations)) {
        if (logs.length >= 3) {
          const gateEntry = logs[0].gateEntry;

          // Check if critical alert already exists
          const existingAlert = await prisma.securityAlert.findFirst({
            where: {
              type: "CRITICAL_TEMP_VIOLATION",
              metadata: {
                path: ["gateEntryId"],
                equals: gateEntryId,
              },
              resolvedAt: null,
            },
          });

          if (!existingAlert) {
            await prisma.securityAlert.create({
              data: {
                organizationId: gateEntry.organizationId,
                type: "CRITICAL_TEMP_VIOLATION",
                severity: "CRITICAL",
                message: `URGENT: Vehicle ${gateEntry.licensePlate} has ${logs.length} temperature violations in last 30 minutes`,
                metadata: {
                  gateEntryId,
                  licensePlate: gateEntry.licensePlate,
                  violationCount: logs.length,
                  temperatures: logs.map((l) => ({
                    temp: parseFloat(l.temperature.toString()),
                    time: l.recordedAt,
                  })),
                },
              },
            });

            criticalAlerts.push(gateEntryId);
          }
        }
      }

      return {
        monitored: recentOutOfRange.length,
        criticalAlerts: criticalAlerts.length,
      };
    } catch (error) {
      console.error("Error monitoring temperatures:", error);
      throw error;
    }
  }

  /**
   * Check for expired permits and documents
   */
  static async checkExpiredPermits() {
    try {
      const today = new Date();

      // Check hazmat permits
      const expiredHazmatPermits = await prisma.hazmatRecord.findMany({
        where: {
          permitExpiryDate: {
            lte: today,
          },
          gateEntry: {
            exitTime: null, // Still on-site
          },
        },
        include: {
          gateEntry: true,
        },
      });

      // Create alerts for expired permits
      for (const record of expiredHazmatPermits) {
        await prisma.securityAlert.create({
          data: {
            organizationId: record.organizationId,
            type: "EXPIRED_PERMIT",
            severity: "HIGH",
            message: `HAZMAT permit expired for vehicle ${record.gateEntry.licensePlate} - UN${record.unNumber}`,
            metadata: {
              gateEntryId: record.gateEntryId,
              hazmatRecordId: record.id,
              unNumber: record.unNumber,
              permitNumber: record.permitNumber,
              expiryDate: record.permitExpiryDate,
            },
          },
        });
      }

      return {
        expiredPermits: expiredHazmatPermits.length,
      };
    } catch (error) {
      console.error("Error checking expired permits:", error);
      throw error;
    }
  }

  /**
   * Update queue positions and wait times
   */
  static async updateQueueMetrics() {
    try {
      const activeQueues = await prisma.gateQueue.findMany({
        where: {
          status: { in: ["WAITING", "CALLED"] },
        },
        orderBy: [{ priority: "desc" }, { arrivalTime: "asc" }],
      });

      // Update positions
      for (let i = 0; i < activeQueues.length; i++) {
        const estimatedWait = i * 5; // 5 minutes per vehicle
        await prisma.gateQueue.update({
          where: { id: activeQueues[i].id },
          data: {
            position: i + 1,
            estimatedWaitMinutes: estimatedWait,
          },
        });
      }

      return {
        queuesUpdated: activeQueues.length,
      };
    } catch (error) {
      console.error("Error updating queue metrics:", error);
      throw error;
    }
  }

  /**
   * Check for weight variances indicating potential theft
   */
  static async detectWeightTheft() {
    try {
      const suspiciousVariances = await prisma.$queryRaw`
        SELECT 
          ge.id as gate_entry_id,
          ge.license_plate,
          w_in.weight as weight_in,
          w_out.weight as weight_out,
          (w_in.weight - w_out.weight) as variance,
          ((w_in.weight - w_out.weight) / w_in.weight * 100) as variance_pct
        FROM gate_entries ge
        LEFT JOIN gate_weigh_bridges w_in ON w_in.gate_entry_id = ge.id AND w_in.direction = 'IN'
        LEFT JOIN gate_weigh_bridges w_out ON w_out.gate_entry_id = ge.id AND w_out.direction = 'OUT'
        WHERE w_in.weight IS NOT NULL 
          AND w_out.weight IS NOT NULL
          AND ((w_in.weight - w_out.weight) / w_in.weight * 100) > 10
          AND ge.exit_time > NOW() - INTERVAL '24 hours'
      `;

      // Create alerts for suspicious weight loss
      for (const variance of suspiciousVariances as any[]) {
        await prisma.securityAlert.create({
          data: {
            organizationId: (await prisma.gateEntry.findUnique({
              where: { id: variance.gate_entry_id },
              select: { organizationId: true },
            }))!.organizationId,
            type: "SUSPICIOUS_WEIGHT_LOSS",
            severity: "HIGH",
            message: `Suspicious weight variance detected for ${variance.license_plate}: ${variance.variance}kg loss (${variance.variance_pct.toFixed(2)}%)`,
            metadata: variance,
          },
        });
      }

      return {
        suspiciousVehicles: (suspiciousVariances as any[]).length,
      };
    } catch (error) {
      console.error("Error detecting weight theft:", error);
      throw error;
    }
  }

  /**
   * Run all automation checks
   */
  static async runAll() {
    console.log("Running gate security automation checks...");

    const results = {
      dwellTime: await this.checkDwellTimeViolations(),
      temperature: await this.monitorTemperatures(),
      permits: await this.checkExpiredPermits(),
      queue: await this.updateQueueMetrics(),
      weightTheft: await this.detectWeightTheft(),
      timestamp: new Date(),
    };

    console.log("Automation checks completed:", results);
    return results;
  }
}
