export function SkeletonCard() {
  return (
    <div className="bg-card rounded-xl border border-border p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-32" />
          <div className="h-3 bg-muted rounded w-20" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-3/4" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="bg-card rounded-xl border border-border p-5 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-muted rounded w-48" />
          <div className="h-3 bg-muted rounded w-32" />
          <div className="h-3 bg-muted rounded w-56" />
        </div>
        <div className="h-6 w-20 bg-muted rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="bg-card rounded-xl border border-border p-5 animate-pulse">
      <div className="h-3 bg-muted rounded w-24 mb-3" />
      <div className="h-8 bg-muted rounded w-32 mb-2" />
      <div className="h-3 bg-muted rounded w-20" />
    </div>
  );
}

export function PageHeaderSkeleton({ hasButton = true }: { hasButton?: boolean }) {
  return (
    <div className="flex items-center justify-between mb-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 bg-muted rounded w-36" />
        <div className="h-4 bg-muted rounded w-48" />
      </div>
      {hasButton && <div className="h-9 w-32 bg-muted rounded-lg" />}
    </div>
  );
}

export function TabsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex gap-2 mb-6 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-8 w-24 bg-muted rounded-lg" />
      ))}
    </div>
  );
}
