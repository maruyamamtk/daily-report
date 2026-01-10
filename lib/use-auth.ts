/**
 * Client-side Authentication Hooks
 *
 * Custom React hooks for role-based access control in Client Components.
 * Use these hooks to check user roles and permissions on the client side.
 *
 * @see CLAUDE.md - 権限制御セクション
 */

"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { UserRole, UserRoleType, isAdmin, isManager } from "@/types/roles";

/**
 * Hook to get the current session
 *
 * @returns The session object from next-auth
 */
export function useAuth() {
  return useSession();
}

/**
 * Hook to get the current user
 *
 * @returns The current user or undefined if not authenticated
 */
export function useCurrentUser() {
  const { data: session } = useSession();
  return session?.user;
}

/**
 * Hook to require authentication
 * Redirects to login if not authenticated
 *
 * @returns The authenticated user or undefined while loading
 */
export function useRequireAuth() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  return session?.user;
}

/**
 * Hook to require specific role(s)
 * Redirects to forbidden page if user doesn't have required role
 *
 * @param allowedRoles - Single role or array of allowed roles
 * @returns The authenticated user with required role or undefined while loading
 *
 * @example
 * ```tsx
 * // Require admin role
 * const user = useRequireRole(UserRole.ADMIN);
 *
 * // Allow either manager or admin
 * const user = useRequireRole([UserRole.MANAGER, UserRole.ADMIN]);
 * ```
 */
export function useRequireRole(allowedRoles: UserRoleType | UserRoleType[]) {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (session?.user) {
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      const hasRequiredRole = roles.includes(session.user.role);

      if (!hasRequiredRole) {
        router.push("/forbidden");
      }
    }
  }, [status, session, allowedRoles, router]);

  return session?.user;
}

/**
 * Hook to check if the current user has a specific role
 *
 * @param role - The role to check
 * @returns True if the user has the specified role, false otherwise
 */
export function useHasRole(role: UserRoleType): boolean {
  const user = useCurrentUser();
  return user?.role === role;
}

/**
 * Hook to check if the current user is an administrator
 *
 * @returns True if the user is an admin, false otherwise
 */
export function useIsAdmin(): boolean {
  const user = useCurrentUser();
  return isAdmin(user?.role);
}

/**
 * Hook to check if the current user is a manager
 *
 * @returns True if the user is a manager, false otherwise
 */
export function useIsManager(): boolean {
  const user = useCurrentUser();
  return isManager(user?.role);
}

/**
 * Hook to check if the current user can comment on reports
 * Only managers and admins can comment
 *
 * @returns True if the user can comment, false otherwise
 */
export function useCanComment(): boolean {
  const user = useCurrentUser();
  if (!user) return false;

  return user.role === UserRole.MANAGER || user.role === UserRole.ADMIN;
}

/**
 * Hook to check if the current user can access employee management
 * Only admins can access employee management
 *
 * @returns True if the user can access employee management, false otherwise
 */
export function useCanAccessEmployeeManagement(): boolean {
  return useIsAdmin();
}

/**
 * Hook to check if the current user can edit a specific daily report
 * Users can only edit their own reports
 *
 * @param reportEmployeeId - The employee ID of the report owner
 * @returns True if the user can edit the report, false otherwise
 */
export function useCanEditReport(reportEmployeeId: number | null | undefined): boolean {
  const user = useCurrentUser();
  if (!user || reportEmployeeId === null || reportEmployeeId === undefined) return false;

  return user.employeeId === reportEmployeeId;
}

/**
 * Hook to check if the current user can view a specific daily report
 * - Sales can only view their own reports
 * - Managers can view their own and subordinates' reports
 * - Admins can view all reports
 *
 * @param reportEmployeeId - The employee ID of the report owner
 * @param reportEmployeeManagerId - The manager ID of the report owner
 * @returns True if the user can view the report, false otherwise
 */
export function useCanViewReport(
  reportEmployeeId: number | null | undefined,
  reportEmployeeManagerId: number | null | undefined
): boolean {
  const user = useCurrentUser();
  if (!user || reportEmployeeId === null || reportEmployeeId === undefined) return false;

  // Admin can view all reports
  if (user.role === UserRole.ADMIN) return true;

  // User can view their own reports
  if (user.employeeId === reportEmployeeId) return true;

  // Manager can view subordinates' reports
  if (user.role === UserRole.MANAGER && user.employeeId === reportEmployeeManagerId) {
    return true;
  }

  return false;
}
