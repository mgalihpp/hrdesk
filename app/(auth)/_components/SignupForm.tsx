"use client";

import { useAuthFsm } from "@/hooks/useAuthFsm";
import { AuthFormLink } from "./AuthShell";
import { Field } from "./Field";

export function SignupForm() {
  const { state, isBusy, handleSignup } = useAuthFsm("signup");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const values = {
      name: String(fd.get("name") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      password: String(fd.get("password") ?? "").trim(),
      confirmPassword: String(fd.get("confirmPassword") ?? "").trim(),
    };
    await handleSignup(values);
  }

  const fieldErrors = state.fieldErrors as Record<string, string | undefined>;

  return (
    <form onSubmit={onSubmit} noValidate>
      {state.globalError ? (
        <div
          role="alert"
          className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {state.globalError}
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        <Field
          id="name"
          name="name"
          type="text"
          placeholder="Name"
          autoComplete="name"
          error={fieldErrors.name}
          disabled={isBusy}
        />
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
          autoComplete="new-password"
          error={fieldErrors.password}
          disabled={isBusy}
        />
        <Field
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Confirm Password"
          autoComplete="new-password"
          error={fieldErrors.confirmPassword}
          disabled={isBusy}
        />
      </div>

      <button
        type="submit"
        disabled={isBusy}
        className="submit-button w-button mt-4 w-full"
      >
        {isBusy ? "Please wait..." : "Signup"}
      </button>

      <AuthFormLink
        text="Already has an account?"
        linkText="Login"
        href="/login"
      />
    </form>
  );
}

export default SignupForm;
