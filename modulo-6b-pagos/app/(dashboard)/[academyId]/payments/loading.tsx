import { Skeleton } from "@/components/ui/skeleton";

export default function PaymentsLoading() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-4 w-72 mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-10 w-full mb-4" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
