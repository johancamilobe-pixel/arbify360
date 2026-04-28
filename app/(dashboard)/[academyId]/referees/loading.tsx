import { PageHeaderSkeleton, TabsSkeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function RefereesLoading() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeaderSkeleton />
      <TabsSkeleton count={2} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );
}
