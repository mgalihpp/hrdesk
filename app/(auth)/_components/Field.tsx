"use client";

import { cn } from "@/lib/utils";

export function Field({
  id,
  name,
  type = "text",
  placeholder,
  autoComplete,
  defaultValue,
  error,
  disabled,
}: {
  id: string;
  name: string;
  type?: string;
  placeholder: string;
  autoComplete?: string;
  defaultValue?: string;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div className="w-full">
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn("input-field w-input", error && "border-destructive")}
      />
      {error ? (
        <p
          id={`${id}-error`}
          className="mt-2 text-left text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
