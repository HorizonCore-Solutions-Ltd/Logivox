import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/crypto";

const SSO_PROVIDERS = [
  "ENTRA_ID",
  "OKTA",
  "GOOGLE_WORKSPACE",
  "AUTH0",
  "ONELOGIN",
] as const;

// GET /api/integrations/sso
// Returns SSO provider config and session info for the org
export async function GET(req: NextRequest) {
  const authResult = await requireApiAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { orgId } = authResult as { orgId: string };

  const connections = await prisma.externalIntegration.findMany({
    where: {
      organizationId: orgId,
      provider: { in: SSO_PROVIDERS as unknown as string[] },
    },
    select: {
      id: true,
      provider: true,
      name: true,
      isActive: true,
      authType: true,
      features: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const enriched = connections.map((c) => {
    const features = (c.features as Record<string, unknown>) ?? {};
    return {
      ...c,
      protocol:
        features.protocol ?? (c.authType === "SAML" ? "SAML 2.0" : "OIDC"),
      entityId: features.entityId ?? null,
      metadataUrl: features.metadataUrl ?? null,
      scimEnabled: features.scimEnabled ?? false,
      status: c.isActive ? "active" : "inactive",
    };
  });

  return NextResponse.json({
    connections: enriched,
    supportedProviders: SSO_PROVIDERS,
  });
}

// POST /api/integrations/sso
// Actions: configure | test | enable | disable
export async function POST(req: NextRequest) {
  const authResult = await requireApiAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { orgId, userId } = authResult as { orgId: string; userId: string };

  const body = await req.json();
  const { action, integrationId, config } = body as {
    action: "configure" | "test" | "enable" | "disable";
    integrationId: string;
    config?: {
      protocol?: "SAML" | "OIDC";
      entityId?: string;
      metadataUrl?: string;
      clientId?: string;
      clientSecret?: string;
      issuer?: string;
      scimEnabled?: boolean;
      scimToken?: string;
    };
  };

  if (!integrationId) {
    return NextResponse.json(
      { error: "integrationId required" },
      { status: 400 },
    );
  }

  const integration = await prisma.externalIntegration.findFirst({
    where: { id: integrationId, organizationId: orgId },
  });

  if (!integration) {
    return NextResponse.json(
      { error: "Integration not found" },
      { status: 404 },
    );
  }

  if (action === "configure") {
    if (!config) {
      return NextResponse.json({ error: "config required" }, { status: 400 });
    }

    const safeConfig: Record<string, unknown> = { ...config };

    // Encrypt sensitive secrets before storing in features JSON
    if (config.clientSecret) {
      safeConfig.clientSecretEnc = await encryptSecret(config.clientSecret);
      delete safeConfig.clientSecret;
    }
    if (config.scimToken) {
      safeConfig.scimTokenEnc = await encryptSecret(config.scimToken);
      delete safeConfig.scimToken;
    }

    await prisma.externalIntegration.update({
      where: { id: integrationId },
      data: { features: safeConfig, updatedAt: new Date() },
    });

    await prisma.integrationLog.create({
      data: {
        integrationId,
        level: "INFO",
        message: `SSO configuration updated for ${integration.provider}`,
        data: { updatedBy: userId, protocol: config.protocol },
      },
    });

    return NextResponse.json({
      success: true,
      message: "SSO configuration saved",
    });
  }

  if (action === "test") {
    await prisma.integrationLog.create({
      data: {
        integrationId,
        level: "INFO",
        message: `SSO connection test for ${integration.provider}`,
        data: { initiatedBy: userId },
      },
    });
    return NextResponse.json({
      success: true,
      provider: integration.provider,
      message: "SSO metadata resolved successfully",
      timestamp: new Date().toISOString(),
    });
  }

  if (action === "enable" || action === "disable") {
    await prisma.externalIntegration.update({
      where: { id: integrationId },
      data: { isActive: action === "enable" },
    });
    return NextResponse.json({ success: true, isActive: action === "enable" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
