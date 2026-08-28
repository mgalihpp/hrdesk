export type Trend = {
  value: string;
  direction: "up" | "down";
  positive: boolean;
};

export type StatCard = {
  id: string;
  label: string;
  value: string;
  sub: string;
  trend: Trend;
  icon: "users" | "wallet" | "clock" | "briefcase";
  accent: string;
};

export const STATS: StatCard[] = [
  {
    id: "employees",
    label: "Total Employees",
    value: "3,248",
    sub: "Active across 12 departments",
    trend: { value: "+12%", direction: "up", positive: true },
    icon: "users",
    accent: "bg-[#e6fbff]",
  },
  {
    id: "payroll",
    label: "Monthly Payroll",
    value: "$842,500",
    sub: "Next run: Mar 01, 2026",
    trend: { value: "-2.3%", direction: "down", positive: false },
    icon: "wallet",
    accent: "bg-[#e6fff0]",
  },
  {
    id: "attendance",
    label: "Attendance Rate",
    value: "94.2%",
    sub: "1,284 present today",
    trend: { value: "+1.4%", direction: "up", positive: true },
    icon: "clock",
    accent: "bg-[#fff3e6]",
  },
  {
    id: "open",
    label: "Open Positions",
    value: "27",
    sub: "8 in final interview",
    trend: { value: "+4", direction: "up", positive: true },
    icon: "briefcase",
    accent: "bg-[#f8ffe6]",
  },
];

export type PayrollPoint = { month: string; gross: number; net: number };

export const PAYROLL_SERIES: PayrollPoint[] = [
  { month: "Sep", gross: 820, net: 610 },
  { month: "Oct", gross: 860, net: 640 },
  { month: "Nov", gross: 800, net: 590 },
  { month: "Dec", gross: 900, net: 675 },
  { month: "Jan", gross: 880, net: 660 },
  { month: "Feb", gross: 842, net: 632 },
];

export type PayRun = {
  id: string;
  period: string;
  date: string;
  employees: number;
  gross: string;
  net: string;
  status: "Paid" | "Processing" | "Scheduled";
};

export const PAY_RUNS: PayRun[] = [
  {
    id: "PR-2026-02",
    period: "Feb 16–28, 2026",
    date: "Feb 28",
    employees: 3248,
    gross: "$842,500",
    net: "$632,100",
    status: "Paid",
  },
  {
    id: "PR-2026-01B",
    period: "Feb 01–15, 2026",
    date: "Feb 15",
    employees: 3221,
    gross: "$836,200",
    net: "$627,400",
    status: "Paid",
  },
  {
    id: "PR-2026-01A",
    period: "Jan 16–31, 2026",
    date: "Jan 31",
    employees: 3204,
    gross: "$828,900",
    net: "$621,800",
    status: "Paid",
  },
  {
    id: "PR-2026-03",
    period: "Mar 01–15, 2026",
    date: "Mar 15",
    employees: 3248,
    gross: "$845,000",
    net: "$633,900",
    status: "Scheduled",
  },
];

export type Employee = {
  id: string;
  name: string;
  role: string;
  dept: string;
  avatar: string;
  status: "Active" | "On leave" | "Probation";
  comp: string;
};

export const EMPLOYEES: Employee[] = [
  {
    id: "1",
    name: "Sofia Miller",
    role: "Product Designer",
    dept: "Design",
    avatar: "SM",
    status: "Active",
    comp: "$92,500",
  },
  {
    id: "2",
    name: "Adam Smith",
    role: "Engineering Manager",
    dept: "Engineering",
    avatar: "AS",
    status: "Active",
    comp: "$145,000",
  },
  {
    id: "3",
    name: "Linda Anderson",
    role: "HR Lead",
    dept: "People Ops",
    avatar: "LA",
    status: "On leave",
    comp: "$88,000",
  },
  {
    id: "4",
    name: "James Carter",
    role: "Sales Director",
    dept: "Sales",
    avatar: "JC",
    status: "Active",
    comp: "$128,000",
  },
  {
    id: "5",
    name: "Maya Patel",
    role: "Finance Analyst",
    dept: "Finance",
    avatar: "MP",
    status: "Probation",
    comp: "$76,400",
  },
];

export type AttendanceBreakdown = {
  label: string;
  value: number;
  color: string;
};
export const ATTENDANCE: AttendanceBreakdown[] = [
  { label: "Present", value: 78, color: "#00acca" },
  { label: "Remote", value: 16, color: "#2b2b46" },
  { label: "On Leave", value: 4, color: "#f4d4eb" },
  { label: "Absent", value: 2, color: "#ffd6a8" },
];
