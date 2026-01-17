/**
 * Quick Actions Component
 *
 * Displays quick action buttons for common tasks on the dashboard.
 */

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, List, Users, UserCog } from "lucide-react";

interface QuickActionsProps {
  userRole: string;
}

export function QuickActions({ userRole }: QuickActionsProps) {
  const isAdmin = userRole === "管理者";

  return (
    <Card>
      <CardHeader>
        <CardTitle>クイックアクション</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Button asChild className="h-auto flex-col gap-2 py-4">
            <Link href="/daily-reports/new">
              <FileText className="h-6 w-6" />
              <span>日報作成</span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto flex-col gap-2 py-4">
            <Link href="/daily-reports">
              <List className="h-6 w-6" />
              <span>日報一覧</span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto flex-col gap-2 py-4">
            <Link href="/customers">
              <Users className="h-6 w-6" />
              <span>顧客一覧</span>
            </Link>
          </Button>

          {isAdmin && (
            <Button asChild variant="outline" className="h-auto flex-col gap-2 py-4">
              <Link href="/employees">
                <UserCog className="h-6 w-6" />
                <span>営業マスタ</span>
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
