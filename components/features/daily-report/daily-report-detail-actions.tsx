/**
 * Daily Report Detail Actions Component
 *
 * Client component for handling delete action on daily report detail page.
 * Shows delete button with confirmation dialog.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Trash2 } from "lucide-react";

interface DailyReportDetailActionsProps {
  reportId: number;
  reportDate: string;
}

export function DailyReportDetailActions({
  reportId,
  reportDate,
}: DailyReportDetailActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/daily-reports/${reportId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "削除に失敗しました");
      }

      toast({
        title: "削除完了",
        description: "日報を削除しました",
      });

      // Redirect to list page
      router.push("/daily-reports");
      router.refresh();
    } catch (error) {
      console.error("Error deleting daily report:", error);
      toast({
        title: "削除失敗",
        description:
          error instanceof Error ? error.message : "日報の削除中にエラーが発生しました",
        variant: "destructive",
      });
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setShowDeleteDialog(true)}
        disabled={isDeleting}
        aria-label="日報を削除"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        削除
      </Button>

      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="日報を削除"
        description={`${reportDate}の日報を削除してもよろしいですか？この操作は取り消せません。`}
        confirmText="削除"
        cancelText="キャンセル"
        variant="destructive"
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </>
  );
}
