import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "outline" | "ghost" | "secondary";

export function Button({
  className,
  variant = "default",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  const variants: Record<ButtonVariant, string> = {
    default: "bg-[#f97316] text-white hover:bg-[#ea580c]",
    outline: "border border-slate-300 bg-white text-[#1a2744] hover:bg-slate-50",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
    secondary: "bg-[#1a2744] text-white hover:bg-[#24385f]",
  };

  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
