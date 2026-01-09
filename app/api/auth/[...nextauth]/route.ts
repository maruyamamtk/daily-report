/**
 * NextAuth.js API Route Handler
 *
 * This file handles all authentication-related requests (login, logout, session, etc.)
 * using the catch-all route pattern [...nextauth].
 *
 * @see https://next-auth.js.org/configuration/initialization#route-handlers-app
 */

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Initialize NextAuth handler with configuration
 */
const handler = NextAuth(authOptions);

/**
 * Export handlers for GET and POST requests
 * Next.js App Router requires explicit method exports
 */
export { handler as GET, handler as POST };
