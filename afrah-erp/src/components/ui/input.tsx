import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm",
          "shadow-[0_1px_2px_oklch(0_0_0/0.06)] transition-all duration-200",
          "placeholder:text-muted-foreground/60",
          "focus-visible:outline-none focus-visible:border-ring",
          "focus-visible:ring-[3px] focus-visible:ring-ring/20",
          "focus-visible:shadow-[0_0_0_3px_oklch(0.50_0.22_264/0.12),_0_1px_2px_oklch(0_0_0/0.06)]",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
