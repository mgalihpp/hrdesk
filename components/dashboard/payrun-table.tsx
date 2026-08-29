import { Download, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type Cents, moneyToMajor } from "@/lib/money";
import type { PayRunWithTotals } from "@/server/repo/payrun";

const statusStyle: Record<string, string> = {
  draft: "bg-[#e6fbff] text-[#00acca] border-0",
  running: "bg-amber-50 text-amber-700 border-0",
  done: "bg-emerald-50 text-emerald-700 border-0",
  locked: "bg-emerald-50 text-emerald-700 border-0",
};

export type PayRunRow = PayRunWithTotals;

export function PayrunTable({ payRuns }: { payRuns: PayRunRow[] }) {
  if (payRuns.length === 0) {
    return (
      <Card className="rounded-[20px] border-0 shadow-[0_1px_2px_rgba(43,43,70,0.06),0_8px_24px_rgba(43,43,70,0.06)]">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-[15px] font-semibold tracking-tight">
              Recent Pay Runs
            </CardTitle>
            <CardDescription className="mt-1">
              Idempotent runs keyed by (tenant, period, entity)
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl">
            <Download className="size-4" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <p className="py-10 text-center text-sm text-muted-foreground">
            No pay runs yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[20px] border-0 shadow-[0_1px_2px_rgba(43,43,70,0.06),0_8px_24px_rgba(43,43,70,0.06)]">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-[15px] font-semibold tracking-tight">
            Recent Pay Runs
          </CardTitle>
          <CardDescription className="mt-1">
            Idempotent runs keyed by (tenant, period, entity)
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" className="rounded-xl">
          <Download className="size-4" />
          Export
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">Run ID</TableHead>
                <TableHead className="text-xs">Period</TableHead>
                <TableHead className="text-xs">Employees</TableHead>
                <TableHead className="text-xs">Gross</TableHead>
                <TableHead className="text-xs">Net</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {payRuns.map((r) => (
                <TableRow key={r.id} className="border-border/60">
                  <TableCell className="font-mono text-xs font-medium text-[#2b2b46]">
                    {r.id.slice(-8)}
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="font-medium text-[#2b2b46]">
                      {r.periodStart} – {r.periodEnd}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">
                    {r.payslipCount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm font-medium tabular-nums">
                    ${moneyToMajor(r.gross as Cents)}
                  </TableCell>
                  <TableCell className="text-sm tabular-nums text-muted-foreground">
                    ${moneyToMajor(r.net as Cents)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={statusStyle[r.status] ?? statusStyle.draft}
                    >
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-lg"
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
