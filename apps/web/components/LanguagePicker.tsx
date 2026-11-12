"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { setLocaleAction } from "../app/settings/actions";
import { useI18n } from "../lib/i18n/client";
import type { Locale } from "../lib/i18n/messages";
import { Icon } from "./icons";

// Each language is named in itself, so it can be found whatever the current language is.
const OPTIONS: { value: Locale; label: string }[] = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "English" },
];

/** Language as an M3 segmented button; the server renders the page again in the new language. */
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
    <fieldset aria-busy={pending}>
      <legend className="title-small mb-3">{t("settings.language")}</legend>
      <div className="inline-flex flex-wrap rounded-full border border-outline">
        {OPTIONS.map((o) => (
          <label
            key={o.value}
            lang={o.value}
            className="state-layer label-large flex min-h-10 cursor-pointer items-center gap-2 border-outline px-4 text-on-surface first:rounded-l-full last:rounded-r-full not-first:border-l has-checked:bg-secondary-container has-checked:text-on-secondary-container has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-secondary"
          >
            <input
              type="radio"
              name="language"
              value={o.value}
              checked={locale === o.value}
              onChange={() => {
                choose(o.value);
              }}
              className="sr-only"
            />
            {locale === o.value && <Icon name="check" size={18} />}
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
