import { PageHeaderSkeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <PageHeaderSkeleton hasButton={false} />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-card rounded-xl border border-border p-5 animate-pulse">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-4 h-4 bg-muted rounded" />
            <div className="h-5 bg-muted rounded w-40" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, j) => (
              <div key={j} className="h-10 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
