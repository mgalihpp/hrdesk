"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useReducer } from "react";
import { authClient } from "@/lib/auth-client";
import { mapAuthError, sanitizeNext } from "@/lib/auth-errors";
import { deriveOrgSlug } from "@/lib/slug";
import {
  type FieldErrors,
  loginSchema,
  signupSchema,
  toFieldErrors,
} from "@/lib/validators/auth";

export type AuthMode = "signup" | "login";

export type FsmStatus =
  | "idle"
  | "validating"
  | "submitting"
  | "creatingOrg"
  | "success"
  | "error";

export interface FsmState {
  status: FsmStatus;
  fieldErrors: FieldErrors<Record<string, string>>;
  globalError: string | null;
}

type Action =
  | { type: "SUBMIT_START" }
  | {
      type: "VALIDATION_ERROR";
      fieldErrors: FieldErrors<Record<string, string>>;
    }
  | { type: "CREATING_ORG" }
  | { type: "SUCCESS" }
  | {
      type: "FAIL";
      fieldErrors: FieldErrors<Record<string, string>>;
      globalError: string | null;
    }
  | { type: "RESET" };

function reducer(state: FsmState, action: Action): FsmState {
  switch (action.type) {
    case "SUBMIT_START":
      return { status: "submitting", fieldErrors: {}, globalError: null };
    case "VALIDATION_ERROR":
      return {
        status: "error",
        fieldErrors: action.fieldErrors,
        globalError: null,
      };
    case "CREATING_ORG":
      return { status: "creatingOrg", fieldErrors: {}, globalError: null };
    case "SUCCESS":
      return { status: "success", fieldErrors: {}, globalError: null };
    case "FAIL":
      return {
        status: "error",
        fieldErrors: action.fieldErrors,
        globalError: action.globalError,
      };
    case "RESET":
      return { status: "idle", fieldErrors: {}, globalError: null };
    default:
      return state;
  }
}

export function useAuthFsm(_mode: AuthMode) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, dispatch] = useReducer(reducer, {
    status: "idle",
    fieldErrors: {},
    globalError: null,
  } as FsmState);

  const isBusy =
    state.status === "submitting" || state.status === "creatingOrg";

  const handleSignup = useCallback(
    async (values: {
      name: string;
      email: string;
      password: string;
      confirmPassword: string;
    }) => {
      const parsed = signupSchema.safeParse(values);
      if (!parsed.success) {
        dispatch({
          type: "VALIDATION_ERROR",
          fieldErrors: toFieldErrors(parsed.error),
        });
        return;
      }
      dispatch({ type: "SUBMIT_START" });
      const { name, email, password } = parsed.data;
      const nextRaw = searchParams.get("next");
      const next = sanitizeNext(nextRaw) ?? "/dashboard";

      try {
        const signUpRes = await authClient.signUp.email({
          name,
          email,
          password,
          callbackURL: next,
        });

        if (signUpRes.error) throw signUpRes.error;

        dispatch({ type: "CREATING_ORG" });

        const slug = deriveOrgSlug({ name, email });
        let orgRes = await authClient.organization.create({
          name:
            slug
              .replace(/-[a-z0-9]{4}$/, "")
              .replace(/-/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase()) || name,
          slug,
        });

        if (orgRes.error) {
          const code = (orgRes.error as { code?: string }).code ?? "";
          const msg = String(
            (orgRes.error as { message?: string }).message ?? "",
          ).toLowerCase();
          const isSlugError =
            String(code).toLowerCase().includes("slug") ||
            String(code).toLowerCase().includes("already") ||
            msg.includes("slug") ||
            msg.includes("already");
          if (isSlugError) {
            const retrySlug = deriveOrgSlug({
              name: `${name} ${Date.now() % 1000}`,
              email,
            });
            const retryRes = await authClient.organization.create({
              name:
                retrySlug
                  .replace(/-[a-z0-9]{4}$/, "")
                  .replace(/-/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase()) || name,
              slug: retrySlug,
            });
            if (retryRes.error) throw retryRes.error;
            orgRes = retryRes;
          } else {
            throw orgRes.error;
          }
        }

        const orgId = (orgRes.data as { id?: string } | null)?.id;
        if (orgId) {
          try {
            await authClient.organization.setActive({ organizationId: orgId });
          } catch {}
        } else {
          // organization.create auto-sets activeOrganizationId via adapter,
          // so absence of orgId mainly means fallback slug succeeded internally.
          // Ensure session reflects the new org by re-fetching.
          try {
            const list = await authClient.organization.list();
            const first = (
              list.data as unknown as { id: string }[] | null
            )?.[0];
            if (first?.id) {
              await authClient.organization.setActive({
                organizationId: first.id,
              });
            }
          } catch {}
        }

        dispatch({ type: "SUCCESS" });
        router.push(next);
        router.refresh();
      } catch (err: unknown) {
        const mapped = mapAuthError<Record<string, string>>(err);
        dispatch({
          type: "FAIL",
          fieldErrors: mapped.fields,
          globalError: mapped.global,
        });
      }
    },
    [router, searchParams],
  );

  const handleLogin = useCallback(
    async (values: { email: string; password: string }) => {
      const parsed = loginSchema.safeParse(values);
      if (!parsed.success) {
        dispatch({
          type: "VALIDATION_ERROR",
          fieldErrors: toFieldErrors(parsed.error),
        });
        return;
      }
      dispatch({ type: "SUBMIT_START" });
      const { email, password } = parsed.data;
      const nextRaw = searchParams.get("next");
      const next = sanitizeNext(nextRaw) ?? "/dashboard";

      try {
        const res = await authClient.signIn.email({
          email,
          password,
          callbackURL: next,
        });
        if (res.error) throw res.error;

        try {
          const orgs = await authClient.organization.list();
          const list =
            (orgs.data as unknown as { id: string }[] | null) ?? null;
          if (list && list.length > 0) {
            const session = await authClient.getSession();
            const activeId =
              (
                session.data as unknown as {
                  session?: { activeOrganizationId?: string | null };
                } | null
              )?.session?.activeOrganizationId ?? null;
            if (!activeId) {
              await authClient.organization.setActive({
                organizationId: list[0].id,
              });
            }
          }
        } catch {}

        dispatch({ type: "SUCCESS" });
        router.push(next);
        router.refresh();
      } catch (err: unknown) {
        const mapped = mapAuthError<Record<string, string>>(err);
        dispatch({
          type: "FAIL",
          fieldErrors: mapped.fields,
          globalError: mapped.global,
        });
      }
    },
    [router, searchParams],
  );

  return {
    state,
    isBusy,
    fieldErrors: state.fieldErrors,
    globalError: state.globalError,
    handleSignup,
    handleLogin,
    reset: () => dispatch({ type: "RESET" }),
  };
}
