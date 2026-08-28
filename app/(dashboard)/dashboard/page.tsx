import { Building2, CreditCard, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <div className="flex flex-col gap-1">
        <div className="text-xl font-semibold tracking-tight">Welcome back</div>
        <p className="text-sm leading-6 text-muted-foreground">
          Your workspace is ready. Use the sidebar to manage employees and
          payroll.
        </p>
      </div>

      <Separator />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-xl border shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="size-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-widest">
                Organization
              </span>
            </div>
            <CardTitle className="pt-1 text-[15px] font-semibold leading-none">
              Active workspace
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <CardDescription className="text-sm leading-6">
              Managed via shell session. Switch organizations in the sidebar.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CreditCard className="size-3.5" />
                <span className="text-[11px] font-semibold uppercase tracking-widest">
                  Plan
                </span>
              </div>
              <Badge
                variant="secondary"
                className="rounded-full px-2 py-0 text-[11px]"
              >
                Free
              </Badge>
            </div>
            <CardTitle className="pt-1 text-[15px] font-semibold leading-none">
              Shell managed
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <CardDescription className="text-sm leading-6">
              Billing is handled in organization settings.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="size-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-widest">
                Role
              </span>
            </div>
            <CardTitle className="pt-1 text-[15px] font-semibold leading-none">
              Owner
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <CardDescription className="text-sm leading-6">
              Full access to employees, payroll, and settings.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
