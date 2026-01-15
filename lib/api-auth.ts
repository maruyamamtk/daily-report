/**
 * API Route Authentication Utilities
 *
 * Provides utilities for checking authentication and roles in API Routes.
 * Use these helpers to protect API endpoints based on user roles.
 *
 * @see CLAUDE.md - 権限制御セクション
 */

import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole, UserRoleType } from "@/types/roles";

/**
 * Error response for unauthorized access (401)
 */
export function unauthorizedResponse(message = "認証が必要です") {
  return Response.json(
    { error: { code: "UNAUTHORIZED", message } },
    { status: 401 }
  );
}

/**
 * Error response for forbidden access (403)
 */
export function forbiddenResponse(message = "この操作を実行する権限がありません") {
  return Response.json(
    { error: { code: "FORBIDDEN", message } },
    { status: 403 }
  );
}

/**
 * Get the current session in API Routes
 *
 * @returns The current session or null if not authenticated
 */
export async function getApiSession() {
  return await getServerSession(authOptions);
}

/**
 * Get the current user in API Routes
 *
 * @returns The current user or null if not authenticated
 */
export async function getApiUser() {
  const session = await getApiSession();
  return session?.user ?? null;
}

/**
 * Require authentication in API Routes
 * Returns 401 response if not authenticated
 *
 * @returns The authenticated user or Response object if not authenticated
 */
export async function requireApiAuth() {
  const user = await getApiUser();

  if (!user) {
    return { user: null, error: unauthorizedResponse() };
  }

  return { user, error: null };
}

/**
 * Require authentication with valid employeeId in API Routes
 * Returns 401 if not authenticated, 400 if employeeId is missing
 *
 * @returns The authenticated user with employeeId or Response object if unauthorized/invalid
 *
 * @example
 * ```tsx
 * // In an API route
 * export async function DELETE(request: NextRequest) {
 *   const { user, error } = await requireApiAuthWithEmployeeId();
 *   if (error) return error;
 *
 *   // User is authenticated and has valid employeeId
 *   // ... handle request
 * }
 * ```
 */
export async function requireApiAuthWithEmployeeId() {
  const { user, error } = await requireApiAuth();

  if (error) {
    return { user: null, error };
  }

  if (!user!.employeeId) {
    return {
      user: null,
      error: Response.json(
        {
          error: {
            code: "INVALID_USER",
            message: "ユーザー情報が不正です",
          },
        },
        { status: 400 }
      ),
    };
  }

  return { user, error: null };
}

/**
 * Require specific role(s) in API Routes
 * Returns 401 if not authenticated, 403 if user doesn't have required role
 *
 * @param allowedRoles - Single role or array of allowed roles
 * @returns The authenticated user with required role or Response object if unauthorized/forbidden
 *
 * @example
 * ```tsx
 * // In an API route
 * export async function POST(request: NextRequest) {
 *   const { user, error } = await requireApiRole(UserRole.ADMIN);
 *   if (error) return error;
 *
 *   // User is authenticated and has admin role
 *   // ... handle request
 * }
 *
 * // Allow multiple roles
 * const { user, error } = await requireApiRole([UserRole.MANAGER, UserRole.ADMIN]);
 * ```
 */
export async function requireApiRole(
  allowedRoles: UserRoleType | UserRoleType[]
) {
  const { user, error } = await requireApiAuth();

  if (error) {
    return { user: null, error };
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const hasRequiredRole = roles.includes(user!.role);

  if (!hasRequiredRole) {
    return { user: null, error: forbiddenResponse() };
  }

  return { user, error: null };
}

/**
 * Check if the API user can comment on reports
 * Only managers and admins can comment
 *
 * @returns Object with canComment flag and optional error response
 */
export async function canApiComment() {
  const { user, error } = await requireApiAuth();

  if (error) {
    return { canComment: false, error };
  }

  const canComment = user!.role === UserRole.MANAGER || user!.role === UserRole.ADMIN;

  if (!canComment) {
    return {
      canComment: false,
      error: forbiddenResponse("コメントを投稿する権限がありません"),
    };
  }

  return { canComment: true, user, error: null };
}

/**
 * Check if the API user can edit a specific daily report
 * Users can only edit their own reports
 *
 * @param reportEmployeeId - The employee ID of the report owner
 * @returns Object with canEdit flag and optional error response
 */
export async function canApiEditReport(reportEmployeeId: number) {
  const { user, error } = await requireApiAuth();

  if (error) {
    return { canEdit: false, error };
  }

  const canEdit = user!.employeeId === reportEmployeeId;

  if (!canEdit) {
    return {
      canEdit: false,
      error: forbiddenResponse("自分の日報のみ編集できます"),
    };
  }

  return { canEdit: true, user, error: null };
}

/**
 * Check if the API user can view a specific daily report
 * - Sales can only view their own reports
 * - Managers can view their own and subordinates' reports
 * - Admins can view all reports
 *
 * @param reportEmployeeId - The employee ID of the report owner
 * @param reportEmployeeManagerId - The manager ID of the report owner
 * @returns Object with canView flag and optional error response
 */
export async function canApiViewReport(
  reportEmployeeId: number,
  reportEmployeeManagerId: number | null
) {
  const { user, error } = await requireApiAuth();

  if (error) {
    return { canView: false, error };
  }

  // Admin can view all reports
  if (user!.role === UserRole.ADMIN) {
    return { canView: true, user, error: null };
  }

  // User can view their own reports
  if (user!.employeeId === reportEmployeeId) {
    return { canView: true, user, error: null };
  }

  // Manager can view subordinates' reports
  if (user!.role === UserRole.MANAGER && user!.employeeId === reportEmployeeManagerId) {
    return { canView: true, user, error: null };
  }

  return {
    canView: false,
    error: forbiddenResponse("この日報を閲覧する権限がありません"),
  };
}

/**
 * Check if the API user can access employee management
 * Only admins can access employee management
 *
 * @returns Object with canAccess flag and optional error response
 */
export async function canApiAccessEmployeeManagement() {
  return await requireApiRole(UserRole.ADMIN);
}
