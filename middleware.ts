/**
 * Next.js Middleware for Authentication
 *
 * This middleware protects routes that require authentication using NextAuth.js.
 * It runs on every request and checks if the user is authenticated before
 * allowing access to protected routes.
 *
 * @see https://next-auth.js.org/configuration/nextjs#middleware
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 */

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { isAdmin } from "@/types/roles";

/**
 * Middleware configuration using NextAuth's withAuth wrapper
 *
 * This middleware:
 * 1. Handles root path (/) redirects based on authentication status
 * 2. Protects specified routes from unauthenticated access
 * 3. Redirects unauthenticated users to /login
 * 4. Redirects authenticated users from /login to /dashboard
 * 5. Enforces role-based access control (RBAC) for /employees routes (administrators only)
 */
export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    /**
     * Root path (/) handling
     * - Authenticated users: redirect to /dashboard
     * - Unauthenticated users: redirect to /login
     */
    if (pathname === "/") {
      if (token) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      } else {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    /**
     * If user is authenticated and trying to access login page,
     * redirect them to dashboard
     */
    if (token && pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    /**
     * Role-based access control for /employees routes
     * Only administrators (管理者) can access employee management pages
     */
    if (pathname.startsWith("/employees")) {
      if (!isAdmin(token?.role)) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    /**
     * Allow access to protected routes for authenticated users
     */
    return NextResponse.next();
  },
  {
    callbacks: {
      /**
       * Determines if the request is authorized
       * Return true to allow access, false to redirect to login
       */
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        /**
         * Allow access to login page for unauthenticated users
         */
        if (pathname === "/login") {
          return true;
        }

        /**
         * Require authentication for all other protected routes
         */
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

/**
 * Matcher configuration - specifies which routes this middleware applies to
 *
 * Protected routes:
 * - /dashboard (and all sub-routes)
 * - /daily-reports (and all sub-routes)
 * - /customers (and all sub-routes)
 * - /employees (and all sub-routes)
 *
 * Public routes (excluded from matcher):
 * - /login
 * - /api/auth/* (NextAuth API routes)
 * - /_next/* (Next.js internal routes)
 * - /favicon.ico, /robots.txt (static files)
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /api/auth/* (NextAuth API routes)
     * - /_next/* (Next.js internals)
     * - /favicon.ico, /robots.txt (static files)
     * - Files with extensions (.png, .jpg, .css, .js, etc.)
     */
    "/((?!api/auth|_next|favicon.ico|robots.txt|.*\\..*).*)",
  ],
};
