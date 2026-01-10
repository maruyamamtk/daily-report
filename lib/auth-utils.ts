/**
 * Authentication Utilities for Role-Based Access Control (RBAC)
 *
 * Provides utilities for checking user roles and permissions
 * in both Server Components and Client Components.
 *
 * @see CLAUDE.md - 権限制御セクション
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole, UserRoleType, isAdmin, isManager } from "@/types/roles";
import { redirect } from "next/navigation";

/**
 * Get the current session (Server Components only)
 *
 * @returns The current session or null if not authenticated
 */
export async function getCurrentSession() {
  return await getServerSession(authOptions);
}

/**
 * Get the current user from session (Server Components only)
 *
 * @returns The current user or null if not authenticated
 */
export async function getCurrentUser() {
  const session = await getCurrentSession();
  return session?.user ?? null;
}

/**
 * Require authentication - redirect to login if not authenticated
 * Use this in Server Components to protect pages
 *
 * @returns The authenticated user
 */
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

/**
 * Require specific role(s) - redirect to 403 if user doesn't have required role
 * Use this in Server Components to protect pages based on role
 *
 * @param allowedRoles - Single role or array of allowed roles
 * @returns The authenticated user with the required role
 *
 * @example
 * ```tsx
 * // Require admin role
 * await requireRole(UserRole.ADMIN);
 *
 * // Allow either manager or admin
 * await requireRole([UserRole.MANAGER, UserRole.ADMIN]);
 * ```
 */
export async function requireRole(
  allowedRoles: UserRoleType | UserRoleType[]
) {
  const user = await requireAuth();

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const hasRequiredRole = roles.includes(user.role);

  if (!hasRequiredRole) {
    redirect("/forbidden");
  }

  return user;
}

/**
 * Check if the current user has a specific role (Server Components)
 *
 * @param role - The role to check
 * @returns True if the user has the specified role, false otherwise
 */
export async function hasUserRole(role: UserRoleType): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === role;
}

/**
 * Check if the current user is an administrator (Server Components)
 *
 * @returns True if the user is an admin, false otherwise
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return isAdmin(user?.role);
}

/**
 * Check if the current user is a manager (Server Components)
 *
 * @returns True if the user is a manager, false otherwise
 */
export async function isCurrentUserManager(): Promise<boolean> {
  const user = await getCurrentUser();
  return isManager(user?.role);
}

/**
 * Check if the current user can comment on reports
 * Only managers and admins can comment
 *
 * @returns True if the user can comment, false otherwise
 */
export async function canComment(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  return user.role === UserRole.MANAGER || user.role === UserRole.ADMIN;
}

/**
 * Check if the current user can access employee management
 * Only admins can access employee management
 *
 * @returns True if the user can access employee management, false otherwise
 */
export async function canAccessEmployeeManagement(): Promise<boolean> {
  return await isCurrentUserAdmin();
}

/**
 * Check if the current user can edit a specific daily report
 * Users can only edit their own reports
 *
 * @param reportEmployeeId - The employee ID of the report owner
 * @returns True if the user can edit the report, false otherwise
 */
export async function canEditReport(reportEmployeeId: number): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  return user.employeeId === reportEmployeeId;
}

/**
 * Check if the current user can view a specific daily report
 * - Sales can only view their own reports
 * - Managers can view their own and subordinates' reports
 * - Admins can view all reports
 *
 * @param reportEmployeeId - The employee ID of the report owner
 * @param reportEmployeeManagerId - The manager ID of the report owner
 * @returns True if the user can view the report, false otherwise
 */
export async function canViewReport(
  reportEmployeeId: number,
  reportEmployeeManagerId: number | null
): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

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
