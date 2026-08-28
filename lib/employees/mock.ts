import type {
  Department,
  EmployeeDisplay,
  EmployeeStats,
  EmployeeStatusLabel,
  EmploymentType,
} from "./types";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return (parts[0][0] ?? "U").toUpperCase();
  return (
    (parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")
  ).toUpperCase();
}

function formatDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-GB", { month: "short" });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export const STATS: EmployeeStats = {
  total: 128,
  active: 115,
  onLeave: 7,
  departments: 12,
};

const DEPARTMENTS: Department[] = [
  "Engineering",
  "Marketing",
  "Product",
  "HR",
  "Finance",
  "Sales",
  "Customer Support",
  "Legal",
  "Operations",
  "Design",
  "QA",
  "Data",
];

const POSITIONS_BY_DEPT: Record<Department, string[]> = {
  Engineering: [
    "Senior Frontend Developer",
    "Backend Developer",
    "Full Stack Engineer",
    "DevOps Engineer",
    "QA Engineer",
    "Frontend Developer",
  ],
  Marketing: [
    "Marketing Manager",
    "Content Strategist",
    "SEO Specialist",
    "Growth Manager",
  ],
  Product: ["Product Designer", "Product Manager", "UX Researcher"],
  HR: ["HR Generalist", "Recruiter", "People Ops"],
  Finance: ["Finance Officer", "Accountant", "Financial Analyst"],
  Sales: ["Sales Executive", "Account Executive", "Sales Manager"],
  "Customer Support": ["Support Specialist", "Support Lead"],
  Legal: ["Legal Counsel", "Paralegal"],
  Operations: ["Operations Manager", "Ops Coordinator"],
  Design: ["Visual Designer", "Brand Designer"],
  QA: ["QA Analyst", "Test Engineer"],
  Data: ["Data Analyst", "Data Engineer"],
};

const BASE_ROWS: Array<
  Omit<EmployeeDisplay, "initials" | "avatarUrl"> & { avatarUrl?: string }
> = [
  {
    id: "emp-001",
    name: "Budi Santoso",
    email: "budi.santoso@saasdesk.com",
    department: "Engineering",
    position: "Senior Frontend Developer",
    status: "Active",
    employmentType: "Full Time",
    joinedDate: "12 Jan 2024",
  },
  {
    id: "emp-002",
    name: "Sarah Wijaya",
    email: "sarah.wijaya@saasdesk.com",
    department: "Marketing",
    position: "Marketing Manager",
    status: "Active",
    employmentType: "Full Time",
    joinedDate: "03 Mar 2024",
  },
  {
    id: "emp-003",
    name: "Andi Pratama",
    email: "andi.pratama@saasdesk.com",
    department: "Product",
    position: "Product Designer",
    status: "Active",
    employmentType: "Full Time",
    joinedDate: "21 Feb 2024",
  },
  {
    id: "emp-004",
    name: "Dewi Lestari",
    email: "dewi.lestari@saasdesk.com",
    department: "HR",
    position: "HR Generalist",
    status: "Active",
    employmentType: "Full Time",
    joinedDate: "11 Apr 2024",
  },
  {
    id: "emp-005",
    name: "Rizky Aditya",
    email: "rizky.aditya@saasdesk.com",
    department: "Engineering",
    position: "Backend Developer",
    status: "On Leave",
    employmentType: "Full Time",
    joinedDate: "18 Dec 2023",
  },
  {
    id: "emp-006",
    name: "Nadia Putri",
    email: "nadia.putri@saasdesk.com",
    department: "Finance",
    position: "Finance Officer",
    status: "Active",
    employmentType: "Full Time",
    joinedDate: "07 Feb 2024",
  },
  {
    id: "emp-007",
    name: "Fajar Nugroho",
    email: "fajar.nugroho@saasdesk.com",
    department: "Sales",
    position: "Sales Executive",
    status: "Active",
    employmentType: "Contract",
    joinedDate: "29 May 2024",
  },
  {
    id: "emp-008",
    name: "Maya Sari",
    email: "maya.sari@saasdesk.com",
    department: "Customer Support",
    position: "Support Specialist",
    status: "Active",
    employmentType: "Full Time",
    joinedDate: "30 Jan 2024",
  },
];

