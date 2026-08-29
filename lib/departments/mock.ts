import type {
  DepartmentDisplay,
  DepartmentIconKey,
  DepartmentLocation,
  DepartmentStatus,
} from "./types";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return (parts[0][0] ?? "U").toUpperCase();
  return (
    (parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")
  ).toUpperCase();
}

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

type BaseRow = {
  id: string;
  name: string;
  iconKey: DepartmentIconKey;
  headName: string;
  headEmail: string;
  location: DepartmentLocation;
  activeEmployees: number;
  budgetUtil: number;
  status: DepartmentStatus;
};

const BASE_DEPARTMENTS: BaseRow[] = [
  {
    id: "dept-001",
    name: "Engineering",
    iconKey: "engineering",
    headName: "Budi Santoso",
    headEmail: "budi.santoso@saasdesk.com",
    location: "HQ",
    activeEmployees: 15,
    budgetUtil: 85,
    status: "Active",
  },
  {
    id: "dept-002",
    name: "Marketing",
    iconKey: "marketing",
    headName: "Andi Pratama",
    headEmail: "andi.pratama@saasdesk.com",
    location: "HQ",
    activeEmployees: 12,
    budgetUtil: 92,
    status: "Active",
  },
  {
    id: "dept-003",
    name: "Product",
    iconKey: "product",
    headName: "Dewi Lestari",
    headEmail: "dewi.lestari@saasdesk.com",
    location: "HQ",
    activeEmployees: 8,
    budgetUtil: 70,
    status: "Active",
  },
  {
    id: "dept-004",
    name: "HR",
    iconKey: "hr",
    headName: "Siti Rahayu",
    headEmail: "siti.rahayu@saasdesk.com",
    location: "Branch",
    activeEmployees: 6,
    budgetUtil: 60,
    status: "Active",
  },
  {
    id: "dept-005",
    name: "Finance",
    iconKey: "finance",
    headName: "Rina Wijaya",
    headEmail: "rina.wijaya@saasdesk.com",
    location: "HQ",
    activeEmployees: 14,
    budgetUtil: 78,
    status: "Active",
  },
  {
    id: "dept-006",
    name: "Sales",
    iconKey: "sales",
    headName: "Agus Saputra",
    headEmail: "agus.saputra@saasdesk.com",
    location: "Branch",
    activeEmployees: 11,
    budgetUtil: 88,
    status: "Active",
  },
  {
    id: "dept-007",
    name: "Customer Support",
    iconKey: "support",
    headName: "Lisa Hartono",
    headEmail: "lisa.hartono@saasdesk.com",
    location: "Branch",
    activeEmployees: 9,
    budgetUtil: 65,
    status: "Active",
  },
  {
    id: "dept-008",
    name: "Legal",
    iconKey: "legal",
    headName: "Hendra Gunawan",
    headEmail: "hendra.gunawan@saasdesk.com",
    location: "HQ",
    activeEmployees: 5,
    budgetUtil: 45,
    status: "Inactive",
  },
  {
    id: "dept-009",
    name: "Operations",
    iconKey: "operations",
    headName: "Maya Sari",
    headEmail: "maya.sari@saasdesk.com",
    location: "HQ",
    activeEmployees: 13,
    budgetUtil: 72,
    status: "Active",
  },
  {
    id: "dept-010",
    name: "Design",
    iconKey: "design",
    headName: "Kevin Pratama",
    headEmail: "kevin.pratama@saasdesk.com",
    location: "Branch",
    activeEmployees: 7,
    budgetUtil: 80,
    status: "Active",
  },
  {
    id: "dept-011",
    name: "QA",
    iconKey: "qa",
    headName: "Novi Andriani",
    headEmail: "novi.andriani@saasdesk.com",
    location: "HQ",
    activeEmployees: 18,
    budgetUtil: 55,
    status: "Inactive",
  },
  {
    id: "dept-012",
    name: "Data",
    iconKey: "data",
    headName: "Fajar Nugroho",
    headEmail: "fajar.nugroho@saasdesk.com",
    location: "Branch",
    activeEmployees: 10,
    budgetUtil: 68,
    status: "Active",
  },
];

function buildMock(): DepartmentDisplay[] {
  void mulberry32;
  return BASE_DEPARTMENTS.map((r) => ({
    id: r.id,
    name: r.name,
    iconKey: r.iconKey,
    head: {
      name: r.headName,
      email: r.headEmail,
      avatarUrl: "",
      initials: getInitials(r.headName),
    },
    location: r.location,
    activeEmployees: r.activeEmployees,
    budgetUtil: r.budgetUtil,
    status: r.status,
  }));
}

export const DEPARTMENTS_MOCK: DepartmentDisplay[] = buildMock();

export { getInitials };
