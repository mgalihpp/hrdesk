export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 animate-pulse">
      <div className="h-24 rounded-xl border bg-card" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-20 rounded-xl border bg-card" />
        <div className="h-20 rounded-xl border bg-card" />
        <div className="h-20 rounded-xl border bg-card" />
      </div>
    </div>
  );
}
