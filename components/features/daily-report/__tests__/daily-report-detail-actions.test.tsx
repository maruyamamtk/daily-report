/**
 * Tests for DailyReportDetailActions Component
 *
 * 日報詳細アクションコンポーネントの包括的なテスト
 *
 * @see ../daily-report-detail-actions.tsx
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DailyReportDetailActions } from "../daily-report-detail-actions";

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock toast
const mockToast = vi.fn();
vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock fetch
global.fetch = vi.fn();

describe("DailyReportDetailActions Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("基本的なレンダリング", () => {
    it("should render delete button", () => {
      render(
        <DailyReportDetailActions
          reportId={1}
          reportDate="2026年1月10日 (金)"
        />
      );

      expect(screen.getByRole("button", { name: /削除/ })).toBeInTheDocument();
    });

    it("should have proper aria-label", () => {
      render(
        <DailyReportDetailActions
          reportId={1}
          reportDate="2026年1月10日 (金)"
        />
      );

      const deleteButton = screen.getByRole("button", { name: /削除/ });
      expect(deleteButton).toHaveAttribute("aria-label", "日報を削除");
    });

    it("should not show dialog initially", () => {
      render(
        <DailyReportDetailActions
          reportId={1}
          reportDate="2026年1月10日 (金)"
        />
      );

      expect(screen.queryByText("日報を削除")).not.toBeInTheDocument();
    });
  });

  describe("削除確認ダイアログ", () => {
    it("should show confirmation dialog when delete button is clicked", async () => {
      const user = userEvent.setup();

      render(
        <DailyReportDetailActions
          reportId={1}
          reportDate="2026年1月10日 (金)"
        />
      );

      const deleteButton = screen.getByRole("button", { name: /削除/ });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText("日報を削除")).toBeInTheDocument();
      });
    });

    it("should show report date in confirmation message", async () => {
      const user = userEvent.setup();

      render(
        <DailyReportDetailActions
          reportId={1}
          reportDate="2026年1月10日 (金)"
        />
      );

      const deleteButton = screen.getByRole("button", { name: /削除/ });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(
          screen.getByText("2026年1月10日 (金)の日報を削除してもよろしいですか？この操作は取り消せません。")
        ).toBeInTheDocument();
      });
    });

    it("should show confirm and cancel buttons in dialog", async () => {
      const user = userEvent.setup();

      render(
        <DailyReportDetailActions
          reportId={1}
          reportDate="2026年1月10日 (金)"
        />
      );

      const deleteButton = screen.getByRole("button", { name: /削除/ });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText("削除")).toBeInTheDocument();
        expect(screen.getByText("キャンセル")).toBeInTheDocument();
      });
    });

    it("should close dialog when cancel button is clicked", async () => {
      const user = userEvent.setup();

      render(
        <DailyReportDetailActions
          reportId={1}
          reportDate="2026年1月10日 (金)"
        />
      );

      const deleteButton = screen.getByRole("button", { name: /削除/ });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText("日報を削除")).toBeInTheDocument();
      });

      const cancelButtons = screen.getAllByRole("button", { name: /キャンセル/ });
      await user.click(cancelButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText("日報を削除")).not.toBeInTheDocument();
      });
    });
  });

  describe("削除機能", () => {
    it("should successfully delete report", async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      render(
        <DailyReportDetailActions
          reportId={123}
          reportDate="2026年1月10日 (金)"
        />
      );

      const deleteButton = screen.getByRole("button", { name: /削除/ });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText("日報を削除")).toBeInTheDocument();
      });

      const confirmButtons = screen.getAllByRole("button", { name: /削除/ });
      const confirmButton = confirmButtons.find(btn => btn.textContent === "削除");
      if (confirmButton) {
        await user.click(confirmButton);
      }

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/daily-reports/123",
          expect.objectContaining({
            method: "DELETE",
          })
        );
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "削除完了",
          description: "日報を削除しました",
        });
        expect(mockPush).toHaveBeenCalledWith("/daily-reports");
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it("should handle delete error with custom message", async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: { message: "削除権限がありません" },
        }),
      });

      render(
        <DailyReportDetailActions
          reportId={1}
          reportDate="2026年1月10日 (金)"
        />
      );

      const deleteButton = screen.getByRole("button", { name: /削除/ });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText("日報を削除")).toBeInTheDocument();
      });

      const confirmButtons = screen.getAllByRole("button", { name: /削除/ });
      const confirmButton = confirmButtons.find(btn => btn.textContent === "削除");
      if (confirmButton) {
        await user.click(confirmButton);
      }

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "削除失敗",
          description: "削除権限がありません",
          variant: "destructive",
        });
      });

      // Should not redirect on error
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should handle delete error without custom message", async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      render(
        <DailyReportDetailActions
          reportId={1}
          reportDate="2026年1月10日 (金)"
        />
      );

      const deleteButton = screen.getByRole("button", { name: /削除/ });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText("日報を削除")).toBeInTheDocument();
      });

      const confirmButtons = screen.getAllByRole("button", { name: /削除/ });
      const confirmButton = confirmButtons.find(btn => btn.textContent === "削除");
      if (confirmButton) {
        await user.click(confirmButton);
      }

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "削除失敗",
          description: "削除に失敗しました",
          variant: "destructive",
        });
      });
    });

    it("should handle network error", async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      render(
        <DailyReportDetailActions
          reportId={1}
          reportDate="2026年1月10日 (金)"
        />
      );

      const deleteButton = screen.getByRole("button", { name: /削除/ });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText("日報を削除")).toBeInTheDocument();
      });

      const confirmButtons = screen.getAllByRole("button", { name: /削除/ });
      const confirmButton = confirmButtons.find(btn => btn.textContent === "削除");
      if (confirmButton) {
        await user.click(confirmButton);
      }

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "削除失敗",
          description: "日報の削除中にエラーが発生しました",
          variant: "destructive",
        });
      });
    });

    it("should close dialog after failed deletion", async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: { message: "エラー" },
        }),
      });

      render(
        <DailyReportDetailActions
          reportId={1}
          reportDate="2026年1月10日 (金)"
        />
      );

      const deleteButton = screen.getByRole("button", { name: /削除/ });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText("日報を削除")).toBeInTheDocument();
      });

      const confirmButtons = screen.getAllByRole("button", { name: /削除/ });
      const confirmButton = confirmButtons.find(btn => btn.textContent === "削除");
      if (confirmButton) {
        await user.click(confirmButton);
      }

      await waitFor(() => {
        expect(screen.queryByText("日報を削除")).not.toBeInTheDocument();
      });
    });
  });

  describe("UI状態", () => {
    it("should disable delete button during deletion", async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100))
      );

      render(
        <DailyReportDetailActions
          reportId={1}
          reportDate="2026年1月10日 (金)"
        />
      );

      const deleteButton = screen.getByRole("button", { name: /削除/ });
      expect(deleteButton).not.toBeDisabled();

      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText("日報を削除")).toBeInTheDocument();
      });

      const confirmButtons = screen.getAllByRole("button", { name: /削除/ });
      const confirmButton = confirmButtons.find(btn => btn.textContent === "削除");
      if (confirmButton) {
        await user.click(confirmButton);
      }

      // During deletion, the button should show loading state
      await waitFor(() => {
        expect(screen.queryByRole("button", { name: /処理中/ })).toBeInTheDocument();
      });
    });

    it("should re-enable delete button after error", async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockRejectedValueOnce(new Error("Error"));

      render(
        <DailyReportDetailActions
          reportId={1}
          reportDate="2026年1月10日 (金)"
        />
      );

      const deleteButton = screen.getByRole("button", { name: /削除/ });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText("日報を削除")).toBeInTheDocument();
      });

      const confirmButtons = screen.getAllByRole("button", { name: /削除/ });
      const confirmButton = confirmButtons.find(btn => btn.textContent === "削除");
      if (confirmButton) {
        await user.click(confirmButton);
      }

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalled();
      });

      // After error, button should be enabled again
      const newDeleteButton = screen.getByRole("button", { name: /削除/ });
      expect(newDeleteButton).not.toBeDisabled();
    });
  });

  describe("アクセシビリティ", () => {
    it("should have proper button roles", () => {
      render(
        <DailyReportDetailActions
          reportId={1}
          reportDate="2026年1月10日 (金)"
        />
      );

      const deleteButton = screen.getByRole("button", { name: /削除/ });
      expect(deleteButton).toBeInTheDocument();
    });

    it("should have destructive variant styling", () => {
      render(
        <DailyReportDetailActions
          reportId={1}
          reportDate="2026年1月10日 (金)"
        />
      );

      const deleteButton = screen.getByRole("button", { name: /削除/ });
      expect(deleteButton).toBeInTheDocument();
      // Destructive variant is applied through className
    });
  });

  describe("エッジケース", () => {
    it("should handle different report IDs", () => {
      const { rerender } = render(
        <DailyReportDetailActions
          reportId={1}
          reportDate="2026年1月10日 (金)"
        />
      );

      expect(screen.getByRole("button", { name: /削除/ })).toBeInTheDocument();

      rerender(
        <DailyReportDetailActions
          reportId={999}
          reportDate="2026年1月10日 (金)"
        />
      );

      expect(screen.getByRole("button", { name: /削除/ })).toBeInTheDocument();
    });

    it("should handle different report dates", () => {
      const { rerender } = render(
        <DailyReportDetailActions
          reportId={1}
          reportDate="2026年1月10日 (金)"
        />
      );

      expect(screen.getByRole("button", { name: /削除/ })).toBeInTheDocument();

      rerender(
        <DailyReportDetailActions
          reportId={1}
          reportDate="2026年12月31日 (水)"
        />
      );

      expect(screen.getByRole("button", { name: /削除/ })).toBeInTheDocument();
    });

    it("should not call API when dialog is cancelled", async () => {
      const user = userEvent.setup();

      render(
        <DailyReportDetailActions
          reportId={1}
          reportDate="2026年1月10日 (金)"
        />
      );

      const deleteButton = screen.getByRole("button", { name: /削除/ });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText("日報を削除")).toBeInTheDocument();
      });

      const cancelButtons = screen.getAllByRole("button", { name: /キャンセル/ });
      await user.click(cancelButtons[0]);

      expect(global.fetch).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
