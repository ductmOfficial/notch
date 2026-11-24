import { getI18n } from "../lib/i18n/server";

/** On every page of the demo: what it is, and the ways out. */
export async function DemoBanner() {
  const { t } = await getI18n();
  return (
    <div
      role="note"
      className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-m3-md bg-tertiary-container px-4 py-3 text-on-tertiary-container"
    >
      <p className="body-medium">
        <strong className="font-medium">{t("demo.label")}</strong> · {t("demo.banner")}
      </p>
      <span className="flex flex-wrap gap-x-4 gap-y-1">
        {/* Route handlers that change a cookie: plain links, not client navigation. */}
        {}
        <a href="/demo/exit?to=sign-in" className="label-large underline">
          {t("demo.signIn")}
        </a>
        {}
        <a href="/demo/exit" className="label-large underline">
          {t("demo.exit")}
        </a>
      </span>
    </div>
  );
}
