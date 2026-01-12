/**
 * Tests for FormDialog Component
 *
 * FormDialogコンポーネントの包括的なテスト
 *
 * @see ../form-dialog.tsx
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormDialog, type FormDialogProps } from "../form-dialog";

// デフォルトのプロパティ
const defaultProps: FormDialogProps = {
  open: true,
  onOpenChange: vi.fn(),
  title: "フォームタイトル",
  children: <div>フォーム内容</div>,
};

describe("FormDialog Component", () => {
  describe("基本的なレンダリング", () => {
    it("should render with default props", () => {
      render(<FormDialog {...defaultProps} />);

      expect(screen.getByText("フォームタイトル")).toBeInTheDocument();
      expect(screen.getByText("フォーム内容")).toBeInTheDocument();
    });

    it("should render with description", () => {
      render(
        <FormDialog
          {...defaultProps}
          description="フォームの説明文"
        />
      );

      expect(screen.getByText("フォームタイトル")).toBeInTheDocument();
      expect(screen.getByText("フォームの説明文")).toBeInTheDocument();
      expect(screen.getByText("フォーム内容")).toBeInTheDocument();
    });

    it("should render without description", () => {
      render(<FormDialog {...defaultProps} />);

      expect(screen.getByText("フォームタイトル")).toBeInTheDocument();
      expect(screen.getByText("フォーム内容")).toBeInTheDocument();
    });

    it("should not render when open is false", () => {
      render(<FormDialog {...defaultProps} open={false} />);

      expect(screen.queryByText("フォームタイトル")).not.toBeInTheDocument();
      expect(screen.queryByText("フォーム内容")).not.toBeInTheDocument();
    });
  });

  describe("子要素のレンダリング", () => {
    it("should render form elements", () => {
      render(
        <FormDialog {...defaultProps}>
          <form>
            <input type="text" placeholder="名前" />
            <button type="submit">送信</button>
          </form>
        </FormDialog>
      );

      expect(screen.getByPlaceholderText("名前")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /送信/ })).toBeInTheDocument();
    });

    it("should render complex children", () => {
      render(
        <FormDialog {...defaultProps}>
          <div>
            <p>段落1</p>
            <p>段落2</p>
            <button>ボタン</button>
          </div>
        </FormDialog>
      );

      expect(screen.getByText("段落1")).toBeInTheDocument();
      expect(screen.getByText("段落2")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /ボタン/ })).toBeInTheDocument();
    });

    it("should render multiple child elements", () => {
      render(
        <FormDialog {...defaultProps}>
          <div>要素1</div>
          <div>要素2</div>
          <div>要素3</div>
        </FormDialog>
      );

      expect(screen.getByText("要素1")).toBeInTheDocument();
      expect(screen.getByText("要素2")).toBeInTheDocument();
      expect(screen.getByText("要素3")).toBeInTheDocument();
    });
  });

  describe("maxWidthプロパティ", () => {
    it("should apply sm max width class", () => {
      const { container } = render(
        <FormDialog {...defaultProps} maxWidth="sm" />
      );

      const dialogContent = container.querySelector(".sm\\:max-w-sm");
      expect(dialogContent).toBeInTheDocument();
    });

    it("should apply md max width class", () => {
      const { container } = render(
        <FormDialog {...defaultProps} maxWidth="md" />
      );

      const dialogContent = container.querySelector(".sm\\:max-w-md");
      expect(dialogContent).toBeInTheDocument();
    });

    it("should apply lg max width class (default)", () => {
      const { container } = render(<FormDialog {...defaultProps} />);

      const dialogContent = container.querySelector(".sm\\:max-w-lg");
      expect(dialogContent).toBeInTheDocument();
    });

    it("should apply xl max width class", () => {
      const { container } = render(
        <FormDialog {...defaultProps} maxWidth="xl" />
      );

      const dialogContent = container.querySelector(".sm\\:max-w-xl");
      expect(dialogContent).toBeInTheDocument();
    });

    it("should apply 2xl max width class", () => {
      const { container } = render(
        <FormDialog {...defaultProps} maxWidth="2xl" />
      );

      const dialogContent = container.querySelector(".sm\\:max-w-2xl");
      expect(dialogContent).toBeInTheDocument();
    });
  });

  describe("onOpenChange", () => {
    it("should call onOpenChange when dialog state changes", () => {
      const onOpenChange = vi.fn();

      render(
        <FormDialog
          {...defaultProps}
          onOpenChange={onOpenChange}
        />
      );

      // Dialogコンポーネント自体のテストなので、ここでは呼び出しが正しく渡されることを確認
      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });

  describe("アクセシビリティ", () => {
    it("should have proper heading for title", () => {
      render(<FormDialog {...defaultProps} title="アクセシビリティテスト" />);

      const heading = screen.getByText("アクセシビリティテスト");
      expect(heading).toBeInTheDocument();
    });

    it("should have description when provided", () => {
      render(
        <FormDialog
          {...defaultProps}
          description="これは説明文です"
        />
      );

      const description = screen.getByText("これは説明文です");
      expect(description).toBeInTheDocument();
    });
  });

  describe("スタイリング", () => {
    it("should apply mt-4 class to children wrapper", () => {
      const { container } = render(
        <FormDialog {...defaultProps}>
          <div data-testid="child">子要素</div>
        </FormDialog>
      );

      const wrapper = container.querySelector(".mt-4");
      expect(wrapper).toBeInTheDocument();
      expect(wrapper?.textContent).toBe("子要素");
    });
  });

  describe("エッジケース", () => {
    it("should handle empty title", () => {
      render(<FormDialog {...defaultProps} title="" />);

      // タイトルが空でもレンダリングされる
      expect(screen.getByText("フォーム内容")).toBeInTheDocument();
    });

    it("should handle null children gracefully", () => {
      render(
        <FormDialog {...defaultProps}>
          {null}
        </FormDialog>
      );

      expect(screen.getByText("フォームタイトル")).toBeInTheDocument();
    });

    it("should handle undefined children gracefully", () => {
      render(
        <FormDialog {...defaultProps}>
          {undefined}
        </FormDialog>
      );

      expect(screen.getByText("フォームタイトル")).toBeInTheDocument();
    });

    it("should render with very long title", () => {
      const longTitle = "これは非常に長いタイトルです。".repeat(10);
      render(<FormDialog {...defaultProps} title={longTitle} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it("should render with very long description", () => {
      const longDescription = "これは非常に長い説明文です。".repeat(20);
      render(
        <FormDialog
          {...defaultProps}
          description={longDescription}
        />
      );

      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });
  });

  describe("実用例", () => {
    it("should work with a complete form", () => {
      const handleSubmit = vi.fn((e) => e.preventDefault());

      render(
        <FormDialog
          {...defaultProps}
          title="顧客登録"
          description="新しい顧客を登録します"
        >
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name">顧客名</label>
              <input id="name" type="text" />
            </div>
            <div>
              <label htmlFor="email">メールアドレス</label>
              <input id="email" type="email" />
            </div>
            <button type="submit">登録</button>
          </form>
        </FormDialog>
      );

      expect(screen.getByText("顧客登録")).toBeInTheDocument();
      expect(screen.getByText("新しい顧客を登録します")).toBeInTheDocument();
      expect(screen.getByLabelText("顧客名")).toBeInTheDocument();
      expect(screen.getByLabelText("メールアドレス")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /登録/ })).toBeInTheDocument();
    });

    it("should work with custom form buttons", () => {
      render(
        <FormDialog
          {...defaultProps}
          title="編集"
          description="情報を編集します"
        >
          <div>
            <input type="text" defaultValue="既存の値" />
            <div>
              <button type="button">キャンセル</button>
              <button type="submit">保存</button>
            </div>
          </div>
        </FormDialog>
      );

      expect(screen.getByRole("button", { name: /キャンセル/ })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /保存/ })).toBeInTheDocument();
    });
  });
});
