import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

export function Progress({ value, className }: { value: number; className?: string }) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <ProgressPrimitive.Root className={cn("relative h-2 w-full overflow-hidden rounded-full bg-slate-200", className)}>
      <ProgressPrimitive.Indicator
        className="h-full rounded-full bg-[#f97316] transition-transform"
        style={{ transform: `translateX(-${100 - safeValue}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}
