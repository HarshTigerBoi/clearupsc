import type { LucideIcon } from "lucide-react";

export function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-200" />
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <Icon className="mx-auto h-8 w-8 text-[#f97316]" />
      <p className="mt-4 text-lg font-black text-[#1a2744]">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{body}</p>
    </div>
  );
}

export function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
      <p className="font-black">Something needs attention</p>
      <p className="mt-1">{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="mt-3 min-h-11 rounded-full bg-red-600 px-4 font-black text-white">
          Retry
        </button>
      ) : null}
    </div>
  );
}
