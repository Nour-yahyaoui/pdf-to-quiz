import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";

export default function DashboardLoading() {
  return (
    <main className="container-sheet py-10 sm:py-14">
      <div className="mb-8 space-y-3" aria-busy="true">
        <div className="h-3 w-24 rounded-sm bg-rule" />
        <div className="h-9 w-56 rounded-sm bg-rule" />
      </div>
      <DashboardSkeleton />
    </main>
  );
}
