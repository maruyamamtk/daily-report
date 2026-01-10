/**
 * NextAuth Type Extensions
 *
 * Extends NextAuth's default types to include custom user fields.
 * This provides type safety when accessing user data in sessions.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */

import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";
import { UserRoleType } from "./roles";

/**
 * Extend the built-in session types
 */
declare module "next-auth" {
  /**
   * User interface with custom fields
   */
  interface User extends DefaultUser {
    id: string;
    email: string;
    name: string | null;
    role: UserRoleType; // 営業, 上長, 管理者
    employeeId: number | null;
    managerId?: number | null;
  }

  /**
   * Session interface with custom user fields
   */
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      role: UserRoleType; // 営業, 上長, 管理者
      employeeId: number | null;
      managerId: number | null;
    } & DefaultSession["user"];
  }
}

/**
 * Extend the built-in JWT types
 */
declare module "next-auth/jwt" {
  /**
   * JWT token interface with custom fields
   */
  interface JWT extends DefaultJWT {
    id: string;
    email: string;
    name: string | null;
    role: UserRoleType; // 営業, 上長, 管理者
    employeeId: number | null;
    managerId: number | null;
  }
}
