"use client";

import * as React from "react";
import { AlertCircle, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * エラーの種類
 */
export type ErrorType = "error" | "warning" | "info";

/**
 * エラーメッセージのプロパティ
 */
export interface FormErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * エラーメッセージ
   */
  message?: string;
  /**
   * エラーの種類
   */
  type?: ErrorType;
  /**
   * アイコンを表示するかどうか
   */
  showIcon?: boolean;
  /**
   * クラス名
   */
  className?: string;
}

/**
 * エラーアイコンを取得
 */
const getErrorIcon = (type: ErrorType) => {
  switch (type) {
    case "error":
      return <XCircle className="h-4 w-4" />;
    case "warning":
      return <AlertCircle className="h-4 w-4" />;
    case "info":
      return <Info className="h-4 w-4" />;
  }
};

/**
 * エラースタイルを取得
 */
const getErrorStyles = (type: ErrorType) => {
  switch (type) {
    case "error":
      return "text-destructive";
    case "warning":
      return "text-yellow-600 dark:text-yellow-500";
    case "info":
      return "text-blue-600 dark:text-blue-500";
  }
};

/**
 * フォームエラーメッセージコンポーネント
 *
 * エラーメッセージを視覚的に分かりやすく表示するコンポーネント
 */
export const FormError = React.forwardRef<HTMLDivElement, FormErrorProps>(
  (
    { message, type = "error", showIcon = true, className, ...props },
    ref
  ) => {
    if (!message) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-start gap-2 text-sm font-medium",
          getErrorStyles(type),
          className
        )}
        role="alert"
        {...props}
      >
        {showIcon && (
          <span className="mt-0.5 flex-shrink-0">{getErrorIcon(type)}</span>
        )}
        <span>{message}</span>
      </div>
    );
  }
);
FormError.displayName = "FormError";

/**
 * フォームエラーリストのプロパティ
 */
export interface FormErrorListProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * エラーメッセージのリスト
   */
  errors: string[];
  /**
   * エラーの種類
   */
  type?: ErrorType;
  /**
   * アイコンを表示するかどうか
   */
  showIcon?: boolean;
  /**
   * タイトル
   */
  title?: string;
  /**
   * クラス名
   */
  className?: string;
}

/**
 * フォームエラーリストコンポーネント
 *
 * 複数のエラーメッセージをリスト形式で表示するコンポーネント
 */
export const FormErrorList = React.forwardRef<
  HTMLDivElement,
  FormErrorListProps
>(
  (
    {
      errors,
      type = "error",
      showIcon = true,
      title,
      className,
      ...props
    },
    ref
  ) => {
    if (!errors || errors.length === 0) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-md border p-4",
          type === "error" &&
            "border-destructive/50 bg-destructive/10 text-destructive",
          type === "warning" &&
            "border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500",
          type === "info" &&
            "border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-500",
          className
        )}
        role="alert"
        {...props}
      >
        {title && (
          <div className="mb-2 flex items-center gap-2 font-semibold">
            {showIcon && getErrorIcon(type)}
            <span>{title}</span>
          </div>
        )}
        <ul className={cn("space-y-1", title ? "ml-6" : "ml-0")}>
          {errors.map((error, index) => (
            <li key={index} className="text-sm">
              {error}
            </li>
          ))}
        </ul>
      </div>
    );
  }
);
FormErrorList.displayName = "FormErrorList";

/**
 * フォーム送信エラーのプロパティ
 */
export interface FormSubmitErrorProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * エラーメッセージ
   */
  error?: string | null;
  /**
   * クラス名
   */
  className?: string;
}

/**
 * フォーム送信エラーコンポーネント
 *
 * フォーム送信時のエラーを表示するコンポーネント
 */
export const FormSubmitError = React.forwardRef<
  HTMLDivElement,
  FormSubmitErrorProps
>(({ error, className, ...props }, ref) => {
  if (!error) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-md border border-destructive/50 bg-destructive/10 p-4",
        className
      )}
      role="alert"
      {...props}
    >
      <div className="flex items-start gap-2">
        <XCircle className="h-5 w-5 flex-shrink-0 text-destructive" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-destructive">
            エラーが発生しました
          </h3>
          <p className="mt-1 text-sm text-destructive/90">{error}</p>
        </div>
      </div>
    </div>
  );
});
FormSubmitError.displayName = "FormSubmitError";
