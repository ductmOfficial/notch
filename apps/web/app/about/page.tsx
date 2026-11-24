import type { Metadata } from "next";
import Link from "next/link";

import { BUTTON } from "../../components/button-styles";
import { Icon, type IconName } from "../../components/icons";
import { MotifMark } from "../../components/Motifs";
import { Card } from "../../components/ui";
import type { MessageKey } from "../../lib/i18n/messages";
import { getI18n } from "../../lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("about.title") };
}

const FEATURES: { icon: IconName; title: MessageKey; body: MessageKey }[] = [
  { icon: "growth", title: "about.growthTitle", body: "about.growthBody" },
  { icon: "vaccines", title: "about.vaccinesTitle", body: "about.vaccinesBody" },
  { icon: "health", title: "about.healthTitle", body: "about.healthBody" },
  { icon: "event", title: "about.pageTitle", body: "about.pageBody" },
  { icon: "settings", title: "about.familyTitle", body: "about.familyBody" },
  { icon: "download", title: "about.privacyTitle", body: "about.privacyBody" },
];

/**
 * What Notch is, for a first visit to the address (the proxy sends signed-out visitors of
 * "/" here): the features, a read-only demo with a fictional child, and the way to sign in.
 */
export default async function AboutPage() {
  const { t } = await getI18n();
  return (
    <div className="mx-auto max-w-5xl space-y-10 pt-6 md:pt-12">
      <header className="flex flex-col items-start gap-4">
        <MotifMark size={64} />
        <h1 className="display-small">{t("about.heading")}</h1>
        <p className="title-medium max-w-2xl text-on-surface-variant">{t("about.intro")}</p>
        <div className="flex flex-wrap gap-2">
          {/* A route handler that sets a cookie: a plain link, not client navigation. */}
          {}
          <a href="/demo" className={BUTTON.filled}>
            <Icon name="today" size={18} />
            {t("about.tryDemo")}
          </a>
          <Link href="/sign-in" className={BUTTON.outlined}>
            {t("about.signIn")}
          </Link>
        </div>
        <p className="body-small text-on-surface-variant">{t("about.demoNote")}</p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <li key={f.title}>
            <Card tone="low" className="flex h-full flex-col gap-2 p-5">
              <span className="grid size-10 place-items-center rounded-full bg-secondary-container text-on-secondary-container">
                <Icon name={f.icon} size={22} />
              </span>
              <h2 className="title-medium">{t(f.title)}</h2>
              <p className="body-medium text-on-surface-variant">{t(f.body)}</p>
            </Card>
          </li>
        ))}
      </ul>

      <p className="body-small max-w-2xl text-on-surface-variant">{t("about.disclaimer")}</p>
    </div>
  );
}
