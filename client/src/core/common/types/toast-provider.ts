import type { ToastVariant } from "./toast-context";

export type ToastItem = {
  id: number;
  title: string;
  message?: string;
  variant: ToastVariant;
};
