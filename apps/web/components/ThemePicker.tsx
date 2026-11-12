"use client";

import { useState, useTransition } from "react";

import { setThemeAction } from "../app/settings/actions";
import { Icon, type IconName } from "./icons";

type Theme = "system" | "light" | "dark";

const OPTIONS: { value: Theme; label: string; icon: IconName }[] = [
  { value: "system", label: "Theo hệ thống", icon: "contrast" },
  { value: "light", label: "Sáng", icon: "lightMode" },
  { value: "dark", label: "Tối", icon: "darkMode" },
];

/**
 * Light, dark or system theme as an M3 segmented button: native radio inputs, so it works with
 * the keyboard (arrow keys) and screen readers. The page switches at once; the choice is saved
 * in a cookie so the server renders it on the next visit without a flash.
 */
export function ThemePicker({ initial }: { initial: Theme }) {
  const [theme, setTheme] = useState(initial);
  const [, startTransition] = useTransition();

  const choose = (value: Theme) => {
    setTheme(value);
    const root = document.documentElement;
    if (value === "system") delete root.dataset.theme;
    else root.dataset.theme = value;
    startTransition(() => setThemeAction(value));
  };

  return (
    <fieldset>
      <legend className="title-small mb-3">Giao diện</legend>
      <div className="inline-flex flex-wrap rounded-full border border-outline">
        {OPTIONS.map((o) => (
          <label
            key={o.value}
            className="state-layer label-large flex min-h-10 cursor-pointer items-center gap-2 border-outline px-4 text-on-surface first:rounded-l-full last:rounded-r-full not-first:border-l has-checked:bg-secondary-container has-checked:text-on-secondary-container has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-secondary"
          >
            <input
              type="radio"
              name="theme"
              value={o.value}
              checked={theme === o.value}
              onChange={() => {
                choose(o.value);
              }}
              className="sr-only"
            />
            <Icon name={theme === o.value ? "check" : o.icon} size={18} />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
