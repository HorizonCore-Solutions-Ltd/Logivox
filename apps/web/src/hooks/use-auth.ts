"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Client-side hook to access the current user session
 * Returns the session object with user data, loading state, and authentication status
 */
export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user,
    session,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    status,
  };
}

/**
 * Client-side hook to get the current user or null
 */
export function useCurrentUser() {
  const { user } = useAuth();
  return user;
}

/**
 * Client-side hook that redirects to sign-in if not authenticated
 * Use this in pages/components that require authentication
 */
export function useRequireAuth(redirectTo: string = "/sign-in") {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  return { isAuthenticated, isLoading };
}

/**
 * Client-side hook to check if user has a specific role
 */
export function useHasRole(allowedRoles: string[]) {
  const { user } = useAuth();

  if (!user?.role) return false;

  return allowedRoles.includes(user.role);
}

/**
 * Client-side hook to get user's organizations
 */
export function useOrganizations() {
  const { user } = useAuth();
  return user?.organizations || [];
}

/**
 * Client-side hook to check if user has a specific role in an organization
 */
export function useHasOrganizationRole(
  organizationSlug: string,
  allowedRoles: string[],
) {
  const organizations = useOrganizations();

  const org = organizations.find((o: any) => o.slug === organizationSlug);

  if (!org) return false;

  return allowedRoles.includes(org.role);
}
