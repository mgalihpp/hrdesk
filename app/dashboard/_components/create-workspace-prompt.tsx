"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { deriveOrgSlug } from "@/lib/slug";

function toDisplayName(slug: string, fallback: string) {
  return (
    slug
      .replace(/-[a-z0-9]{4}$/, "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()) || fallback
  );
}

export function CreateWorkspacePrompt({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const router = useRouter();
  const initial = name?.trim() || email.split("@")[0] || "My Workspace";
  const [workspaceName, setWorkspaceName] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingOrgs, setExistingOrgs] = useState<
    { id: string; name: string; slug: string }[] | null
  >(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchOrgs() {
      try {
        const res = await authClient.organization.list();
        if (cancelled) return;
        const data = res.data as unknown as
          | { id: string; name: string; slug: string }[]
          | null;
        if (Array.isArray(data) && data.length > 0) {
          setExistingOrgs(data);
        } else {
          setExistingOrgs([]);
        }
      } catch {
        if (!cancelled) setExistingOrgs([]);
      }
    }
    fetchOrgs();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleActivate(orgId: string) {
    setActivatingId(orgId);
    setError(null);
    try {
      await authClient.organization.setActive({ organizationId: orgId });
      router.refresh();
      window.location.reload();
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err?.message ?? "Failed to activate workspace");
    } finally {
      setActivatingId(null);
    }
  }

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      const trimmed = workspaceName.trim() || initial;
      const slug = deriveOrgSlug({ name: trimmed, email });
      const displayName = toDisplayName(slug, trimmed);

      let res = await authClient.organization.create({
        name: displayName,
        slug,
      });

      if (res.error) {
        const code = String(
          (res.error as { code?: string }).code ?? "",
        ).toLowerCase();
        const msg = String(
          (res.error as { message?: string }).message ?? "",
        ).toLowerCase();
        const isSlugError =
          code.includes("slug") ||
          code.includes("already") ||
          msg.includes("slug") ||
          msg.includes("already");
        if (isSlugError) {
          const retrySlug = deriveOrgSlug({
            name: `${trimmed} ${Date.now() % 1000}`,
            email,
          });
          const retryName = toDisplayName(retrySlug, trimmed);
          const retryRes = await authClient.organization.create({
            name: retryName,
            slug: retrySlug,
          });
          if (retryRes.error) throw retryRes.error;
          res = retryRes;
        } else {
          throw res.error;
        }
      }

      const orgId = (res.data as { id?: string } | null)?.id;
      if (orgId) {
        try {
          await authClient.organization.setActive({ organizationId: orgId });
        } catch {}
      } else {
        try {
          const list = await authClient.organization.list();
          const first = (list.data as unknown as { id: string }[] | null)?.[0];
          if (first?.id) {
            await authClient.organization.setActive({
              organizationId: first.id,
            });
          }
        } catch {}
      }

      router.refresh();
      // hard reload to ensure server session picks up new active org
      window.location.reload();
    } catch (e: unknown) {
      const err = e as { message?: string; error?: { message?: string } };
      setError(
        err?.message ?? err?.error?.message ?? "Failed to create workspace",
      );
    } finally {
      setLoading(false);
    }
  }

  const hasExisting = existingOrgs !== null && existingOrgs.length > 0;

  return (
    <div className="rounded-2xl border bg-white p-6 space-y-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-[#2b2b46]">
          {hasExisting ? "Select a workspace" : "No workspace yet"}
        </h3>
        <p className="text-sm text-muted-foreground">
          You are signed in as{" "}
          <span className="font-medium text-foreground">{email}</span>.{" "}
          {hasExisting
            ? "Choose a workspace below or create a new one to view live reporting data."
            : "Create a workspace to view live reporting data."}
        </p>
      </div>

      {hasExisting ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Your workspaces
          </p>
          <div className="grid gap-2">
            {existingOrgs.map((org) => (
              <div
                key={org.id}
                className="flex items-center justify-between rounded-xl border bg-muted/20 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{org.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {org.slug}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleActivate(org.id)}
                  disabled={!!activatingId || loading}
                >
                  {activatingId === org.id ? "Activating..." : "Activate"}
                </Button>
              </div>
            ))}
          </div>
          <div className="pt-2">
            <p className="text-xs font-medium text-muted-foreground">
              Or create a new one
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="workspace-name"
          className="text-xs font-medium text-muted-foreground"
        >
          Workspace name
        </label>
        <Input
          id="workspace-name"
          value={workspaceName}
          onChange={(e) => setWorkspaceName(e.target.value)}
          placeholder="My Workspace"
          disabled={loading || !!activatingId}
          className="max-w-sm"
        />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <Button
          onClick={handleCreate}
          disabled={loading || !!activatingId || !workspaceName.trim()}
        >
          {loading ? "Creating..." : "Create workspace"}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.refresh()}
          disabled={loading || !!activatingId}
        >
          Refresh
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        If you were invited to an existing workspace, ask the admin to invite{" "}
        {email}.
      </p>
    </div>
  );
}
