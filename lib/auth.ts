/**
 * NextAuth.js Configuration
 *
 * Configures authentication using Credentials provider with email/password.
 * Implements JWT-based session management with role-based access control.
 *
 * @see https://next-auth.js.org/configuration/options
 */

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

/**
 * NextAuth configuration options
 */
export const authOptions: NextAuthOptions = {
  // Use Prisma adapter for database sessions (optional, we're using JWT)
  adapter: PrismaAdapter(prisma),

  // Configure session strategy (JWT for stateless auth)
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Configure authentication pages
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login", // Error page redirects to login
  },

  // Configure authentication providers
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "your@email.com",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        // Validate credentials exist
        if (!credentials?.email || !credentials?.password) {
          throw new Error("メールアドレスとパスワードを入力してください");
        }

        // Find user by email
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
          include: {
            employee: true, // Include employee data for role mapping
          },
        });

        // Check if user exists
        if (!user) {
          throw new Error("メールアドレスまたはパスワードが正しくありません");
        }

        // Check if user has a password set
        if (!user.password) {
          throw new Error("このアカウントはパスワードログインに対応していません");
        }

        // Verify password using bcrypt
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("メールアドレスまたはパスワードが正しくありません");
        }

        // Return user object (will be passed to JWT callback)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          employeeId: user.employeeId,
        };
      },
    }),
  ],

  // Configure callbacks
  callbacks: {
    /**
     * JWT Callback
     * This callback is called whenever a JWT is created or updated.
     * Add custom fields to the token here.
     */
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.employeeId = user.employeeId;

        // Fetch employee data for managerId
        if (user.employeeId) {
          const employee = await prisma.employee.findUnique({
            where: { id: user.employeeId },
            select: { managerId: true },
          });
          token.managerId = employee?.managerId ?? null;
        }
      }

      // Handle session updates (when session is updated on client)
      if (trigger === "update" && session) {
        token.name = session.name;
      }

      return token;
    },

    /**
     * Session Callback
     * This callback is called whenever a session is checked.
     * Add custom fields to the session here (sent to client).
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
        session.user.employeeId = token.employeeId as number | null;
        session.user.managerId = token.managerId as number | null;
      }

      return session;
    },
  },

  // Enable debug messages in development
  debug: env.NODE_ENV === "development",

  // Secret for signing JWT
  secret: env.NEXTAUTH_SECRET,
};
