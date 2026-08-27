export type Benefit = {
  id: string;
  label: string;
  icon: string;
};

// §3.2 Top Benefits — four benefit cards that drive the FeatureTabs widget.
// Icons are the four Vectors-Wrapper variants from the reference site (public/).
export const BENEFITS: Benefit[] = [
  { id: "goals", label: "Set and track employee goals", icon: "/benefit-icon-1.svg" },
  { id: "payroll", label: "Automate payroll processing", icon: "/benefit-icon-2.svg" },
  { id: "attendance", label: "Track employee attendance", icon: "/benefit-icon-3.svg" },
  { id: "time", label: "Time tracking solutions", icon: "/benefit-icon-4.svg" },
];
