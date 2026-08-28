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
import { PAY_RUNS } from "@/lib/dashboard-data";

const statusStyle: Record<string, string> = {
  Paid: "bg-emerald-50 text-emerald-700 border-0",
  Processing: "bg-amber-50 text-amber-700 border-0",
  Scheduled: "bg-[#e6fbff] text-[#00acca] border-0",
};

export function PayrunTable() {
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
              {PAY_RUNS.map((r) => (
                <TableRow key={r.id} className="border-border/60">
                  <TableCell className="font-mono text-xs font-medium text-[#2b2b46]">
                    {r.id}
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="font-medium text-[#2b2b46]">
                      {r.period}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {r.date}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">
                    {r.employees.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm font-medium tabular-nums">
                    {r.gross}
                  </TableCell>
                  <TableCell className="text-sm tabular-nums text-muted-foreground">
                    {r.net}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={statusStyle[r.status]}
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
