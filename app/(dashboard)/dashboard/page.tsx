export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-lg font-semibold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your workspace is ready. Use the sidebar to manage employees and
          payroll.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Organization
          </div>
          <div className="mt-1 text-sm font-medium">Active workspace</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Plan
          </div>
          <div className="mt-1 text-sm font-medium">
            Managed in shell session
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Role
          </div>
          <div className="mt-1 text-sm font-medium">See top bar</div>
        </div>
      </div>
    </div>
  );
}
