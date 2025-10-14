import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/sign-in")
  }
  
  return user
}

export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth()
  
  if (!allowedRoles.includes(user.role)) {
    redirect("/dashboard")
  }
  
  return user
}

export async function getCurrentOrganization(slug?: string) {
  const user = await requireAuth()
  
  if (!slug && user.organizations.length > 0) {
    return user.organizations[0]
  }
  
  const org = user.organizations.find(o => o.slug === slug)
  
  if (!org) {
    redirect("/dashboard")
  }
  
  return org
}

export async function requireOrganizationRole(
  organizationSlug: string,
  allowedRoles: string[]
) {
  const user = await requireAuth()
  const org = user.organizations.find(o => o.slug === organizationSlug)
  
  if (!org || !allowedRoles.includes(org.role)) {
    redirect("/dashboard")
  }
  
  return { user, organization: org }
}
