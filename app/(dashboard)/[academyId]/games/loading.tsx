import { PageHeaderSkeleton, TabsSkeleton, SkeletonRow } from "@/components/ui/skeleton";

export default function GamesLoading() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeaderSkeleton />
      <TabsSkeleton count={5} />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    </div>
  );
}
