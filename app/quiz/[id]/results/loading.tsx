import { Skeleton } from "@/components/ui/skeleton";

export default function ResultsLoading() {
  return (
    <main className="container-sheet py-8 sm:py-12" aria-busy="true">
      <Skeleton className="mb-8 h-4 w-40" />
      <Skeleton className="h-9 w-64" />
      <Skeleton className="mt-10 h-56 rounded-md" />
      <div className="mt-8 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-md" />
        ))}
      </div>
    </main>
  );
}
