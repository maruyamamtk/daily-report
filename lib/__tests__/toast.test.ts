/**
 * Tests for Toast Utilities
 *
 * Toast通知ヘルパー関数の包括的なテスト
 *
 * @see ../toast.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
} from "../toast";
import * as useToastModule from "@/components/ui/use-toast";

describe("Toast Utilities", () => {
  let toastSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // toast関数をモック
    toastSpy = vi.fn();
    vi.spyOn(useToastModule, "toast").mockImplementation(toastSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("showSuccessToast", () => {
    it("should call toast with success styling", () => {
      showSuccessToast("成功しました");

      expect(toastSpy).toHaveBeenCalledWith({
        title: "成功しました",
        description: undefined,
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
      });
    });

    it("should call toast with message and description", () => {
      showSuccessToast("成功しました", "操作が完了しました");

      expect(toastSpy).toHaveBeenCalledWith({
        title: "成功しました",
        description: "操作が完了しました",
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
      });
    });

    it("should call toast with message only", () => {
      showSuccessToast("保存しました");

      expect(toastSpy).toHaveBeenCalledWith({
        title: "保存しました",
        description: undefined,
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
      });
    });

    it("should return the result from toast", () => {
      const mockReturn = { id: "toast-1", dismiss: vi.fn() };
      toastSpy.mockReturnValue(mockReturn);

      const result = showSuccessToast("成功");

      expect(result).toBe(mockReturn);
    });
  });

  describe("showErrorToast", () => {
    it("should call toast with error styling", () => {
      showErrorToast("エラーが発生しました");

      expect(toastSpy).toHaveBeenCalledWith({
        title: "エラーが発生しました",
        description: undefined,
        variant: "destructive",
      });
    });

    it("should call toast with message and description", () => {
      showErrorToast("削除に失敗しました", "もう一度お試しください");

      expect(toastSpy).toHaveBeenCalledWith({
        title: "削除に失敗しました",
        description: "もう一度お試しください",
        variant: "destructive",
      });
    });

    it("should use destructive variant", () => {
      showErrorToast("エラー");

      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "destructive",
        })
      );
    });

    it("should return the result from toast", () => {
      const mockReturn = { id: "toast-2", dismiss: vi.fn() };
      toastSpy.mockReturnValue(mockReturn);

      const result = showErrorToast("エラー");

      expect(result).toBe(mockReturn);
    });
  });

  describe("showWarningToast", () => {
    it("should call toast with warning styling", () => {
      showWarningToast("警告");

      expect(toastSpy).toHaveBeenCalledWith({
        title: "警告",
        description: undefined,
        variant: "default",
        className: "border-yellow-500 bg-yellow-50 text-yellow-900",
      });
    });

    it("should call toast with message and description", () => {
      showWarningToast("注意が必要です", "この操作は取り消せません");

      expect(toastSpy).toHaveBeenCalledWith({
        title: "注意が必要です",
        description: "この操作は取り消せません",
        variant: "default",
        className: "border-yellow-500 bg-yellow-50 text-yellow-900",
      });
    });

    it("should apply correct yellow color classes", () => {
      showWarningToast("警告");

      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          className: "border-yellow-500 bg-yellow-50 text-yellow-900",
        })
      );
    });

    it("should return the result from toast", () => {
      const mockReturn = { id: "toast-3", dismiss: vi.fn() };
      toastSpy.mockReturnValue(mockReturn);

      const result = showWarningToast("警告");

      expect(result).toBe(mockReturn);
    });
  });

  describe("showInfoToast", () => {
    it("should call toast with info styling", () => {
      showInfoToast("情報");

      expect(toastSpy).toHaveBeenCalledWith({
        title: "情報",
        description: undefined,
        variant: "default",
        className: "border-blue-500 bg-blue-50 text-blue-900",
      });
    });

    it("should call toast with message and description", () => {
      showInfoToast("お知らせ", "新機能が追加されました");

      expect(toastSpy).toHaveBeenCalledWith({
        title: "お知らせ",
        description: "新機能が追加されました",
        variant: "default",
        className: "border-blue-500 bg-blue-50 text-blue-900",
      });
    });

    it("should apply correct blue color classes", () => {
      showInfoToast("情報");

      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          className: "border-blue-500 bg-blue-50 text-blue-900",
        })
      );
    });

    it("should return the result from toast", () => {
      const mockReturn = { id: "toast-4", dismiss: vi.fn() };
      toastSpy.mockReturnValue(mockReturn);

      const result = showInfoToast("情報");

      expect(result).toBe(mockReturn);
    });
  });

  describe("関数呼び出し回数", () => {
    it("should call toast exactly once per function call", () => {
      showSuccessToast("成功");
      expect(toastSpy).toHaveBeenCalledTimes(1);

      showErrorToast("エラー");
      expect(toastSpy).toHaveBeenCalledTimes(2);

      showWarningToast("警告");
      expect(toastSpy).toHaveBeenCalledTimes(3);

      showInfoToast("情報");
      expect(toastSpy).toHaveBeenCalledTimes(4);
    });
  });

  describe("エッジケース", () => {
    it("should handle empty message", () => {
      showSuccessToast("");

      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "",
        })
      );
    });

    it("should handle empty description", () => {
      showErrorToast("エラー", "");

      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "",
        })
      );
    });

    it("should handle very long message", () => {
      const longMessage = "あ".repeat(1000);
      showSuccessToast(longMessage);

      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: longMessage,
        })
      );
    });

    it("should handle special characters", () => {
      showSuccessToast("<script>alert('xss')</script>");

      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "<script>alert('xss')</script>",
        })
      );
    });

    it("should handle unicode characters", () => {
      showSuccessToast("🎉 成功しました！ 🎊");

      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "🎉 成功しました！ 🎊",
        })
      );
    });

    it("should handle null-like values gracefully", () => {
      // TypeScriptの型チェックにより、実際にはnullやundefinedは渡せないが、
      // JavaScriptレベルでの動作を確認
      showSuccessToast(undefined as any);

      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: undefined,
        })
      );
    });
  });

  describe("variantの一貫性", () => {
    it("should use default variant for success, warning, and info", () => {
      showSuccessToast("成功");
      expect(toastSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({ variant: "default" })
      );

      showWarningToast("警告");
      expect(toastSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({ variant: "default" })
      );

      showInfoToast("情報");
      expect(toastSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({ variant: "default" })
      );
    });

    it("should use destructive variant only for error", () => {
      showErrorToast("エラー");
      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "destructive" })
      );
    });
  });

  describe("classNameの適用", () => {
    it("should apply green classes for success", () => {
      showSuccessToast("成功");
      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          className: expect.stringContaining("green"),
        })
      );
    });

    it("should apply yellow classes for warning", () => {
      showWarningToast("警告");
      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          className: expect.stringContaining("yellow"),
        })
      );
    });

    it("should apply blue classes for info", () => {
      showInfoToast("情報");
      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          className: expect.stringContaining("blue"),
        })
      );
    });

    it("should not apply className for error (uses destructive variant)", () => {
      showErrorToast("エラー");
      expect(toastSpy).toHaveBeenCalledWith(
        expect.not.objectContaining({
          className: expect.anything(),
        })
      );
    });
  });

  describe("実用例", () => {
    it("should work in a typical success scenario", () => {
      // ユーザーが保存ボタンをクリックした後
      const handleSave = () => {
        // API呼び出し成功
        showSuccessToast("保存しました", "データが正常に保存されました");
      };

      handleSave();

      expect(toastSpy).toHaveBeenCalledWith({
        title: "保存しました",
        description: "データが正常に保存されました",
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
      });
    });

    it("should work in a typical error scenario", () => {
      // ユーザーが削除ボタンをクリックしたがエラーが発生
      const handleDelete = () => {
        // API呼び出し失敗
        showErrorToast("削除に失敗しました", "ネットワークエラーが発生しました");
      };

      handleDelete();

      expect(toastSpy).toHaveBeenCalledWith({
        title: "削除に失敗しました",
        description: "ネットワークエラーが発生しました",
        variant: "destructive",
      });
    });

    it("should work in a warning scenario", () => {
      // ユーザーが古いデータを使用している
      const checkDataFreshness = () => {
        showWarningToast("データが古い可能性があります", "更新してください");
      };

      checkDataFreshness();

      expect(toastSpy).toHaveBeenCalledWith({
        title: "データが古い可能性があります",
        description: "更新してください",
        variant: "default",
        className: "border-yellow-500 bg-yellow-50 text-yellow-900",
      });
    });

    it("should work in an info scenario", () => {
      // 新機能のお知らせ
      const showNewFeature = () => {
        showInfoToast("新機能", "ダークモードが利用可能になりました");
      };

      showNewFeature();

      expect(toastSpy).toHaveBeenCalledWith({
        title: "新機能",
        description: "ダークモードが利用可能になりました",
        variant: "default",
        className: "border-blue-500 bg-blue-50 text-blue-900",
      });
    });
  });
});
