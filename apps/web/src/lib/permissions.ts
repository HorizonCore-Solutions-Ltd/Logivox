import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export type Permission = 
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "manageMembers"
  | "manageSettings"

export type Role = "ADMIN" | "MEMBER" | "VIEWER"

const rolePermissions: Record<Role, Permission[]> = {
  ADMIN: ["view", "create", "edit", "delete", "manageMembers", "manageSettings"],
  MEMBER: ["view", "create", "edit"],
  VIEWER: ["view"],
}

export async function checkPermission(
  requiredPermission: Permission
): Promise<{ authorized: boolean; session: any; error?: NextResponse }> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return {
      authorized: false,
      session: null,
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    }
  }

  // Get user's role in their organization
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      organizations: {
        take: 1,
      },
    },
  })

  if (!user || user.organizations.length === 0) {
    return {
      authorized: false,
      session,
      error: NextResponse.json(
        { message: "No organization found" },
        { status: 403 }
      ),
    }
  }

  const role = user.organizations[0].role as Role
  const permissions = rolePermissions[role]

  if (!permissions.includes(requiredPermission)) {
    return {
      authorized: false,
      session,
      error: NextResponse.json(
        { message: `Insufficient permissions. Required: ${requiredPermission}` },
        { status: 403 }
      ),
    }
  }

  return {
    authorized: true,
    session,
  }
}

export async function requirePermission(
  requiredPermission: Permission
): Promise<{ session: any; error?: NextResponse }> {
  const result = await checkPermission(requiredPermission)

  if (!result.authorized) {
    return { session: null, error: result.error }
  }

  return { session: result.session }
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role].includes(permission)
}

export async function getOrganizationIdFromSession(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      organizations: {
        take: 1,
        select: {
          id: true,
        },
      },
    },
  })

  return user?.organizations[0]?.id || null
}

export async function verifyOrganizationAccess(
  organizationId: string
): Promise<{ authorized: boolean; error?: NextResponse }> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return {
      authorized: false,
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    }
  }

  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId: session.user.id,
      organizationId,
    },
  })

  if (!membership) {
    return {
      authorized: false,
      error: NextResponse.json(
        { message: "Access denied to this organization" },
        { status: 403 }
      ),
    }
  }

  return { authorized: true }
}
