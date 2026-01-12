/**
 * Confirmation Dialog Hook
 *
 * 確認ダイアログを簡単に使用するためのカスタムフック
 */

"use client";

import { useState } from "react";

export interface UseConfirmationDialogReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * 確認ダイアログの状態管理フック
 *
 * 使用例:
 * ```tsx
 * const deleteDialog = useConfirmationDialog();
 *
 * <Button onClick={deleteDialog.open}>削除</Button>
 * <AlertDialog
 *   open={deleteDialog.isOpen}
 *   onOpenChange={deleteDialog.toggle}
 *   title="削除確認"
 *   description="本当に削除しますか？"
 *   onConfirm={handleDelete}
 *   variant="destructive"
 * />
 * ```
 */
export function useConfirmationDialog(): UseConfirmationDialogReturn {
  const [isOpen, setIsOpen] = useState(false);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  };
}
