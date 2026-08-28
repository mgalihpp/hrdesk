"use client";

import { useAuthFsm } from "@/hooks/useAuthFsm";
import { AuthFormLink } from "./AuthShell";
import { Field } from "./Field";

export function LoginForm() {
  const { state, isBusy, handleLogin } = useAuthFsm("login");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const values = {
      email: String(fd.get("email") ?? "").trim(),
      password: String(fd.get("password") ?? "").trim(),
    };
    await handleLogin(values);
  }

  const fieldErrors = state.fieldErrors as Record<string, string | undefined>;

  return (
    <form onSubmit={onSubmit} noValidate className="flex w-full flex-col gap-6">
      {state.globalError ? (
        <div
          role="alert"
          className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {state.globalError}
        </div>
      ) : null}

      <div className="flex w-full flex-col gap-4">
        <Field
          id="email"
          name="email"
          type="email"
          placeholder="Work Email"
          autoComplete="email"
          error={fieldErrors.email}
          disabled={isBusy}
        />
        <Field
          id="password"
          name="password"
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          error={fieldErrors.password}
          disabled={isBusy}
        />
      </div>

      <button
        type="submit"
        disabled={isBusy}
        className="submit-button w-button w-full"
      >
        {isBusy ? "Please wait..." : "Login"}
      </button>

      <AuthFormLink
        text="Don't have an account?"
        linkText="Signup"
        href="/signup"
      />
    </form>
  );
}

export default LoginForm;
