/**
 * TENANT CONTEXT RESOLVER
 * Derives organization scope from request headers, cookies, or session
 * Implements strict zero-trust tenant isolation
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export interface TenantContext {
  organizationId: string;
  userId: string;
  role: "OWNER" | "ADMIN" | "MANAGER" | "MEMBER" | "GUEST";
  isAdmin: boolean;
}

/**
 * Resolve tenant context from NextRequest
 * Priority: header → cookie → session
 * Fail closed: throw if unresolved
 */
export async function resolveTenantFromRequest(
  request: NextRequest,
): Promise<TenantContext> {
  // 1. Check X-Organization-ID header (client-side explicit scope)
  const headerOrgId = request.headers.get("x-organization-id");
  if (headerOrgId) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized: session required");
    }
    return {
      organizationId: headerOrgId,
      userId: session.user.id,
      role: (session.user.organizations?.[0]?.role || "GUEST") as any,
      isAdmin:
        ["OWNER", "ADMIN"].includes(
          session.user.organizations?.[0]?.role || "GUEST",
        ) || session.user.role === "ADMIN",
    };
  }

  // 2. Check X-Organization-Slug header and resolve to ID
  const slugHeader = request.headers.get("x-organization-slug");
  if (slugHeader) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized: session required");
    }
    const org = session.user.organizations?.find(
      (o: any) => o.slug === slugHeader,
    );
    if (!org) {
      throw new Error(`Organization '${slugHeader}' not found or not a member`);
    }
    return {
      organizationId: org.id,
      userId: session.user.id,
      role: org.role as any,
      isAdmin:
        ["OWNER", "ADMIN"].includes(org.role) || session.user.role === "ADMIN",
    };
  }

  // 3. Fall back to session (last-used or first organization)
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.organizations?.length) {
    throw new Error("Unauthorized: no organization context found");
  }

  const firstOrg = session.user.organizations[0];
  return {
    organizationId: firstOrg.id,
    userId: session.user.id,
    role: firstOrg.role as any,
    isAdmin:
      ["OWNER", "ADMIN"].includes(firstOrg.role) ||
      session.user.role === "ADMIN",
  };
}

/**
 * Middleware to inject tenant context into request headers
 * Use in Route Handlers to ensure context is available downstream
 */
export async function injectTenantContext(request: NextRequest) {
  try {
    const tenant = await resolveTenantFromRequest(request);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-tenant-organization-id", tenant.organizationId);
    requestHeaders.set("x-tenant-user-id", tenant.userId);
    requestHeaders.set("x-tenant-role", tenant.role);
    requestHeaders.set("x-tenant-is-admin", tenant.isAdmin ? "true" : "false");
    return {
      request: new NextRequest(request, { headers: requestHeaders }),
      tenant,
    };
  } catch (error) {
    throw new Error(`Failed to inject tenant context: ${error}`);
  }
}

/**
 * Extract tenant context from injected headers
 * Use in server components/actions that don't have direct request access
 */
export function extractTenantFromHeaders(
  headers: HeadersInit | Record<string, string>,
): TenantContext {
  const headersMap =
    headers instanceof Headers ? headers : new Headers(headers);
  const organizationId = headersMap.get("x-tenant-organization-id");
  const userId = headersMap.get("x-tenant-user-id");
  const role = headersMap.get("x-tenant-role") as any;
  const isAdmin = headersMap.get("x-tenant-is-admin") === "true";

  if (!organizationId || !userId) {
    throw new Error("Tenant context not found in headers");
  }

  return { organizationId, userId, role, isAdmin };
}

/**
 * Guard: ensure user has required role in organization
 */
export function assertRole(
  tenant: TenantContext,
  allowedRoles: string[],
): void {
  if (!allowedRoles.includes(tenant.role) && !tenant.isAdmin) {
    throw new Error(
      `Insufficient permissions: requires one of [${allowedRoles.join(",")}], got ${tenant.role}`,
    );
  }
}

/**
 * Guard: verify organization access
 */
export async function verifyOrganizationAccess(
  organizationId: string,
  userId: string,
  prisma: any,
): Promise<TenantContext | null> {
  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: { organizationId, userId },
    },
    include: {
      organization: true,
    },
  });

  if (!membership || !membership.isActive) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  return {
    organizationId,
    userId,
    role: membership.role,
    isAdmin:
      user?.role === "ADMIN" || ["OWNER", "ADMIN"].includes(membership.role),
  };
}
