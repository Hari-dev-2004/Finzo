// Re-export from hooks/use-toast and add additional types
export { useToast, toast } from "@/hooks/use-toast";

export type ToastVariant = 'default' | 'destructive' | 'success';

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

// Simple toast utility for notifications
// In a real implementation, this would be more comprehensive

// Create a simple toast utility
export const toast = (options: ToastOptions) => {
  // In a real implementation, this would display a toast notification
  console.log('Toast:', options);
};
