import type { FieldErrors } from "@/lib/validators/auth";

type CodeMap = Record<string, { field: string | null; message: string }>;

const CODE_MAP: CodeMap = {
  USER_ALREADY_EXISTS: {
    field: "email",
    message: "An account with this email already exists",
  },
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: {
    field: "email",
    message: "An account with this email already exists",
  },
  INVALID_EMAIL_OR_PASSWORD: {
    field: null,
    message: "Invalid email or password",
  },
  INVALID_CREDENTIALS: {
    field: null,
    message: "Invalid email or password",
  },
  TOO_MANY_REQUESTS: {
    field: null,
    message: "Too many attempts. Please try again later",
  },
};

export function mapAuthError<T>(error: unknown): {
  fields: FieldErrors<T>;
  global: string | null;
} {
  const fields = {} as FieldErrors<T>;
  let global: string | null = null;

  const msg =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : "";

  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";

  const bodyCode =
    typeof error === "object" &&
    error !== null &&
    "body" in error &&
    typeof (error as { body: unknown }).body === "object" &&
    (error as { body: { code?: unknown } }).body?.code
      ? String((error as { body: { code: unknown } }).body.code)
      : "";

  const lookup = CODE_MAP[code] ?? CODE_MAP[bodyCode] ?? CODE_MAP[msg];

  if (lookup) {
    if (lookup.field) {
      (fields as Record<string, string>)[lookup.field] = lookup.message;
    } else {
      global = lookup.message;
    }
    return { fields, global };
  }

  if (
    msg.toLowerCase().includes("already exists") ||
    msg.toLowerCase().includes("already registered")
  ) {
    (fields as Record<string, string>).email =
      "An account with this email already exists";
    return { fields, global };
  }

  if (
    msg.toLowerCase().includes("invalid") &&
    msg.toLowerCase().includes("password")
  ) {
    return { fields, global: "Invalid email or password" };
  }

  global = msg || "Something went wrong. Please try again";
  return { fields, global };
}

export function sanitizeNext(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  if (raw.includes("\\")) return null;
  if (raw.includes(":") && raw.includes("://")) return null;
  try {
    const u = new URL(raw, "http://x");
    if (u.host !== "x") return null;
  } catch {
    return null;
  }
  return raw;
}
