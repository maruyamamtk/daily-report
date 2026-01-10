/**
 * User Roles Type Definitions
 *
 * Defines user role constants and type-safe helper functions
 * to ensure consistent role checking across the application.
 *
 * @see CLAUDE.md - 権限制御セクション
 */

/**
 * User role enum
 *
 * - 営業 (Sales): Can only access their own reports
 * - 上長 (Manager): Can access their own and subordinates' reports
 * - 管理者 (Administrator): Full access to all features including employee management
 */
export const UserRole = {
  SALES: "営業",
  MANAGER: "上長",
  ADMIN: "管理者",
} as const;

/**
 * Type for user roles
 */
export type UserRoleType = typeof UserRole[keyof typeof UserRole];

/**
 * Type guard to check if a value is a valid user role
 *
 * @param role - The value to check
 * @returns True if the value is a valid user role
 */
export function isValidRole(role: unknown): role is UserRoleType {
  return (
    typeof role === "string" &&
    Object.values(UserRole).includes(role as UserRoleType)
  );
}

/**
 * Type-safe role checker
 *
 * @param userRole - The user's role (may be undefined)
 * @param requiredRole - The required role
 * @returns True if the user has the required role
 */
export function hasRole(
  userRole: string | null | undefined,
  requiredRole: UserRoleType
): boolean {
  return userRole === requiredRole;
}

/**
 * Check if user is an administrator
 *
 * @param userRole - The user's role
 * @returns True if the user is an administrator
 */
export function isAdmin(userRole: string | null | undefined): boolean {
  return hasRole(userRole, UserRole.ADMIN);
}

/**
 * Check if user is a manager
 *
 * @param userRole - The user's role
 * @returns True if the user is a manager
 */
export function isManager(userRole: string | null | undefined): boolean {
  return hasRole(userRole, UserRole.MANAGER);
}

/**
 * Check if user is a sales representative
 *
 * @param userRole - The user's role
 * @returns True if the user is a sales representative
 */
export function isSales(userRole: string | null | undefined): boolean {
  return hasRole(userRole, UserRole.SALES);
}
