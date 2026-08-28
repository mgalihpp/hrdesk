import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EMPLOYEES } from "@/lib/dashboard-data";

const statusStyle: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-700 border-0",
  "On leave": "bg-[#fff3e6] text-amber-700 border-0",
  Probation: "bg-[#e6e8ff] text-[#2b2b46] border-0",
};

export function EmployeeTable() {
  return (
    <Card
      id="employees"
      className="rounded-[20px] border-0 shadow-[0_1px_2px_rgba(43,43,70,0.06),0_8px_24px_rgba(43,43,70,0.06)]"
    >
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="text-[15px] font-semibold tracking-tight">
              Employees
            </CardTitle>
            <CardDescription className="mt-1">
              PII encrypted at rest · compensation in minor units
            </CardDescription>
          </div>
          <Button className="rounded-xl bg-[#2b2b46] text-white hover:bg-[#2b2b46]/90">
            <Plus className="size-4" />
            Add employee
          </Button>
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, role, or department…"
              className="h-9 rounded-xl bg-muted/50 pl-9"
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="h-9 w-full rounded-xl sm:w-[160px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="eng">Engineering</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="hidden h-9 w-9 shrink-0 rounded-xl sm:inline-flex"
          >
            <SlidersHorizontal className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">Employee</TableHead>
                <TableHead className="text-xs">Department</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Compensation</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {EMPLOYEES.map((e) => (
                <TableRow key={e.id} className="border-border/60">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-[#f4d4eb] text-[#2b2b46] text-xs font-semibold">
                          {e.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium leading-none text-[#2b2b46]">
                          {e.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {e.role}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {e.dept}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={statusStyle[e.status]}
                    >
                      {e.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm font-medium tabular-nums">
                    {e.comp}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 rounded-lg text-xs"
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
          <span>Showing 5 of 3,248 employees</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-7 rounded-lg">
              Previous
            </Button>
            <Button variant="outline" size="sm" className="h-7 rounded-lg">
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
