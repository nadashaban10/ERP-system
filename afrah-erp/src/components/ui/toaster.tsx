"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitive.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitive.Viewport.displayName;

type ToastVariant = "default" | "success" | "destructive" | "info";

interface ToastProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> {
  variant?: ToastVariant;
}

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  ToastProps
>(({ className, variant = "default", ...props }, ref) => {
  return (
    <ToastPrimitive.Root
      ref={ref}
      className={cn(
        "group pointer-events-auto relative flex w-full items-center justify-between space-x-3 overflow-hidden rounded-xl border p-4 shadow-lg transition-all",
        "data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out",
        "data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full",
        "data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
        variant === "default" && "border-border bg-background text-foreground",
        variant === "success" && "border-emerald-200 bg-emerald-50 text-emerald-900",
        variant === "destructive" && "border-red-200 bg-red-50 text-red-900",
        variant === "info" && "border-blue-200 bg-blue-50 text-blue-900",
        className
      )}
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitive.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-transparent bg-secondary px-3 text-sm font-medium transition-colors",
      "hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
      "disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitive.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity",
      "hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring",
      "group-hover:opacity-100",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitive.Close>
));
ToastClose.displayName = ToastPrimitive.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitive.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitive.Description.displayName;

// Simple toast hook state management
type ToastState = {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  open: boolean;
};

const toastListeners: Array<(toasts: ToastState[]) => void> = [];
let toastList: ToastState[] = [];

function emitChange() {
  for (const listener of toastListeners) listener(toastList);
}

export function toast(props: Omit<ToastState, "id" | "open">) {
  const id = Math.random().toString(36).slice(2);
  toastList = [...toastList, { ...props, id, open: true }];
  emitChange();
  setTimeout(() => {
    toastList = toastList.map((t) =>
      t.id === id ? { ...t, open: false } : t
    );
    emitChange();
    setTimeout(() => {
      toastList = toastList.filter((t) => t.id !== id);
      emitChange();
    }, 300);
  }, 4000);
}

export function Toaster() {
  const [toasts, setToasts] = React.useState<ToastState[]>([]);

  React.useEffect(() => {
    toastListeners.push(setToasts);
    return () => {
      const idx = toastListeners.indexOf(setToasts);
      if (idx > -1) toastListeners.splice(idx, 1);
    };
  }, []);

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, variant, open }) => (
        <Toast key={id} variant={variant} open={open}>
          <div className="flex items-start gap-2">
            {variant === "success" && (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            )}
            {variant === "destructive" && (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            )}
            {variant === "info" && (
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            )}
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
