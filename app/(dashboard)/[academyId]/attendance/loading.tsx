import { PageHeaderSkeleton, SkeletonRow } from "@/components/ui/skeleton";

export default function AttendanceLoading() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <PageHeaderSkeleton hasButton={false} />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    </div>
  );
}
