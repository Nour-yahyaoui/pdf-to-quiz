export default function ResultsLoading() {
  return (
    <main className="container-sheet py-8 sm:py-12" aria-busy="true">
      <div className="mb-8 h-4 w-40 rounded-sm bg-rule" />
      <div className="h-9 w-64 rounded-sm bg-rule" />
      <div className="mt-10 h-56 animate-pulse rounded-md border border-rule bg-raised" />
      <div className="mt-8 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-md border border-rule bg-raised" />
        ))}
      </div>
    </main>
  );
}
