export function DashboardSkeleton() {
  return (
    <div
      className="animate-pulse rounded-md border border-rule bg-raised"
      aria-busy="true"
      aria-label="Loading your quizzes"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-rule-soft px-4 py-4 last:border-b-0">
          <div className="h-10 w-10 shrink-0 rounded-sm bg-rule" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/2 rounded-sm bg-rule" />
            <div className="h-3 w-1/4 rounded-sm bg-rule-soft" />
          </div>
          <div className="h-4 w-12 rounded-sm bg-rule" />
        </div>
      ))}
    </div>
  );
}
