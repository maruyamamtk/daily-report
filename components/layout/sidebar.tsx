/**
 * Sidebar Component
 *
 * Navigation sidebar for authenticated pages.
 * Shows navigation menu with role-based access control.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface NavigationItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  /**
   * Required role to access this item
   * If not specified, accessible to all authenticated users
   */
  requiredRole?: "営業" | "上長" | "管理者";
}

interface SidebarProps {
  /**
   * User role for access control
   */
  userRole?: "営業" | "上長" | "管理者";
  /**
   * Whether sidebar is open (mobile)
   */
  isOpen?: boolean;
  /**
   * Callback when sidebar should close (mobile)
   */
  onClose?: () => void;
}

const navigationItems: NavigationItem[] = [
  {
    title: "ダッシュボード",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "日報一覧",
    href: "/daily-reports",
    icon: FileText,
  },
  {
    title: "顧客一覧",
    href: "/customers",
    icon: Building2,
  },
  {
    title: "営業マスタ",
    href: "/employees",
    icon: Users,
    requiredRole: "管理者",
  },
];

export function Sidebar({ userRole, isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();

  // Filter navigation items based on user role
  const accessibleItems = navigationItems.filter((item) => {
    if (!item.requiredRole) return true;
    return userRole === item.requiredRole;
  });

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 border-r bg-background transition-transform duration-200 ease-in-out md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Mobile header */}
          <div className="flex h-16 items-center justify-between border-b px-4 md:hidden">
            <h2 className="text-lg font-semibold">メニュー</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="メニューを閉じる"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {accessibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      // Close sidebar on mobile when item is clicked
                      if (onClose) onClose();
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </div>

            <Separator className="my-4" />

            {/* User role indicator */}
            {userRole && (
              <div className="rounded-lg bg-muted px-3 py-2">
                <p className="text-xs text-muted-foreground">ログイン中</p>
                <p className="text-sm font-medium">{userRole}</p>
              </div>
            )}
          </nav>

          {/* Footer */}
          <div className="border-t p-4">
            <p className="text-xs text-muted-foreground">
              © 2026 営業日報システム
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
