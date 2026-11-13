import { calendarLinkInfo } from "@notch/db";
import type { Metadata } from "next";

import { CalendarLink, type CalendarLinkSummary } from "../../components/CalendarLink";
import { LanguagePicker } from "../../components/LanguagePicker";
import { PalettePicker } from "../../components/PalettePicker";
import { SignOutButton } from "../../components/SignOutButton";
import { ThemePicker } from "../../components/ThemePicker";
import { Card } from "../../components/ui";
import { getDb } from "../../lib/db";
import { formatDate, todayInVietnam } from "../../lib/format";
import { getI18n } from "../../lib/i18n/server";
import { getPalette, getTheme } from "../../lib/preferences";
import { requireViewer } from "../../lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("settings.title") };
}

export default async function SettingsPage() {
  const [viewer, theme, palette] = await Promise.all([requireViewer(), getTheme(), getPalette()]);
  const { t, locale } = await getI18n();
  const db = getDb();
  const info = db ? await calendarLinkInfo(db, viewer.familyId) : undefined;
  const day = (date: Date) => formatDate(todayInVietnam(date), locale);
  const calendar: CalendarLinkSummary | null = info
    ? { created: day(info.createdAt), lastUsed: info.lastUsedAt ? day(info.lastUsedAt) : null }
    : null;
  return (
    <div className="space-y-6 pt-2">
      <header>
        <h1 className="headline-medium">{t("settings.title")}</h1>
      </header>
      <Card className="space-y-6 p-5">
        {/* Theme, palette and language are cookies of this browser; the rest is the family's. */}
        <p className="body-medium text-on-surface-variant">{t("settings.scope")}</p>
        <ThemePicker initial={theme} />
        <PalettePicker initial={palette} />
        <LanguagePicker initial={locale} />
      </Card>
      <Card className="space-y-4 p-5">
        <h2 className="title-small">{t("settings.calendar")}</h2>
        <CalendarLink summary={calendar} />
      </Card>
      <Card className="space-y-4 p-5">
        <h2 className="title-small">{t("settings.account")}</h2>
        <p className="body-medium text-on-surface-variant">
          {t("settings.signedInAs", { email: viewer.email })}
        </p>
        <SignOutButton />
      </Card>
    </div>
  );
}
