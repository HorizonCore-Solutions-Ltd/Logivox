/**
 * TENANT-SCOPED ROUTE HELPER
 * Wraps Next.js Route Handlers with automatic tenant context injection
 * Use this for new endpoints or when refactoring existing ones
 */

import { NextRequest, NextResponse } from "next/server";
import { resolveTenantFromRequest } from "@/lib/tenant-context";

export type TenantAwareHandler = (
  request: NextRequest,
  { params }: { params?: Record<string, string | string[]> },
) => Promise<Response>;

/**
 * HOF: Wraps a route handler with automatic tenant context injection
 * Catches tenant resolution errors and returns 403
 *
 * @example
 * ```typescript
 * const GET = withTenantContext(async (request) => {
 *   const tenant = request.tenant!;
 *   const items = await prisma.inventoryItem.findMany({
 *     where: {
 *       organizationId: tenant.organizationId,
 *       status: "ACTIVE",
 *     },
 *   });
 *   return NextResponse.json(items);
 * });
 * ```
 */
export function withTenantContext(handler: TenantAwareHandler) {
  return async (
    request: NextRequest,
    context?: { params?: Record<string, string | string[]> },
  ) => {
    try {
      // Resolve tenant and attach to request for handler to use
      const tenant = await resolveTenantFromRequest(request);
      
      // Inject tenant into request so handler can access it
      (request as any).tenant = tenant;
      
      return await handler(request, context || {});
    } catch (error: any) {
      // Tenant resolution failed
      if (error.message.includes("Unauthorized") || error.message.includes("not found")) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 403 }
        );
      }
      console.error("[TENANT_CONTEXT] Error:", error);
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }
  };
}

/**
 * Extended NextRequest with tenant context
 */
declare global {
  namespace Express {
    interface Request {
      tenant?: {
        organizationId: string;
        userId: string;
        role: string;
        isAdmin: boolean;
      };
    }
  }
}

declare module "next/server" {
  interface NextRequest {
    tenant?: {
      organizationId: string;
      userId: string;
      role: string;
      isAdmin: boolean;
    };
  }
}

/**
 * USAGE EXAMPLE:
 *
 * // Instead of:
 * export async function GET(request: NextRequest) {
 *   const session = await getServerSession(authOptions);
 *   const organizationId = session?.user?.organizationId;
 *   ...
 * }
 *
 * // Do this:
 * export const GET = withTenantContext(async (request) => {
 *   const organizationId = request.tenant!.organizationId;
 *   ...
 * });
 */
