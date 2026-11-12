import type { Metadata } from "next";

import { LanguagePicker } from "../../components/LanguagePicker";
import { PalettePicker } from "../../components/PalettePicker";
import { SignOutButton } from "../../components/SignOutButton";
import { ThemePicker } from "../../components/ThemePicker";
import { Card } from "../../components/ui";
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
  return (
    <div className="space-y-6 pt-2">
      <header>
        <h1 className="headline-medium">{t("settings.title")}</h1>
        <p className="body-medium mt-1 text-on-surface-variant">{t("settings.scope")}</p>
      </header>
      <Card className="space-y-6 p-5">
        <ThemePicker initial={theme} />
        <PalettePicker initial={palette} />
        <LanguagePicker initial={locale} />
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
