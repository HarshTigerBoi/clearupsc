import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow: string;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl bg-[#1a2744] p-6 text-white sm:p-8", className)}>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-orange-300 sm:text-sm sm:tracking-[0.16em]">{eyebrow}</p>
      <h1 className="mt-3 break-words text-3xl font-black tracking-tight sm:text-5xl">{title}</h1>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-200 sm:text-base">{description}</p>
    </div>
  );
}
