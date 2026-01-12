/**
 * Notifications Module
 *
 * トースト通知とダイアログの統合エクスポート
 */

// Toast notifications
export {
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
} from "./toast";

// Toast hook
export { useToast } from "@/components/ui/use-toast";

// Dialog components
export { AlertDialog } from "@/components/ui/alert-dialog";
export type { AlertDialogProps } from "@/components/ui/alert-dialog";
export { FormDialog } from "@/components/ui/form-dialog";
export type { FormDialogProps } from "@/components/ui/form-dialog";

// Dialog hooks
export { useConfirmationDialog } from "@/hooks/use-confirmation-dialog";
export type { UseConfirmationDialogReturn } from "@/hooks/use-confirmation-dialog";
