import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { sanitizeNext } from "@/lib/auth-errors";
import { AuthShell } from "../_components/AuthShell";
import { SignupForm } from "../_components/SignupForm";

export const metadata: Metadata = {
  title: "Signup to Saasdesk",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }> | { next?: string };
}) {
  const resolved = searchParams
    ? await Promise.resolve(searchParams)
    : undefined;
  const rawNext =
    resolved && typeof (resolved as { next?: string }).next === "string"
      ? ((resolved as { next?: string }).next ?? null)
      : null;
  const dest = sanitizeNext(rawNext) ?? "/";

  const h = await headers();
  const s = await auth.api.getSession({ headers: h });
  if (s?.session) redirect(dest);

  return (
    <AuthShell title="Signup to Saasdesk">
      <SignupForm />
    </AuthShell>
  );
}
