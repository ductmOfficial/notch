"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { setLocaleAction } from "../app/settings/actions";
import { useI18n } from "../lib/i18n/client";
import type { Locale } from "../lib/i18n/messages";
import { Segmented } from "./Segmented";

/** Language; the server renders the page again in the new language. */
export function LanguagePicker({ initial }: { initial: Locale }) {
  const { t } = useI18n();
  const router = useRouter();
  const [locale, setLocale] = useState(initial);
  const [pending, startTransition] = useTransition();

  const choose = (value: Locale) => {
    setLocale(value);
    startTransition(async () => {
      await setLocaleAction(value);
      router.refresh();
    });
  };

  return (
    <Segmented
      legend={t("settings.language")}
      name="language"
      value={locale}
      onChange={choose}
      busy={pending}
      // Each language is named in itself, so it can be found whatever the current language is.
      options={[
        { value: "vi", label: "Tiếng Việt", lang: "vi" },
        { value: "en", label: "English", lang: "en" },
      ]}
    />
  );
}
