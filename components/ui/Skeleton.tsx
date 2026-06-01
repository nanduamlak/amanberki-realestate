import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

/** Reusable pulsing skeleton block for loading states */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse rounded-lg bg-slate-100", className)} />
  );
}

/** Full-page centered spinner */
export function PageSpinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 min-h-[400px] text-slate-400">
      <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-[#0086D1] animate-spin" />
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}

/** Skeleton rows for a data table — pass colCount to match your table */
export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-slate-100">
          {/* First col: avatar + text */}
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </td>
          {/* Middle cols */}
          {Array.from({ length: cols - 2 }).map((_, c) => (
            <td key={c} className="px-6 py-4">
              <Skeleton className="h-6 w-20" />
            </td>
          ))}
          {/* Last col: action buttons */}
          <td className="px-6 py-4">
            <div className="flex justify-end gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

/** Skeleton card grid for dashboard stats */
export function StatCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </>
  );
}
