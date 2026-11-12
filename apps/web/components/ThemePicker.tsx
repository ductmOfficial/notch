"use client";

import { useState, useTransition } from "react";

import { setThemeAction } from "../app/settings/actions";
import { useI18n } from "../lib/i18n/client";
import { Icon } from "./icons";
import { Segmented } from "./Segmented";

type Theme = "system" | "light" | "dark";

/**
 * Light, dark or system theme. The page switches at once; the choice is saved in a cookie so
 * the server renders it on the next visit without a flash.
 */
export function ThemePicker({ initial }: { initial: Theme }) {
  const { t } = useI18n();
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
    <Segmented
      legend={t("settings.theme")}
      name="theme"
      value={theme}
      onChange={choose}
      options={[
        {
          value: "system",
          label: t("settings.themeSystem"),
          icon: <Icon name="contrast" size={18} />,
        },
        {
          value: "light",
          label: t("settings.themeLight"),
          icon: <Icon name="lightMode" size={18} />,
        },
        { value: "dark", label: t("settings.themeDark"), icon: <Icon name="darkMode" size={18} /> },
      ]}
    />
  );
}
