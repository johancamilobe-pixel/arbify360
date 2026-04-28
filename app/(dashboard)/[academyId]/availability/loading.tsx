import { PageHeaderSkeleton } from "@/components/ui/skeleton";

export default function AvailabilityLoading() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeaderSkeleton hasButton={false} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-5 animate-pulse">
            <div className="h-5 bg-muted rounded w-32 mb-4" />
            <div className="grid grid-cols-7 gap-1 mb-4">
              {Array.from({ length: 35 }).map((_, j) => (
                <div key={j} className="h-8 bg-muted rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
