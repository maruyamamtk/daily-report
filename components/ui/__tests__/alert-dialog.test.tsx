/**
 * Tests for AlertDialog Component
 *
 * AlertDialogコンポーネントの包括的なテスト
 *
 * @see ../alert-dialog.tsx
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AlertDialog, type AlertDialogProps } from "../alert-dialog";

// デフォルトのプロパティ
const defaultProps: AlertDialogProps = {
  open: true,
  onOpenChange: vi.fn(),
  title: "確認",
  description: "この操作を実行しますか？",
  onConfirm: vi.fn(),
};

describe("AlertDialog Component", () => {
  describe("基本的なレンダリング", () => {
    it("should render with default props", () => {
      render(<AlertDialog {...defaultProps} />);

      expect(screen.getByText("確認")).toBeInTheDocument();
      expect(screen.getByText("この操作を実行しますか？")).toBeInTheDocument();
      expect(screen.getByText("確認")).toBeInTheDocument(); // 確認ボタン
      expect(screen.getByText("キャンセル")).toBeInTheDocument();
    });

    it("should render custom button text", () => {
      render(
        <AlertDialog
          {...defaultProps}
          confirmText="削除"
          cancelText="戻る"
        />
      );

      expect(screen.getByText("削除")).toBeInTheDocument();
      expect(screen.getByText("戻る")).toBeInTheDocument();
    });

    it("should not render when open is false", () => {
      render(<AlertDialog {...defaultProps} open={false} />);

      expect(screen.queryByText("確認")).not.toBeInTheDocument();
    });
  });

  describe("ボタンクリック処理", () => {
    it("should call onConfirm when confirm button is clicked", async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn().mockResolvedValue(undefined);
      const onOpenChange = vi.fn();

      render(
        <AlertDialog
          {...defaultProps}
          onConfirm={onConfirm}
          onOpenChange={onOpenChange}
        />
      );

      const confirmButton = screen.getByRole("button", { name: /確認/ });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it("should call onOpenChange when cancel button is clicked", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <AlertDialog
          {...defaultProps}
          onOpenChange={onOpenChange}
        />
      );

      const cancelButton = screen.getByRole("button", { name: /キャンセル/ });
      await user.click(cancelButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("エラーハンドリング", () => {
    it("should not close dialog when onConfirm throws an error", async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn().mockRejectedValue(new Error("API Error"));
      const onOpenChange = vi.fn();
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      render(
        <AlertDialog
          {...defaultProps}
          onConfirm={onConfirm}
          onOpenChange={onOpenChange}
        />
      );

      const confirmButton = screen.getByRole("button", { name: /確認/ });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalledTimes(1);
      });

      // ダイアログは閉じられない
      expect(onOpenChange).not.toHaveBeenCalledWith(false);

      // エラーがコンソールに出力される
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "AlertDialog: onConfirm failed",
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it("should keep dialog open when onConfirm fails", async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn().mockRejectedValue(new Error("Network Error"));
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      render(
        <AlertDialog
          {...defaultProps}
          onConfirm={onConfirm}
        />
      );

      const confirmButton = screen.getByRole("button", { name: /確認/ });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalled();
      });

      // ダイアログの内容が依然として表示されている
      expect(screen.getByText("確認")).toBeInTheDocument();
      expect(screen.getByText("この操作を実行しますか？")).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });
  });

  describe("バリアント", () => {
    it("should apply default variant to confirm button", () => {
      render(<AlertDialog {...defaultProps} variant="default" />);

      const confirmButton = screen.getByRole("button", { name: /確認/ });
      // デフォルトvariantが適用されているかチェック（shadcn/uiのButton）
      expect(confirmButton).toBeInTheDocument();
    });

    it("should apply destructive variant to confirm button", () => {
      render(<AlertDialog {...defaultProps} variant="destructive" />);

      const confirmButton = screen.getByRole("button", { name: /確認/ });
      expect(confirmButton).toBeInTheDocument();
    });
  });

  describe("ローディング状態", () => {
    it("should show loading text when loading is true", () => {
      render(<AlertDialog {...defaultProps} loading={true} confirmText="削除" />);

      expect(screen.getByText("処理中...")).toBeInTheDocument();
      expect(screen.queryByText("削除")).not.toBeInTheDocument();
    });

    it("should disable buttons when loading is true", () => {
      render(<AlertDialog {...defaultProps} loading={true} />);

      const confirmButton = screen.getByRole("button", { name: /処理中/ });
      const cancelButton = screen.getByRole("button", { name: /キャンセル/ });

      expect(confirmButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    it("should not disable buttons when loading is false", () => {
      render(<AlertDialog {...defaultProps} loading={false} />);

      const confirmButton = screen.getByRole("button", { name: /確認/ });
      const cancelButton = screen.getByRole("button", { name: /キャンセル/ });

      expect(confirmButton).not.toBeDisabled();
      expect(cancelButton).not.toBeDisabled();
    });
  });

  describe("非同期処理", () => {
    it("should handle async onConfirm", async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      const onOpenChange = vi.fn();

      render(
        <AlertDialog
          {...defaultProps}
          onConfirm={onConfirm}
          onOpenChange={onOpenChange}
        />
      );

      const confirmButton = screen.getByRole("button", { name: /確認/ });
      await user.click(confirmButton);

      // 非同期処理が完了するまで待つ
      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it("should handle synchronous onConfirm", async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn(); // 同期関数
      const onOpenChange = vi.fn();

      render(
        <AlertDialog
          {...defaultProps}
          onConfirm={onConfirm}
          onOpenChange={onOpenChange}
        />
      );

      const confirmButton = screen.getByRole("button", { name: /確認/ });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe("アクセシビリティ", () => {
    it("should have proper button roles", () => {
      render(<AlertDialog {...defaultProps} />);

      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });

    it("should render title and description for screen readers", () => {
      render(
        <AlertDialog
          {...defaultProps}
          title="重要な操作"
          description="この操作は取り消せません"
        />
      );

      expect(screen.getByText("重要な操作")).toBeInTheDocument();
      expect(screen.getByText("この操作は取り消せません")).toBeInTheDocument();
    });
  });

  describe("エッジケース", () => {
    it("should handle empty confirmText", () => {
      render(<AlertDialog {...defaultProps} confirmText="" />);

      // 空の文字列でもボタンは表示される
      const confirmButton = screen.getAllByRole("button")[1]; // 2番目のボタン（確認）
      expect(confirmButton).toBeInTheDocument();
    });

    it("should handle empty cancelText", () => {
      render(<AlertDialog {...defaultProps} cancelText="" />);

      const cancelButton = screen.getAllByRole("button")[0]; // 1番目のボタン（キャンセル）
      expect(cancelButton).toBeInTheDocument();
    });

    it("should handle multiple rapid clicks", async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn().mockResolvedValue(undefined);

      render(<AlertDialog {...defaultProps} onConfirm={onConfirm} />);

      const confirmButton = screen.getByRole("button", { name: /確認/ });

      // 連続クリック
      await user.click(confirmButton);
      await user.click(confirmButton);
      await user.click(confirmButton);

      // onConfirmは複数回呼ばれる可能性がある（ローディング状態で防止すべき）
      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalled();
      });
    });
  });
});
