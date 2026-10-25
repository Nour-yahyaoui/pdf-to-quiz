import { Skeleton } from "@/components/ui/skeleton";

export default function QuizLoading() {
  return (
    <main className="container-sheet py-8 sm:py-12" aria-busy="true">
      <Skeleton className="mb-8 h-4 w-36" />

      <header className="mb-10">
        <Skeleton className="mb-3 h-3 w-48" />
        <Skeleton className="h-9 w-72" />
      </header>

      <div className="mx-auto max-w-measure">
        {/* Progress track */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-10" />
          </div>
          <Skeleton className="h-1.5 w-full" />
        </div>

        {/* Question heading */}
        <Skeleton className="h-7 w-full max-w-xl" />
        <Skeleton className="mt-3 h-7 w-2/3 max-w-md" />

        {/* Option rows */}
        <div className="mt-8 overflow-hidden rounded-md border border-rule bg-raised">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-rule-soft px-4 py-4 last:border-b-0 sm:px-5">
              <Skeleton className="size-9 shrink-0" />
              <Skeleton className={`h-4 ${i === 3 ? "w-1/2" : "w-2/3"}`} />
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-12 w-40" />
        </div>
      </div>
    </main>
  );
}
