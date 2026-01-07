import { useSession } from "next-auth/react";

export type Role = "ADMIN" | "MEMBER" | "VIEWER";

export interface Permission {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageMembers: boolean;
  canManageSettings: boolean;
}

export function usePermissions(): Permission {
  const { data: session } = useSession();
  const role = session?.user?.organizations?.[0]?.role as Role | undefined;

  if (!role) {
    return {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canManageMembers: false,
      canManageSettings: false,
    };
  }

  switch (role) {
    case "ADMIN":
      return {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canManageMembers: true,
        canManageSettings: true,
      };
    case "MEMBER":
      return {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canManageMembers: false,
        canManageSettings: false,
      };
    case "VIEWER":
      return {
        canView: true,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canManageMembers: false,
        canManageSettings: false,
      };
    default:
      return {
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canManageMembers: false,
        canManageSettings: false,
      };
  }
}

export function useHasPermission(
  requiredPermission: keyof Permission,
): boolean {
  const permissions = usePermissions();
  return permissions[requiredPermission];
}

export function useIsAdmin(): boolean {
  const { data: session } = useSession();
  const role = session?.user?.organizations?.[0]?.role;
  return role === "ADMIN";
}

export function useIsMember(): boolean {
  const { data: session } = useSession();
  const role = session?.user?.organizations?.[0]?.role;
  return role === "MEMBER" || role === "ADMIN";
}

export function useIsViewer(): boolean {
  const { data: session } = useSession();
  const role = session?.user?.organizations?.[0]?.role;
  return role === "VIEWER";
}
