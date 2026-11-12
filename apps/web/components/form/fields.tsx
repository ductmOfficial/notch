"use client";

// Form controls of the app, on Sen UI. Kept in one place so every form looks and behaves alike.
import {
  Button,
  Checkbox as SenCheckbox,
  Select as SenSelect,
  SelectItem,
  TextField as SenTextField,
} from "@ductmofficial/sen-ui";
import { type ComponentProps, type ReactNode, useId } from "react";
import { useFormStatus } from "react-dom";

import { useI18n } from "../../lib/i18n/client";
import { BUTTON, type ButtonStyle } from "../button-styles";

type InputProps = Omit<ComponentProps<"input">, "type"> & {
  readonly label: string;
  readonly hint?: string;
  readonly error?: string;
};

/** A labelled text input; `hint` and `error` are announced with it. */
export function TextField({ hint, error, ...props }: InputProps) {
  return <SenTextField description={hint} error={error} autoComplete="off" {...props} />;
}

/** An email address, with the email keyboard on phones and the browser's autofill. */
export function EmailField({ hint, error, ...props }: InputProps) {
  return (
    <SenTextField
      type="email"
      inputMode="email"
      autoComplete="email"
      description={hint}
      error={error}
      {...props}
    />
  );
}

/** Decimal input that accepts a comma ("8,6") and opens the numeric keyboard on phones. */
export function DecimalField(props: InputProps) {
  return <TextField inputMode="decimal" {...props} />;
}

/** Whole numbers, such as a dose number. */
export function NumberField(props: InputProps) {
  return <TextField inputMode="numeric" {...props} />;
}

export function DateField({ hint, error, ...props }: InputProps) {
  return <SenTextField type="date" description={hint} error={error} {...props} />;
}

/**
 * Multi-line note. Sen UI has no text area yet, so this one is native, wired the same way
 * (label, description) and styled with the same tokens.
 */
export function NoteField({
  label,
  hint,
  ...props
}: ComponentProps<"textarea"> & { readonly label: string; readonly hint?: string }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="body-small text-on-surface-variant">
          {hint}
        </p>
      )}
      <textarea
        id={id}
        rows={2}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="rounded-m3-xs border border-outline bg-surface px-3 py-2"
        {...props}
      />
    </div>
  );
}

/**
 * Picks one item of a list. A hidden native select carries `name` in the form data, so it works
 * with Server Actions like a plain <select>.
 */
export function SelectField({
  label,
  name,
  items,
  defaultValue,
  placeholder,
  error,
  isRequired,
}: {
  readonly label: string;
  readonly name: string;
  readonly items: readonly { readonly id: string; readonly name: string }[];
  readonly defaultValue?: string;
  readonly placeholder?: string;
  readonly error?: string;
  readonly isRequired?: boolean;
}) {
  return (
    <SenSelect
      label={label}
      name={name}
      items={items}
      // An empty string means "nothing chosen yet", as for a native select.
      defaultValue={defaultValue === "" || defaultValue === undefined ? null : defaultValue}
      placeholder={placeholder}
      error={error}
      isRequired={isRequired}
    >
      {(item) => <SelectItem id={item.id}>{item.name}</SelectItem>}
    </SenSelect>
  );
}

/** A checkbox that submits "on" when checked, like a native one. */
export function CheckboxField({
  label,
  name,
  defaultChecked,
}: {
  readonly label: string;
  readonly name: string;
  readonly defaultChecked?: boolean;
}) {
  return (
    <SenCheckbox name={name} value="on" defaultSelected={defaultChecked}>
      {label}
    </SenCheckbox>
  );
}

/** Submit button that shows progress and blocks double submits. */
export function SubmitButton({
  children,
  variant = "filled",
  pendingLabel,
}: {
  children: ReactNode;
  variant?: ButtonStyle;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  const { t } = useI18n();
  return (
    <Button type="submit" disabled={pending} className={BUTTON[variant]}>
      {pending ? (pendingLabel ?? t("common.saving")) : children}
    </Button>
  );
}

export function FormMessage({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="body-medium rounded-m3-sm bg-error-container px-4 py-3 text-on-error-container"
    >
      {message}
    </p>
  );
}
