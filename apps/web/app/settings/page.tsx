import {
  calendarLinkInfo,
  isShareLinkActive,
  listInvites,
  listMembers,
  listShareLinks,
} from "@notch/db";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";

import { BackupCard } from "../../components/BackupCard";
import { MembersCard, ROLE_LABEL } from "../../components/MembersCard";
import { BUTTON } from "../../components/button-styles";
import { CalendarLink, type CalendarLinkSummary } from "../../components/CalendarLink";
import { LanguagePicker } from "../../components/LanguagePicker";
import { PalettePicker } from "../../components/PalettePicker";
import { type ShareLinkItem, ShareLinks } from "../../components/ShareLinks";
import { SignOutButton } from "../../components/SignOutButton";
import { ThemePicker } from "../../components/ThemePicker";
import { Icon } from "../../components/icons";
import { Card } from "../../components/ui";
import { getDb } from "../../lib/db";
import { formatDate, todayInVietnam } from "../../lib/format";
import { getI18n } from "../../lib/i18n/server";
import { getPalette, getTheme } from "../../lib/preferences";
import { isDemo } from "../../lib/demo";
import { isOwner, mayEdit, requireViewer } from "../../lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("settings.title") };
}

export default async function SettingsPage() {
  const [viewer, theme, palette] = await Promise.all([requireViewer(), getTheme(), getPalette()]);
  const { t, locale } = await getI18n();
  const db = await getDb();
  const owner = isOwner(viewer);
  const demo = await isDemo();
  const editor = mayEdit(viewer);
  const [info, members, invites, links] = await Promise.all([
    db ? calendarLinkInfo(db, viewer.familyId) : undefined,
    db && owner ? listMembers(db, viewer.familyId) : [],
    db && owner ? listInvites(db, viewer.familyId) : [],
    db && editor ? listShareLinks(db, viewer.familyId) : [],
  ]);
  const day = (date: Date) => formatDate(todayInVietnam(date), locale);
  const calendar: CalendarLinkSummary | null = info
    ? { created: day(info.createdAt), lastUsed: info.lastUsedAt ? day(info.lastUsedAt) : null }
    : null;
  // Share links are absolute, on the address this page was opened at.
  const request = await headers();
  const origin = `${request.get("x-forwarded-proto") ?? "http"}://${request.get("host") ?? "localhost"}`;
  const now = new Date();
  const shareItems: ShareLinkItem[] = viewer.children.map((c) => {
    const link = links.find((l) => l.childId === c.id);
    return {
      childId: c.id,
      name: c.name,
      link: link
        ? {
            url: `${origin}/share/${link.token}`,
            expires: link.expiresAt ? day(link.expiresAt) : null,
            expired: !isShareLinkActive(link, now),
            lastViewed: link.lastViewedAt ? day(link.lastViewedAt) : null,
          }
        : null,
    };
  });
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
      {viewer.children.length > 0 && (
        <Card className="space-y-4 p-5">
          <h2 className="title-small">{t("settings.children")}</h2>
          <ul className="divide-y divide-outline-variant">
            {viewer.children.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0"
              >
                <div className="body-medium">
                  <p className="body-large">{c.name}</p>
                  {c.fullName && (
                    <p className="text-on-surface-variant">
                      {t("settings.childFullName", { name: c.fullName })}
                    </p>
                  )}
                  {c.englishName && (
                    <p className="text-on-surface-variant">
                      {t("settings.childEnglishName", { name: c.englishName })}
                    </p>
                  )}
                  <p className="text-on-surface-variant">
                    {c.birthTime
                      ? t("settings.childBornAt", {
                          date: formatDate(c.birthDate, locale),
                          time: c.birthTime.slice(0, 5),
                        })
                      : t("settings.childBorn", { date: formatDate(c.birthDate, locale) })}
                  </p>
                </div>
                <span className="flex flex-wrap gap-2">
                  <Link href={`/child?child=${c.id}`} className={BUTTON.text}>
                    {t("child.viewPage")}
                  </Link>
                  {editor && (
                    <Link href={`/child/edit?child=${c.id}`} className={BUTTON.outlined}>
                      <Icon name="edit" size={18} />
                      {t("settings.editChild")}
                    </Link>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {owner && (
        <Card className="space-y-4 p-5">
          <h2 className="title-small">{t("members.title")}</h2>
          <MembersCard
            members={members}
            invites={invites}
            selfId={viewer.userId}
            t={t}
            locale={locale}
          />
        </Card>
      )}
      {/* Share links and the calendar link are the family's: editors and owners manage them. */}
      {editor && shareItems.length > 0 && (
        <Card className="space-y-4 p-5">
          <h2 className="title-small">{t("settings.share")}</h2>
          <ShareLinks items={shareItems} />
        </Card>
      )}
      {editor && (
        <Card className="space-y-4 p-5">
          <h2 className="title-small">{t("settings.calendar")}</h2>
          <CalendarLink summary={calendar} />
        </Card>
      )}
      <Card className="space-y-4 p-5">
        <h2 className="title-small">{t("settings.backup")}</h2>
        <BackupCard canRestore={owner} />
      </Card>
      {demo ? (
        <Card className="space-y-4 p-5">
          <h2 className="title-small">{t("settings.account")}</h2>
          <p className="body-medium text-on-surface-variant">{t("demo.banner")}</p>
          {}
          <a href="/demo/exit" className={BUTTON.outlined}>
            {t("demo.exit")}
          </a>
        </Card>
      ) : (
        <Card className="space-y-4 p-5">
          <h2 className="title-small">{t("settings.account")}</h2>
          <p className="body-medium text-on-surface-variant">
            {t("settings.signedInAs", { email: viewer.email })}
            <br />
            {t("settings.yourRole", { role: t(ROLE_LABEL[viewer.role]) })}
          </p>
          <SignOutButton />
        </Card>
      )}
    </div>
  );
}
