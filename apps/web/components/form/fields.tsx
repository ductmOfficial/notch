"use client";

// Native inputs styled with Tailwind, kept in one place so they can be swapped
// for Sen UI components later without touching the forms.
import { type ComponentProps, type ReactNode, useId } from "react";
import { useFormStatus } from "react-dom";

const control =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-base outline-none " +
  "focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent-soft)] " +
  "aria-invalid:border-[var(--danger)]";

interface FieldProps {
  readonly label: string;
  readonly hint?: string;
  readonly error?: string;
  readonly children: (props: {
    id: string;
    "aria-invalid"?: true;
    "aria-describedby"?: string;
  }) => ReactNode;
}

/** Label, control, hint and error, wired together for screen readers. */
export function Field({ label, hint, error, children }: FieldProps) {
  const id = useId();
  const describedBy =
    [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {children({
        id,
        ...(error ? { "aria-invalid": true } : {}),
        "aria-describedby": describedBy,
      })}
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-[var(--muted)]">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-[var(--danger)]">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextInput(props: ComponentProps<"input">) {
  return <input type="text" {...props} className={control} />;
}

/** Decimal input that accepts a comma ("8,6") and opens the numeric keyboard on phones. */
export function DecimalInput(props: ComponentProps<"input">) {
  return (
    <input type="text" inputMode="decimal" autoComplete="off" {...props} className={control} />
  );
}

export function DateInput(props: ComponentProps<"input">) {
  return <input type="date" {...props} className={control} />;
}

export function Select(props: ComponentProps<"select">) {
  return <select {...props} className={control} />;
}

export function TextArea(props: ComponentProps<"textarea">) {
  return <textarea rows={2} {...props} className={control} />;
}

export function Checkbox({ label, ...props }: ComponentProps<"input"> & { label: string }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <input type="checkbox" {...props} className="size-4 accent-[var(--accent)]" />
      {label}
    </label>
  );
}

const buttons = {
  primary: "bg-[var(--accent)] text-[var(--surface)] hover:opacity-90",
  danger: "border border-[var(--danger)] text-[var(--danger)] hover:bg-[var(--danger-soft)]",
} as const;

/** Submit button that shows progress and blocks double submits. */
export function SubmitButton({
  children,
  variant = "primary",
  pendingLabel = "Đang lưu…",
}: {
  children: ReactNode;
  variant?: keyof typeof buttons;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60 ${buttons[variant]}`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

export function FormMessage({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]"
    >
      {message}
    </p>
  );
}
