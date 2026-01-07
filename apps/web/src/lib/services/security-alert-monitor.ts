// Automated Security Alert Monitoring
import { prisma } from "@/lib/prisma";
import { SecurityNotificationService } from "./security-notifications";

export class SecurityAlertMonitor {
  // Check for overdue visitors every 15 minutes
  static async checkOverdueVisitors() {
    const overdueThreshold = new Date(Date.now() - 4 * 60 * 60 * 1000); // 4 hours ago

    const overdueVisitors = await prisma.visitor.findMany({
      where: {
        status: "CHECKED_IN",
        checkInTime: {
          lt: overdueThreshold,
        },
      },
      include: {
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    for (const visitor of overdueVisitors) {
      // Create alert
      const alert = await prisma.securityAlert.create({
        data: {
          organizationId: visitor.organizationId,
          alertType: "VISITOR_OVERDUE",
          severity: "MEDIUM",
          title: `Visitor ${visitor.badgeNumber} Overdue`,
          description: `Visitor ${visitor.firstName} ${visitor.lastName} has been on-site for over 4 hours without checking out.`,
          location: visitor.warehouseId || "Unknown",
          relatedEntity: "VISITOR",
          relatedEntityId: visitor.id,
          status: "ACTIVE",
          triggerSource: "SYSTEM",
          triggeredBy: "AUTOMATED_MONITOR",
        },
      });

      // Send notification
      await SecurityNotificationService.notifyVisitorOverdue(
        visitor.organizationId,
        visitor,
      );

      await prisma.securityAlert.update({
        where: { id: alert.id },
        data: { notificationsSent: 1 },
      });
    }

    return overdueVisitors.length;
  }

  // Check for after-hours access attempts
  static async checkAfterHoursAccess() {
    const now = new Date();
    const hour = now.getHours();

    // Define after-hours as 10 PM - 6 AM
    if (hour >= 6 && hour < 22) {
      return 0; // Not after hours
    }

    const last15Minutes = new Date(Date.now() - 15 * 60 * 1000);

    // Check gate entries during after-hours
    const afterHoursEntries = await prisma.gateEntry.findMany({
      where: {
        entryTime: {
          gte: last15Minutes,
        },
        direction: "IN",
      },
      include: {
        organization: true,
      },
    });

    for (const entry of afterHoursEntries) {
      await prisma.securityAlert.create({
        data: {
          organizationId: entry.organizationId,
          alertType: "AFTER_HOURS_ACCESS",
          severity: "HIGH",
          title: "After-Hours Gate Entry",
          description: `Vehicle ${entry.licensePlate || entry.vehicleNumber} entered during after-hours (${now.toLocaleTimeString()})`,
          location: entry.parkingLocation || "Main Gate",
          relatedEntity: "GATE_ENTRY",
          relatedEntityId: entry.id,
          status: "ACTIVE",
          triggerSource: "SYSTEM",
          triggeredBy: "AUTOMATED_MONITOR",
        },
      });
    }

    return afterHoursEntries.length;
  }

  // Check for multiple failed access attempts
  static async checkFailedAccessAttempts() {
    const last30Minutes = new Date(Date.now() - 30 * 60 * 1000);

    // Group failed access by person
    const failedAccess = await prisma.securityAccessLog.findMany({
      where: {
        accessTime: {
          gte: last30Minutes,
        },
        accessGranted: false,
      },
    });

    // Count failures by person
    const failuresByPerson: Record<string, any[]> = {};
    failedAccess.forEach((log) => {
      const key = `${log.organizationId}-${log.personId}`;
      if (!failuresByPerson[key]) {
        failuresByPerson[key] = [];
      }
      failuresByPerson[key].push(log);
    });

    let alertsCreated = 0;

    // Alert if 3+ failures in 30 minutes
    for (const [key, logs] of Object.entries(failuresByPerson)) {
      if (logs.length >= 3) {
        const firstLog = logs[0];

        await prisma.securityAlert.create({
          data: {
            organizationId: firstLog.organizationId,
            alertType: "MULTIPLE_FAILED_ACCESS",
            severity: "HIGH",
            title: "Multiple Failed Access Attempts",
            description: `${firstLog.personName} has ${logs.length} failed access attempts in the last 30 minutes at ${firstLog.accessPoint}`,
            location: firstLog.accessPoint,
            relatedEntity: "ACCESS_LOG",
            status: "ACTIVE",
            triggerSource: "SYSTEM",
            triggeredBy: "AUTOMATED_MONITOR",
            metadata: {
              failureCount: logs.length,
              personId: firstLog.personId,
              personType: firstLog.personType,
            },
          },
        });

        alertsCreated++;
      }
    }

    return alertsCreated;
  }

  // Check for camera system offline
  static async checkCameraStatus() {
    const cameras = await prisma.cameraSystem.findMany({
      where: {
        status: "OFFLINE",
        isActive: true,
      },
    });

    for (const camera of cameras) {
      // Check if alert already exists in last hour
      const existingAlert = await prisma.securityAlert.findFirst({
        where: {
          organizationId: camera.organizationId,
          alertType: "CAMERA_OFFLINE",
          relatedEntity: "CAMERA",
          relatedEntityId: camera.id,
          triggerTime: {
            gte: new Date(Date.now() - 60 * 60 * 1000),
          },
        },
      });

      if (!existingAlert) {
        await prisma.securityAlert.create({
          data: {
            organizationId: camera.organizationId,
            alertType: "CAMERA_OFFLINE",
            severity: "MEDIUM",
            title: "Camera System Offline",
            description: `Camera ${camera.name} at ${camera.location} is offline`,
            location: camera.location,
            relatedEntity: "CAMERA",
            relatedEntityId: camera.id,
            status: "ACTIVE",
            triggerSource: "SYSTEM",
            triggeredBy: "AUTOMATED_MONITOR",
          },
        });
      }
    }

    return cameras.length;
  }

  // Run all checks
  static async runAllChecks() {
    console.log("Running security alert checks...");

    const results = {
      overdueVisitors: await this.checkOverdueVisitors(),
      afterHoursAccess: await this.checkAfterHoursAccess(),
      failedAccessAttempts: await this.checkFailedAccessAttempts(),
      offlineCameras: await this.checkCameraStatus(),
    };

    console.log("Security alert check results:", results);
    return results;
  }
}

// Export cron job function
export async function runSecurityMonitoring() {
  try {
    await SecurityAlertMonitor.runAllChecks();
  } catch (error) {
    console.error("Security monitoring error:", error);
  }
}
