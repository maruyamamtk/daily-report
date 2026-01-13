/**
 * Tests for CommentSection Component
 *
 * コメントセクションコンポーネントの包括的なテスト
 *
 * @see ../comment-section.tsx
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommentSection } from "../comment-section";

// Mock next/navigation
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
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

const mockComments = [
  {
    id: 1,
    commenterId: 2,
    commentContent: "良い内容ですね！",
    createdAt: "2026-01-10T10:00:00Z",
    commenter: {
      id: 2,
      name: "山田太郎",
    },
  },
  {
    id: 2,
    commenterId: 3,
    commentContent: "次回はもっと詳しく書いてください。",
    createdAt: "2026-01-11T15:30:00Z",
    commenter: {
      id: 3,
      name: "佐藤花子",
    },
  },
];

describe("CommentSection Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("基本的なレンダリング", () => {
    it("should render existing comments", () => {
      render(
        <CommentSection
          reportId={1}
          comments={mockComments}
          canComment={false}
          currentUserId={1}
        />
      );

      expect(screen.getByText("良い内容ですね！")).toBeInTheDocument();
      expect(screen.getByText("次回はもっと詳しく書いてください。")).toBeInTheDocument();
      expect(screen.getByText("山田太郎")).toBeInTheDocument();
      expect(screen.getByText("佐藤花子")).toBeInTheDocument();
    });

    it("should render empty state when no comments", () => {
      render(
        <CommentSection
          reportId={1}
          comments={[]}
          canComment={false}
          currentUserId={1}
        />
      );

      expect(screen.getByText("コメントはまだありません")).toBeInTheDocument();
    });

    it("should render comment form when canComment is true", () => {
      render(
        <CommentSection
          reportId={1}
          comments={[]}
          canComment={true}
          currentUserId={1}
        />
      );

      expect(screen.getByLabelText("コメントを投稿")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /コメントを投稿/ })).toBeInTheDocument();
    });

    it("should not render comment form when canComment is false", () => {
      render(
        <CommentSection
          reportId={1}
          comments={mockComments}
          canComment={false}
          currentUserId={1}
        />
      );

      expect(screen.queryByLabelText("コメントを投稿")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /コメントを投稿/ })).not.toBeInTheDocument();
    });
  });

  describe("コメント投稿機能", () => {
    it("should successfully post a comment", async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          comment_id: 3,
          comment_content: "新しいコメント",
        }),
      });

      render(
        <CommentSection
          reportId={1}
          comments={[]}
          canComment={true}
          currentUserId={1}
        />
      );

      const textarea = screen.getByLabelText("コメントを投稿");
      const submitButton = screen.getByRole("button", { name: /コメントを投稿/ });

      await user.type(textarea, "新しいコメント");
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/daily-reports/1/comments",
          expect.objectContaining({
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              comment_content: "新しいコメント",
            }),
          })
        );
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "投稿完了",
          description: "コメントを投稿しました",
        });
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it("should show error when comment is empty", async () => {
      const user = userEvent.setup();

      render(
        <CommentSection
          reportId={1}
          comments={[]}
          canComment={true}
          currentUserId={1}
        />
      );

      const submitButton = screen.getByRole("button", { name: /コメントを投稿/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "入力エラー",
          description: "コメント内容を入力してください",
          variant: "destructive",
        });
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should show error when comment exceeds max length", async () => {
      const user = userEvent.setup();

      render(
        <CommentSection
          reportId={1}
          comments={[]}
          canComment={true}
          currentUserId={1}
        />
      );

      const textarea = screen.getByLabelText("コメントを投稿");
      const longComment = "あ".repeat(501);

      await user.type(textarea, longComment);
      const submitButton = screen.getByRole("button", { name: /コメントを投稿/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "入力エラー",
          description: "コメントは500文字以内で入力してください",
          variant: "destructive",
        });
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should clear textarea after successful submission", async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ comment_id: 3 }),
      });

      render(
        <CommentSection
          reportId={1}
          comments={[]}
          canComment={true}
          currentUserId={1}
        />
      );

      const textarea = screen.getByLabelText("コメントを投稿") as HTMLTextAreaElement;
      await user.type(textarea, "テストコメント");

      const submitButton = screen.getByRole("button", { name: /コメントを投稿/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(textarea.value).toBe("");
      });
    });
  });

  describe("エラーハンドリング", () => {
    it("should handle 401 Unauthorized error", async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: { message: "Unauthorized" },
        }),
      });

      render(
        <CommentSection
          reportId={1}
          comments={[]}
          canComment={true}
          currentUserId={1}
        />
      );

      const textarea = screen.getByLabelText("コメントを投稿");
      await user.type(textarea, "テストコメント");

      const submitButton = screen.getByRole("button", { name: /コメントを投稿/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "投稿失敗",
          description: "認証が必要です。再度ログインしてください。",
          variant: "destructive",
        });
      });
    });

    it("should handle 403 Forbidden error", async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: { message: "Forbidden" },
        }),
      });

      render(
        <CommentSection
          reportId={1}
          comments={[]}
          canComment={true}
          currentUserId={1}
        />
      );

      const textarea = screen.getByLabelText("コメントを投稿");
      await user.type(textarea, "テストコメント");

      const submitButton = screen.getByRole("button", { name: /コメントを投稿/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "投稿失敗",
          description: "コメントを投稿する権限がありません。",
          variant: "destructive",
        });
      });
    });

    it("should handle 404 Not Found error", async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: { message: "Not Found" },
        }),
      });

      render(
        <CommentSection
          reportId={1}
          comments={[]}
          canComment={true}
          currentUserId={1}
        />
      );

      const textarea = screen.getByLabelText("コメントを投稿");
      await user.type(textarea, "テストコメント");

      const submitButton = screen.getByRole("button", { name: /コメントを投稿/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "投稿失敗",
          description: "日報が見つかりません。",
          variant: "destructive",
        });
      });
    });

    it("should handle generic error", async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: { message: "サーバーエラー" },
        }),
      });

      render(
        <CommentSection
          reportId={1}
          comments={[]}
          canComment={true}
          currentUserId={1}
        />
      );

      const textarea = screen.getByLabelText("コメントを投稿");
      await user.type(textarea, "テストコメント");

      const submitButton = screen.getByRole("button", { name: /コメントを投稿/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "投稿失敗",
          description: "サーバーエラー",
          variant: "destructive",
        });
      });
    });

    it("should handle network error", async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      render(
        <CommentSection
          reportId={1}
          comments={[]}
          canComment={true}
          currentUserId={1}
        />
      );

      const textarea = screen.getByLabelText("コメントを投稿");
      await user.type(textarea, "テストコメント");

      const submitButton = screen.getByRole("button", { name: /コメントを投稿/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "投稿失敗",
          description: "Network error",
          variant: "destructive",
        });
      });
    });
  });

  describe("UI状態", () => {
    it("should disable submit button when comment is empty", () => {
      render(
        <CommentSection
          reportId={1}
          comments={[]}
          canComment={true}
          currentUserId={1}
        />
      );

      const submitButton = screen.getByRole("button", { name: /コメントを投稿/ });
      expect(submitButton).toBeDisabled();
    });

    it("should enable submit button when comment has content", async () => {
      const user = userEvent.setup();

      render(
        <CommentSection
          reportId={1}
          comments={[]}
          canComment={true}
          currentUserId={1}
        />
      );

      const textarea = screen.getByLabelText("コメントを投稿");
      await user.type(textarea, "テスト");

      const submitButton = screen.getByRole("button", { name: /コメントを投稿/ });
      expect(submitButton).not.toBeDisabled();
    });

    it("should disable form during submission", async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100))
      );

      render(
        <CommentSection
          reportId={1}
          comments={[]}
          canComment={true}
          currentUserId={1}
        />
      );

      const textarea = screen.getByLabelText("コメントを投稿");
      await user.type(textarea, "テストコメント");

      const submitButton = screen.getByRole("button", { name: /コメントを投稿/ });
      await user.click(submitButton);

      // 投稿中はテキストが変わる
      expect(screen.getByRole("button", { name: /投稿中/ })).toBeInTheDocument();
      expect(textarea).toBeDisabled();
    });

    it("should show character count", async () => {
      const user = userEvent.setup();

      render(
        <CommentSection
          reportId={1}
          comments={[]}
          canComment={true}
          currentUserId={1}
        />
      );

      expect(screen.getByText("0 / 500文字")).toBeInTheDocument();

      const textarea = screen.getByLabelText("コメントを投稿");
      await user.type(textarea, "テスト");

      expect(screen.getByText("4 / 500文字")).toBeInTheDocument();
    });
  });

  describe("アクセシビリティ", () => {
    it("should have proper ARIA labels", () => {
      render(
        <CommentSection
          reportId={1}
          comments={[]}
          canComment={true}
          currentUserId={1}
        />
      );

      const textarea = screen.getByLabelText("コメントを投稿");
      expect(textarea).toHaveAttribute("aria-describedby", "comment-char-count");
    });

    it("should associate label with textarea", () => {
      render(
        <CommentSection
          reportId={1}
          comments={[]}
          canComment={true}
          currentUserId={1}
        />
      );

      const label = screen.getByText("コメントを投稿");
      const textarea = screen.getByLabelText("コメントを投稿");

      expect(label).toBeInTheDocument();
      expect(textarea).toBeInTheDocument();
    });
  });

  describe("日付フォーマット", () => {
    it("should format dates correctly", () => {
      render(
        <CommentSection
          reportId={1}
          comments={mockComments}
          canComment={false}
          currentUserId={1}
        />
      );

      // 日本のロケールで日付が表示されることを確認
      const dateElements = screen.getAllByText(/2026/);
      expect(dateElements.length).toBeGreaterThan(0);
    });

    it("should handle string dates", () => {
      const commentsWithStringDates = [
        {
          ...mockComments[0],
          createdAt: "2026-01-10T10:00:00Z",
        },
      ];

      render(
        <CommentSection
          reportId={1}
          comments={commentsWithStringDates}
          canComment={false}
          currentUserId={1}
        />
      );

      expect(screen.getByText("良い内容ですね！")).toBeInTheDocument();
    });

    it("should handle Date objects", () => {
      const commentsWithDateObjects = [
        {
          ...mockComments[0],
          createdAt: new Date("2026-01-10T10:00:00Z"),
        },
      ];

      render(
        <CommentSection
          reportId={1}
          comments={commentsWithDateObjects}
          canComment={false}
          currentUserId={1}
        />
      );

      expect(screen.getByText("良い内容ですね！")).toBeInTheDocument();
    });
  });
});
