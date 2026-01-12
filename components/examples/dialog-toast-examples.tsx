/**
 * Dialog and Toast Examples
 *
 * ダイアログとトースト通知の使用例
 * このファイルは実装例として参照してください
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  AlertDialog,
  FormDialog,
  useConfirmationDialog,
} from "@/lib/notifications";

/**
 * トースト通知の使用例
 */
export function ToastExamples() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">トースト通知の例</h2>

      <div className="space-x-2">
        <Button
          onClick={() =>
            showSuccessToast("成功しました", "データが正常に保存されました")
          }
        >
          成功通知
        </Button>

        <Button
          variant="destructive"
          onClick={() =>
            showErrorToast("エラーが発生しました", "データの保存に失敗しました")
          }
        >
          エラー通知
        </Button>

        <Button
          onClick={() =>
            showWarningToast("警告", "この操作は慎重に行ってください")
          }
        >
          警告通知
        </Button>

        <Button
          onClick={() => showInfoToast("情報", "新しい通知があります")}
        >
          情報通知
        </Button>
      </div>
    </div>
  );
}

/**
 * 削除確認ダイアログの使用例
 */
export function DeleteConfirmationExample() {
  const deleteDialog = useConfirmationDialog();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      // 削除処理のシミュレーション
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showSuccessToast("削除しました", "データを削除しました");
    } catch (error) {
      showErrorToast("削除に失敗しました", "もう一度お試しください");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">削除確認ダイアログの例</h2>

      <Button variant="destructive" onClick={deleteDialog.open}>
        削除
      </Button>

      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={(open) => (open ? deleteDialog.open() : deleteDialog.close())}
        title="削除確認"
        description="本当に削除しますか？この操作は取り消せません。"
        confirmText="削除"
        cancelText="キャンセル"
        variant="destructive"
        onConfirm={handleDelete}
        loading={loading}
      />
    </div>
  );
}

/**
 * フォームダイアログの使用例
 */
export function FormDialogExample() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showSuccessToast("登録しました", `${name}を登録しました`);
    setOpen(false);
    setName("");
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">フォームダイアログの例</h2>

      <Button onClick={() => setOpen(true)}>顧客登録</Button>

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="顧客登録"
        description="新しい顧客を登録します"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              顧客名
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="株式会社サンプル"
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              キャンセル
            </Button>
            <Button type="submit">登録</Button>
          </div>
        </form>
      </FormDialog>
    </div>
  );
}

/**
 * 実際の使用例（日報削除）
 */
export function DailyReportDeleteExample() {
  const deleteDialog = useConfirmationDialog();
  const [loading, setLoading] = useState(false);

  const handleDeleteReport = async () => {
    setLoading(true);
    try {
      // APIコールの例
      // const response = await fetch(`/api/daily-reports/${reportId}`, {
      //   method: 'DELETE',
      // });
      // if (!response.ok) throw new Error('削除に失敗しました');

      await new Promise((resolve) => setTimeout(resolve, 1000)); // シミュレーション
      showSuccessToast("日報を削除しました");
      // router.push('/daily-reports'); などで画面遷移
    } catch (error) {
      showErrorToast(
        "削除に失敗しました",
        error instanceof Error ? error.message : "もう一度お試しください"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">実装例: 日報削除</h2>

      <Button variant="destructive" onClick={deleteDialog.open}>
        この日報を削除
      </Button>

      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={(open) => (open ? deleteDialog.open() : deleteDialog.close())}
        title="日報の削除"
        description="本当にこの日報を削除しますか？削除した日報は復元できません。"
        confirmText="削除する"
        cancelText="キャンセル"
        variant="destructive"
        onConfirm={handleDeleteReport}
        loading={loading}
      />
    </div>
  );
}

/**
 * 全ての例をまとめたページコンポーネント
 */
export function DialogToastExamplesPage() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">ダイアログとトースト通知の使用例</h1>

      <div className="space-y-8 border-t pt-8">
        <ToastExamples />
      </div>

      <div className="space-y-8 border-t pt-8">
        <DeleteConfirmationExample />
      </div>

      <div className="space-y-8 border-t pt-8">
        <FormDialogExample />
      </div>

      <div className="space-y-8 border-t pt-8">
        <DailyReportDeleteExample />
      </div>
    </div>
  );
}
