export default function PaymentsLoading() {
  return (
    <div className="p-6 max-w-6xl mx-auto animate-pulse">
      <div className="h-8 bg-muted rounded w-48 mb-2" />
      <div className="h-4 bg-muted rounded w-72 mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-xl" />
        ))}
      </div>
      <div className="h-10 bg-muted rounded w-full mb-4" />
      <div className="h-64 bg-muted rounded-xl w-full" />
    </div>
  );
}