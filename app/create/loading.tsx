import { Skeleton } from "@/components/ui/skeleton";

export default function CreateLoading() {
  return (
    <main className="container-sheet py-10 sm:py-14" aria-busy="true">
      <header className="mb-10 max-w-measure">
        <Skeleton className="mb-3 h-3 w-28" />
        <Skeleton className="h-10 w-80 max-w-full" />
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-full max-w-xl" />
          <Skeleton className="h-4 w-2/3 max-w-md" />
        </div>
      </header>

      <div className="space-y-10">
        {/* Upload zone footprint */}
        <section>
          <Skeleton className="mb-3 h-3 w-44" />
          <div className="flex flex-col items-center rounded-md border-2 border-dashed border-rule px-6 py-12 sm:py-16">
            <Skeleton className="size-12 rounded-full" />
            <Skeleton className="mt-5 h-4 w-56" />
            <Skeleton className="mt-3 h-3 w-72 max-w-full" />
          </div>
        </section>

        {/* Difficulty cards */}
        <section>
          <Skeleton className="mb-3 h-3 w-40" />
          <div className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="min-h-20 rounded-md" />
            ))}
          </div>
        </section>

        {/* Generate button */}
        <section>
          <Skeleton className="mb-3 h-3 w-32" />
          <Skeleton className="h-12 w-48 rounded-sm" />
        </section>
      </div>
    </main>
  );
}
