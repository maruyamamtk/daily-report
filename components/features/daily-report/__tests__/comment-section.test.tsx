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

    it("should handle invalid dates gracefully", () => {
      const commentsWithInvalidDate = [
        {
          ...mockComments[0],
          createdAt: "invalid-date-string",
        },
      ];

      render(
        <CommentSection
          reportId={1}
          comments={commentsWithInvalidDate}
          canComment={false}
          currentUserId={1}
        />
      );

      // Should show "日時不明" for invalid dates
      expect(screen.getByText("日時不明")).toBeInTheDocument();
      // Comment content should still be displayed
      expect(screen.getByText("良い内容ですね！")).toBeInTheDocument();
    });
  });

  describe("コメント削除機能", () => {
    beforeEach(() => {
      // Mock window.confirm
      vi.stubGlobal("confirm", vi.fn());
    });

    it("should show delete button only for own comments", () => {
      const commentsWithDifferentUsers = [
        {
          id: 1,
          commenterId: 2, // Current user's comment
          commentContent: "自分のコメント",
          createdAt: "2026-01-10T10:00:00Z",
          commenter: {
            id: 2,
            name: "Current User",
          },
        },
        {
          id: 2,
          commenterId: 3, // Someone else's comment
          commentContent: "他人のコメント",
          createdAt: "2026-01-11T15:30:00Z",
          commenter: {
            id: 3,
            name: "Other User",
          },
        },
      ];

      render(
        <CommentSection
          reportId={1}
          comments={commentsWithDifferentUsers}
          canComment={false}
          currentUserId={2} // Current user's employeeId
        />
      );

      // Should show delete button for own comment
      const deleteButtons = screen.getAllByLabelText("コメントを削除");
      expect(deleteButtons).toHaveLength(1);

      // The button should be associated with the first comment (own comment)
      const ownCommentContainer = screen.getByText("自分のコメント").closest("div");
      expect(ownCommentContainer?.querySelector("button")).toBeInTheDocument();

      // The second comment should not have a delete button
      const otherCommentContainer = screen.getByText("他人のコメント").closest("div");
      const deleteButtonInOtherComment = otherCommentContainer?.querySelector(
        'button[aria-label="コメントを削除"]'
      );
      expect(deleteButtonInOtherComment).toBeNull();
    });

    it("should not show delete button when user is not comment owner", () => {
      const comments = [
        {
          id: 1,
          commenterId: 3, // Someone else's comment
          commentContent: "他人のコメント",
          createdAt: "2026-01-10T10:00:00Z",
          commenter: {
            id: 3,
            name: "Other User",
          },
        },
      ];

      render(
        <CommentSection
          reportId={1}
          comments={comments}
          canComment={false}
          currentUserId={2} // Current user's employeeId (different from commenter)
        />
      );

      const deleteButtons = screen.queryAllByLabelText("コメントを削除");
      expect(deleteButtons).toHaveLength(0);
    });

    it("should show confirmation dialog before deletion", async () => {
      const user = userEvent.setup();
      const confirmMock = vi.mocked(window.confirm);
      confirmMock.mockReturnValue(false); // User cancels deletion

      const comments = [
        {
          id: 1,
          commenterId: 2,
          commentContent: "削除予定のコメント",
          createdAt: "2026-01-10T10:00:00Z",
          commenter: {
            id: 2,
            name: "Current User",
          },
        },
      ];

      render(
        <CommentSection
          reportId={1}
          comments={comments}
          canComment={false}
          currentUserId={2}
        />
      );

      const deleteButton = screen.getByLabelText("コメントを削除");
      await user.click(deleteButton);

      // Confirm dialog should be shown
      expect(confirmMock).toHaveBeenCalledWith(
        "このコメントを削除してもよろしいですか?"
      );

      // Fetch should not be called if user cancels
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should successfully delete a comment", async () => {
      const user = userEvent.setup();
      const confirmMock = vi.mocked(window.confirm);
      confirmMock.mockReturnValue(true); // User confirms deletion

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const comments = [
        {
          id: 1,
          commenterId: 2,
          commentContent: "削除するコメント",
          createdAt: "2026-01-10T10:00:00Z",
          commenter: {
            id: 2,
            name: "Current User",
          },
        },
      ];

      render(
        <CommentSection
          reportId={1}
          comments={comments}
          canComment={false}
          currentUserId={2}
        />
      );

      const deleteButton = screen.getByLabelText("コメントを削除");
      await user.click(deleteButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/comments/1", {
          method: "DELETE",
        });
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "削除完了",
          description: "コメントを削除しました",
        });
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it("should handle 401 error when deleting comment", async () => {
      const user = userEvent.setup();
      const confirmMock = vi.mocked(window.confirm);
      confirmMock.mockReturnValue(true);

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: { message: "Unauthorized" },
        }),
      });

      const comments = [
        {
          id: 1,
          commenterId: 2,
          commentContent: "削除するコメント",
          createdAt: "2026-01-10T10:00:00Z",
          commenter: {
            id: 2,
            name: "Current User",
          },
        },
      ];

      render(
        <CommentSection
          reportId={1}
          comments={comments}
          canComment={false}
          currentUserId={2}
        />
      );

      const deleteButton = screen.getByLabelText("コメントを削除");
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "削除失敗",
          description: "認証が必要です。再度ログインしてください。",
          variant: "destructive",
        });
      });
    });

    it("should handle 403 error when deleting others' comment", async () => {
      const user = userEvent.setup();
      const confirmMock = vi.mocked(window.confirm);
      confirmMock.mockReturnValue(true);

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: { message: "Forbidden" },
        }),
      });

      const comments = [
        {
          id: 1,
          commenterId: 2,
          commentContent: "削除するコメント",
          createdAt: "2026-01-10T10:00:00Z",
          commenter: {
            id: 2,
            name: "Current User",
          },
        },
      ];

      render(
        <CommentSection
          reportId={1}
          comments={comments}
          canComment={false}
          currentUserId={2}
        />
      );

      const deleteButton = screen.getByLabelText("コメントを削除");
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "削除失敗",
          description: "このコメントを削除する権限がありません。",
          variant: "destructive",
        });
      });
    });

    it("should handle 404 error when comment not found", async () => {
      const user = userEvent.setup();
      const confirmMock = vi.mocked(window.confirm);
      confirmMock.mockReturnValue(true);

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: { message: "Not Found" },
        }),
      });

      const comments = [
        {
          id: 1,
          commenterId: 2,
          commentContent: "削除するコメント",
          createdAt: "2026-01-10T10:00:00Z",
          commenter: {
            id: 2,
            name: "Current User",
          },
        },
      ];

      render(
        <CommentSection
          reportId={1}
          comments={comments}
          canComment={false}
          currentUserId={2}
        />
      );

      const deleteButton = screen.getByLabelText("コメントを削除");
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "削除失敗",
          description: "コメントが見つかりません。",
          variant: "destructive",
        });
      });
    });

    it("should handle generic error during deletion", async () => {
      const user = userEvent.setup();
      const confirmMock = vi.mocked(window.confirm);
      confirmMock.mockReturnValue(true);

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: { message: "Internal Server Error" },
        }),
      });

      const comments = [
        {
          id: 1,
          commenterId: 2,
          commentContent: "削除するコメント",
          createdAt: "2026-01-10T10:00:00Z",
          commenter: {
            id: 2,
            name: "Current User",
          },
        },
      ];

      render(
        <CommentSection
          reportId={1}
          comments={comments}
          canComment={false}
          currentUserId={2}
        />
      );

      const deleteButton = screen.getByLabelText("コメントを削除");
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "削除失敗",
          description: "Internal Server Error",
          variant: "destructive",
        });
      });
    });

    it("should handle network error during deletion", async () => {
      const user = userEvent.setup();
      const confirmMock = vi.mocked(window.confirm);
      confirmMock.mockReturnValue(true);

      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      const comments = [
        {
          id: 1,
          commenterId: 2,
          commentContent: "削除するコメント",
          createdAt: "2026-01-10T10:00:00Z",
          commenter: {
            id: 2,
            name: "Current User",
          },
        },
      ];

      render(
        <CommentSection
          reportId={1}
          comments={comments}
          canComment={false}
          currentUserId={2}
        />
      );

      const deleteButton = screen.getByLabelText("コメントを削除");
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "削除失敗",
          description: "Network error",
          variant: "destructive",
        });
      });
    });

    it("should disable delete button during deletion", async () => {
      const user = userEvent.setup();
      const confirmMock = vi.mocked(window.confirm);
      confirmMock.mockReturnValue(true);

      (global.fetch as any).mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, status: 204 }), 100))
      );

      const comments = [
        {
          id: 1,
          commenterId: 2,
          commentContent: "削除するコメント",
          createdAt: "2026-01-10T10:00:00Z",
          commenter: {
            id: 2,
            name: "Current User",
          },
        },
      ];

      render(
        <CommentSection
          reportId={1}
          comments={comments}
          canComment={false}
          currentUserId={2}
        />
      );

      const deleteButton = screen.getByLabelText("コメントを削除");
      await user.click(deleteButton);

      // Button should be disabled during deletion
      expect(deleteButton).toBeDisabled();
    });

    it("should handle deletion of multiple comments independently", async () => {
      const user = userEvent.setup();
      const confirmMock = vi.mocked(window.confirm);
      confirmMock.mockReturnValue(true);

      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 204,
      });

      const comments = [
        {
          id: 1,
          commenterId: 2,
          commentContent: "コメント1",
          createdAt: "2026-01-10T10:00:00Z",
          commenter: {
            id: 2,
            name: "Current User",
          },
        },
        {
          id: 2,
          commenterId: 2,
          commentContent: "コメント2",
          createdAt: "2026-01-11T10:00:00Z",
          commenter: {
            id: 2,
            name: "Current User",
          },
        },
      ];

      render(
        <CommentSection
          reportId={1}
          comments={comments}
          canComment={false}
          currentUserId={2}
        />
      );

      const deleteButtons = screen.getAllByLabelText("コメントを削除");
      expect(deleteButtons).toHaveLength(2);

      // Click first delete button
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/comments/1", {
          method: "DELETE",
        });
      });
    });
  });
});
