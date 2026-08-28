export type OrgSlug = string & { readonly __brand: "OrgSlug" };

export function toSlug(input: string): OrgSlug {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  const slug = base.length >= 2 ? base : "org";
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${slug}-${suffix}` as OrgSlug;
}

export function deriveOrgSlug(args: { name: string; email: string }): OrgSlug {
  const domain = args.email.split("@")[1]?.split(".")[0];
  const source = domain && domain.length >= 2 ? domain : args.name;
  return toSlug(source);
}
