"use client";

import type { ReactNode } from "react";

import { Icon } from "./icons";

export interface SegmentedOption<T extends string> {
  readonly value: T;
  readonly label: string;
  /** Shown before the label when the option is not selected; a check replaces it when it is. */
  readonly icon?: ReactNode;
  /** Language of the label, when it differs from the page. */
  readonly lang?: string;
}

/**
 * M3 segmented button on native radio inputs, so it works with the keyboard (arrow keys)
 * and screen readers. The svg inside each label would catch a click meant for the input,
 * which is why the whole label is the target.
 */
export function Segmented<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
  busy = false,
}: {
  legend: string;
  name: string;
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange: (value: T) => void;
  busy?: boolean;
}) {
  return (
    <fieldset aria-busy={busy}>
      <legend className="title-small mb-3">{legend}</legend>
      <div className="inline-flex flex-wrap rounded-full border border-outline">
        {options.map((o) => (
          <label
            key={o.value}
            lang={o.lang}
            className="state-layer label-large flex min-h-10 cursor-pointer items-center gap-2 border-outline px-4 text-on-surface first:rounded-l-full last:rounded-r-full not-first:border-l has-checked:bg-secondary-container has-checked:text-on-secondary-container has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-secondary"
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => {
                onChange(o.value);
              }}
              className="sr-only"
            />
            {value === o.value ? <Icon name="check" size={18} /> : o.icon}
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
