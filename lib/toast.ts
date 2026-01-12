/**
 * Toast Notification Utilities
 *
 * ヘルパー関数: 成功/エラー/警告/情報の通知を簡単に表示
 */

import { toast } from "@/components/ui/use-toast";

/**
 * 成功通知を表示（緑）
 */
export function showSuccessToast(message: string, description?: string) {
  return toast({
    title: message,
    description,
    variant: "default",
    className: "border-green-500 bg-green-50 text-green-900",
  });
}

/**
 * エラー通知を表示（赤）
 */
export function showErrorToast(message: string, description?: string) {
  return toast({
    title: message,
    description,
    variant: "destructive",
  });
}

/**
 * 警告通知を表示（黄）
 */
export function showWarningToast(message: string, description?: string) {
  return toast({
    title: message,
    description,
    variant: "default",
    className: "border-yellow-500 bg-yellow-50 text-yellow-900",
  });
}

/**
 * 情報通知を表示（青）
 */
export function showInfoToast(message: string, description?: string) {
  return toast({
    title: message,
    description,
    variant: "default",
    className: "border-blue-500 bg-blue-50 text-blue-900",
  });
}
