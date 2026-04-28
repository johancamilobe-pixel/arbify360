import { PageHeaderSkeleton, SkeletonStat } from "@/components/ui/skeleton";

export default function ReportsLoading() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeaderSkeleton hasButton={false} />
      <div className="animate-pulse mb-6">
        <div className="h-10 w-48 bg-muted rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => <SkeletonStat key={i} />)}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-5 animate-pulse">
            <div className="h-4 bg-muted rounded w-40 mb-2" />
            <div className="h-3 bg-muted rounded w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
