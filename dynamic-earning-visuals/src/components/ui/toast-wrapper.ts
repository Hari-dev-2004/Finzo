// Re-export from hooks/use-toast and add additional types
export { useToast, toast } from "@/hooks/use-toast";

export type ToastVariant = 'default' | 'destructive' | 'success';

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
} 