import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SecurityNotificationService } from "@/lib/services/security-notifications";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { qrCode, securityPersonnelId } = await request.json();

    if (!qrCode) {
      return NextResponse.json(
        { error: "QR code is required" },
        { status: 400 },
      );
    }

    // Find pre-registration by QR code
    const preRegistration = await prisma.visitorPreRegistration.findUnique({
      where: {
        qrCode,
        organizationId: session.user.organizationId,
      },
    });

    if (!preRegistration) {
      return NextResponse.json({ error: "Invalid QR code" }, { status: 404 });
    }

    // Validate registration status
    if (preRegistration.status !== "APPROVED") {
      return NextResponse.json(
        {
          error: `Registration is ${preRegistration.status}. Only approved registrations can check in.`,
        },
        { status: 400 },
      );
    }

    if (preRegistration.checkedIn) {
      return NextResponse.json(
        { error: "Visitor already checked in" },
        { status: 400 },
      );
    }

    // Check if expired
    if (new Date() > preRegistration.expiresAt) {
      await prisma.visitorPreRegistration.update({
        where: { id: preRegistration.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(
        { error: "Registration has expired" },
        { status: 400 },
      );
    }

    // Generate visitor badge number
    const lastVisitor = await prisma.visitor.findFirst({
      where: { organizationId: session.user.organizationId },
      orderBy: { createdAt: "desc" },
      select: { badgeNumber: true },
    });

    const lastNumber = lastVisitor?.badgeNumber
      ? parseInt(lastVisitor.badgeNumber.replace(/\D/g, ""))
      : 0;
    const badgeNumber = `VIS${String(lastNumber + 1).padStart(6, "0")}`;

    // Create visitor record
    const visitor = await prisma.visitor.create({
      data: {
        organizationId: session.user.organizationId,
        badgeNumber,
        badgeIssued: true,

        // From pre-registration
        firstName: preRegistration.firstName,
        lastName: preRegistration.lastName,
        email: preRegistration.email,
        phone: preRegistration.phone,
        company: preRegistration.company,
        visitorType: preRegistration.visitorType,
        purpose: preRegistration.visitPurpose,
        hostName: preRegistration.hostName,
        hostDepartment: preRegistration.hostDepartment,
        escortRequired: preRegistration.escortRequired,
        allowedAreas: preRegistration.allowedAreas,

        // Check-in details
        checkInTime: new Date(),
        visitDate: preRegistration.visitDate,
        status: "CHECKED_IN",
        securityPersonnelId,
      },
    });

    // Update pre-registration
    await prisma.visitorPreRegistration.update({
      where: { id: preRegistration.id },
      data: {
        checkedIn: true,
        checkedInAt: new Date(),
        visitorId: visitor.id,
        status: "CHECKED_IN",
      },
    });

    // Send notification to host
    if (preRegistration.hostEmail) {
      await SecurityNotificationService.notifyVisitorArrival(
        session.user.organizationId,
        visitor,
        preRegistration.hostEmail,
        preRegistration.hostName,
      );
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: session.user.organizationId,
        userId: session.user.id,
        action: "CREATE",
        entity: "VISITOR",
        entityId: visitor.id,
        description: `Checked in pre-registered visitor ${visitor.firstName} ${visitor.lastName} via QR code`,
        metadata: {
          preRegistrationId: preRegistration.id,
          registrationNumber: preRegistration.registrationNumber,
          badgeNumber,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        visitor,
        badgeNumber,
        message: "Visitor checked in successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error checking in visitor:", error);
    return NextResponse.json(
      { error: "Failed to check in visitor" },
      { status: 500 },
    );
  }
}
