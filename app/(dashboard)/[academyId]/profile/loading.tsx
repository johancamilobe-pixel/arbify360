import { PageHeaderSkeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <PageHeaderSkeleton hasButton={false} />
      <div className="bg-card rounded-xl border border-border p-5 animate-pulse">
        <div className="flex gap-3 flex-wrap">
          <div className="h-6 w-20 bg-muted rounded-full" />
          <div className="h-6 w-16 bg-muted rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border/50">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="text-center space-y-1">
              <div className="h-7 bg-muted rounded w-12 mx-auto" />
              <div className="h-3 bg-muted rounded w-16 mx-auto" />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border p-5 animate-pulse space-y-4">
        <div className="h-5 bg-muted rounded w-32" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 bg-muted rounded-lg" />
        ))}
      </div>
    </div>
  );
}
