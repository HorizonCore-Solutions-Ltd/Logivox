import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import { requireApiAuth } from "@/lib/api-guard";

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    const body = await request.json();
    const { type, id, recipients } = body;

    let subject: string;
    let htmlContent: string;

    switch (type) {
      case "ncr_created":
        const ncr = await prisma.nonConformanceReport.findUnique({
          where: { id },
        });
        subject = `New NCR Created: ${ncr?.ncrNumber}`;
        htmlContent = generateNCREmail(ncr);
        break;

      case "capa_overdue":
        const capa = await prisma.correctivePreventiveAction.findUnique({
          where: { id },
        });
        subject = `⚠️ CAPA Overdue: ${capa?.capaNumber}`;
        htmlContent = generateCAPAOverdueEmail(capa);
        break;

      case "hold_released":
        const hold = await prisma.qualityHold.findUnique({
          where: { id },
        });
        subject = `Quality Hold Released: ${hold?.id}`;
        htmlContent = generateHoldReleasedEmail(hold);
        break;

      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    // Send email
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@flowstock.com",
      to: recipients.join(", "),
      subject,
      html: htmlContent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email notification error:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 },
    );
  }
}

function generateNCREmail(ncr: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 20px; margin-top: 20px; }
        .field { margin: 10px 0; }
        .label { font-weight: bold; }
        .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; display: inline-block; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Non-Conformance Report Created</h1>
        </div>
        <div class="content">
          <div class="field">
            <span class="label">NCR Number:</span> ${ncr.ncrNumber}
          </div>
          <div class="field">
            <span class="label">Severity:</span> ${ncr.severity}
          </div>
          <div class="field">
            <span class="label">Category:</span> ${ncr.category}
          </div>
          <div class="field">
            <span class="label">Lot Number:</span> ${ncr.lotNumber}
          </div>
          <div class="field">
            <span class="label">Description:</span><br/>
            ${ncr.description}
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/qc/ncr/${ncr.id}" class="button">
            View NCR Details
          </a>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateCAPAOverdueEmail(capa: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
        .content { background: #fff7ed; padding: 20px; margin-top: 20px; }
        .field { margin: 10px 0; }
        .label { font-weight: bold; }
        .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; display: inline-block; margin-top: 20px; }
        .urgent { color: #dc2626; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ CAPA Past Due Date</h1>
        </div>
        <div class="content">
          <p class="urgent">This CAPA has passed its target completion date and requires immediate attention.</p>
          
          <div class="field">
            <span class="label">CAPA Number:</span> ${capa.capaNumber}
          </div>
          <div class="field">
            <span class="label">Priority:</span> ${capa.priority}
          </div>
          <div class="field">
            <span class="label">RPN:</span> ${capa.rpn}
          </div>
          <div class="field">
            <span class="label">Target Date:</span> ${new Date(capa.targetDate).toLocaleDateString()}
          </div>
          <div class="field">
            <span class="label">Responsible:</span> ${capa.responsiblePerson}
          </div>
          <div class="field">
            <span class="label">Description:</span><br/>
            ${capa.description}
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/qc/capa/${capa.id}" class="button">
            Update CAPA Status
          </a>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateHoldReleasedEmail(hold: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #16a34a; color: white; padding: 20px; text-align: center; }
        .content { background: #f0fdf4; padding: 20px; margin-top: 20px; }
        .field { margin: 10px 0; }
        .label { font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✓ Quality Hold Released</h1>
        </div>
        <div class="content">
          <p>A quality hold has been released and inventory is now available.</p>
          
          <div class="field">
            <span class="label">Hold Type:</span> ${hold.type}
          </div>
          <div class="field">
            <span class="label">Quantity:</span> ${hold.quantity}
          </div>
          <div class="field">
            <span class="label">Released:</span> ${new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Cron job endpoint to check for overdue CAPAs
export async function GET() {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    const overdueCAPAs = await prisma.correctivePreventiveAction.findMany({
      where: {
        targetCompletionDate: {
          lt: new Date(),
        },
        status: {
          notIn: ["COMPLETED", "VERIFIED", "CANCELLED"],
        },
      },
    });

    for (const capa of overdueCAPAs) {
      // Send notification
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/qc/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "capa_overdue",
          id: capa.id,
          recipients: [capa.responsiblePerson], // In production, look up email
        }),
      });
    }

    return NextResponse.json({
      success: true,
      notificationsSent: overdueCAPAs.length,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: "Failed to process notifications" },
      { status: 500 },
    );
  }
}
