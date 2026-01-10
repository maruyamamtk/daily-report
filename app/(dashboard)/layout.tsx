/**
 * Dashboard Layout
 *
 * Layout for authenticated dashboard pages.
 * Includes Header, Sidebar, and optional Footer.
 */

"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Footer } from "@/components/layout/footer";

// TODO: Replace with actual auth integration (NextAuth)
// This is a placeholder until authentication is implemented
const MOCK_USER = {
  name: "テストユーザー",
  email: "test@example.com",
  role: "営業" as const,
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // TODO: Implement actual logout functionality with NextAuth
  const handleLogout = () => {
    console.log("Logout clicked - implement with NextAuth");
    // Example: signOut({ callbackUrl: '/login' })
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <Header
        user={MOCK_USER}
        onLogout={handleLogout}
        onMenuClick={toggleSidebar}
      />

      {/* Main content with sidebar */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar
          userRole={MOCK_USER.role}
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
        />

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-6 md:px-6 md:py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Optional Footer */}
      {/* Uncomment to enable footer */}
      {/* <Footer /> */}
    </div>
  );
}
