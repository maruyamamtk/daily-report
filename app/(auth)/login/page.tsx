/**
 * Login Page (S-01)
 *
 * Provides authentication interface for the Daily Report System.
 * Users must authenticate before accessing any other part of the system.
 *
 * @see screen-specification.md - S-01 ログイン画面
 */

import { LoginForm } from "@/components/features/auth/login-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ログイン | 営業日報システム",
  description: "営業日報システムへログインします",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <LoginForm />
    </div>
  );
}