const SYNTH_FIRST = [
  "Ahmad",
  "Bambang",
  "Citra",
  "Dian",
  "Eka",
  "Farah",
  "Gita",
  "Hendra",
  "Indra",
  "Joko",
  "Kartika",
  "Lestari",
  "Maha",
  "Nanda",
  "Oki",
  "Pratiwi",
  "Qori",
  "Rina",
  "Sinta",
  "Tari",
  "Umar",
  "Vina",
  "Wahyu",
  "Yuni",
  "Zahra",
  "Agus",
  "Bayu",
  "Cahya",
  "Darma",
  "Elisa",
];

const SYNTH_LAST = [
  "Wijaya",
  "Santoso",
  "Pratama",
  "Lestari",
  "Aditya",
  "Putri",
  "Nugroho",
  "Sari",
  "Kusuma",
  "Hartono",
  "Saputra",
  "Permata",
  "Gunawan",
  "Mahendra",
  "Setiawan",
  "Anggraini",
  "Hidayat",
  "Susanto",
  "Utami",
  "Wibowo",
  "Sutanto",
  "Halim",
  "Purnama",
  "Handoko",
  "Kurniawan",
  "Siregar",
  "Tanuwijaya",
  "Widodo",
  "Suhendra",
  "Amelia",
];

const EMPLOYMENT_TYPES: EmploymentType[] = [
  "Full Time",
  "Contract",
  "Part Time",
  "Intern",
];

function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function toSyntheticRow(index: number): EmployeeDisplay {
  const seed = 0x9e3779b9 + index * 0x85ebca6b;
  const rand = mulberry32(seed);
  const first = SYNTH_FIRST[index % SYNTH_FIRST.length];
  const last =
    SYNTH_LAST[Math.floor(rand() * SYNTH_LAST.length) % SYNTH_LAST.length];
  const name = `${first} ${last} ${String(index).padStart(2, "0")}`;
  const email = `${first.toLowerCase()}.${last.toLowerCase()}${index}@saasdesk.com`;
  const department = DEPARTMENTS[
    (index * 7 + 13) % DEPARTMENTS.length
  ] as Department;
  const positions = POSITIONS_BY_DEPT[department];
  const position = positions[index % positions.length] ?? positions[0];
  const status: EmployeeStatusLabel = index % 20 === 0 ? "On Leave" : "Active";
  const employmentType = (() => {
    const r = index % 10;
    if (r <= 6) return "Full Time" as EmploymentType;
    if (r === 7) return "Contract" as EmploymentType;
    if (r === 8) return "Part Time" as EmploymentType;
    return "Intern" as EmploymentType;
  })();
  const baseDate = new Date(2023, 0, 1).getTime();
  const dayOffset = (index * 17 + Math.floor(rand() * 30)) % 520;
  const joinedDate = formatDate(
    new Date(baseDate + dayOffset * 24 * 60 * 60 * 1000),
  );
  const id = `emp-${String(index + 1).padStart(3, "0")}`;
  return {
    id,
    name,
    email,
    avatarUrl: "",
    initials: getInitials(name),
    department,
    position,
    status,
    employmentType,
    joinedDate,
  };
}

function buildMock(): EmployeeDisplay[] {
  const out: EmployeeDisplay[] = [];
  for (const r of BASE_ROWS) {
    out.push({
      id: r.id,
      name: r.name,
      email: r.email,
      avatarUrl: r.avatarUrl ?? "",
      initials: getInitials(r.name),
      department: r.department,
      position: r.position,
      status: r.status as EmployeeStatusLabel,
      employmentType: r.employmentType as EmploymentType,
      joinedDate: r.joinedDate,
    });
  }
  for (let i = 8; i < 128; i++) {
    out.push(toSyntheticRow(i));
  }
  void EMPLOYMENT_TYPES;
  return out;
}

export const EMPLOYEES_MOCK: EmployeeDisplay[] = buildMock();
