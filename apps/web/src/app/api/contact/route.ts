import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  company: z.string().optional(),
  phone: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

/**
 * POST /api/contact
 *
 * Accepts a contact form submission. Logs the enquiry server-side for
 * review and returns a confirmation. In production this can be extended
 * to send an email via an SMTP/Sendgrid integration.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = contactSchema.parse(body);

    // Server-side log (stdout in production deployment)
    console.info("[contact-form] New submission", {
      name: data.name,
      email: data.email,
      company: data.company ?? "—",
      subject: data.subject,
      receivedAt: new Date().toISOString(),
    });

    // TODO (post-launch): forward to CRM or send via Sendgrid
    // await sendEmail({ to: process.env.CONTACT_EMAIL, ...data });

    return NextResponse.json(
      {
        success: true,
        message:
          "Thank you for your message. We'll get back to you within 24 hours.",
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 422 },
      );
    }
    console.error("[contact-form] Unexpected error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to submit form. Please try again." },
      { status: 500 },
    );
  }
}
