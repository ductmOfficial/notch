import { childForShareToken, listMeasurements, listMilestones, listVaccinations } from "@notch/db";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { MilestoneTile } from "../../../components/MilestoneTile";
import { CoverArt } from "../../../components/Motifs";
import { ShareRefresh } from "../../../components/ShareRefresh";
import { Icon } from "../../../components/icons";
import { Card } from "../../../components/ui";
import { getAppDb } from "../../../lib/db";
import { formatAge, formatDate, formatNumber, todayInVietnam } from "../../../lib/format";
import { chartPoints, INDICATORS } from "../../../lib/growth-chart";
import { getI18n } from "../../../lib/i18n/server";
import { buildVaccinationView } from "../../../lib/vaccines-view";

export const dynamic = "force-dynamic";

interface Props {
  readonly params: Promise<{ token: string }>;
}

/**
 * The child a link opens, looked up once per request for both the metadata and the page.
 * Always the app's database: a share link never opens the demo.
 */
const openLink = cache(async (token: string) => {
  const db = getAppDb();
  const link = db ? await childForShareToken(db, token) : undefined;
  return link && db ? { db, ...link } : undefined;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { t } = await getI18n();
  const link = await openLink((await params).token);
  return {
    title: link ? t("share.title", { name: link.child.name }) : t("share.goneTitle"),
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  };
}

/**
 * A child's page for people without an account, opened by a link the family shares from
 * Settings: the name, age, latest measurement, doses and milestones. Never the health log,
 * the birth date and time, or the birth-certificate and English names.
 */
export default async function SharePage({ params }: Props) {
  const link = await openLink((await params).token);
  if (!link) notFound();
  const { db, child, expiresAt } = link;
  const { t, locale } = await getI18n();
  const [measurements, vaccinations, milestones] = await Promise.all([
    listMeasurements(db, child.id),
    listVaccinations(db, child.id),
    listMilestones(db, child.id),
  ]);
  const today = todayInVietnam();
  const latest = (["weight", "length"] as const).flatMap((indicator) => {
    const point = chartPoints(indicator, child.sex, child.birthDate, measurements).at(-1);
    return point ? [{ indicator, point }] : [];
  });
  const covered = buildVaccinationView(vaccinations, [], today, undefined, locale).covered;
  const initial = child.name.trim().charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-5xl space-y-4 pt-2">
      <ShareRefresh />
      <section
        aria-labelledby="child-name"
        className="overflow-hidden rounded-m3-xl bg-surface-container-low"
      >
        <div className="relative isolate h-40 overflow-hidden bg-gradient-to-br from-primary-container via-secondary-container to-tertiary-container md:h-56">
          <CoverArt />
        </div>
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3 px-5 pb-5 md:px-8">
          <span
            aria-hidden="true"
            className="display-medium relative z-10 -mt-14 flex size-28 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary ring-4 ring-surface-container-low md:-mt-20 md:size-40"
          >
            {initial}
          </span>
          <div className="min-w-0 flex-1 pb-1">
            <h1 id="child-name" className="headline-large">
              {child.name}
            </h1>
            <p className="body-large text-on-surface-variant">
              {formatAge(child.birthDate, today, locale)}
            </p>
          </div>
          <p className="label-large inline-flex h-8 items-center gap-1.5 rounded-m3-sm bg-secondary-container px-3 text-on-secondary-container">
            <Icon name="share" size={18} />
            {t("share.badge")}
          </p>
        </div>
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card tone="filled" className="space-y-3 p-5">
            <h2 className="title-large">{t("share.latest")}</h2>
            {latest.length === 0 ? (
              <p className="body-medium text-on-surface-variant">{t("share.noMeasurements")}</p>
            ) : (
              <dl className="grid grid-cols-2 gap-3">
                {latest.map(({ indicator, point }) => {
                  const info = INDICATORS[indicator];
                  return (
                    <div key={indicator} className="rounded-m3-md bg-surface-container-low p-3">
                      <dt className="body-small text-on-surface-variant">{t(info.labelKey)}</dt>
                      <dd className="title-large tabular-nums">
                        {point.estimated ? "≈" : ""}
                        {formatNumber(point.value, info.digits, locale)}{" "}
                        <span className="body-small text-on-surface-variant">{info.unit}</span>
                      </dd>
                      <dd className="body-small tabular-nums text-on-surface-variant">
                        {t("share.measuredOn", { date: formatDate(point.date, locale) })}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            )}
          </Card>

          <Card tone="filled" className="space-y-3 p-5">
            <h2 className="title-large">{t("child.vaccines")}</h2>
            {vaccinations.length === 0 ? (
              <p className="body-medium text-on-surface-variant">{t("share.noDoses")}</p>
            ) : (
              <>
                <p className="title-medium">{t("share.doses", { n: vaccinations.length })}</p>
                <div>
                  <p className="body-small text-on-surface-variant">
                    {t("share.protectedAgainst")}
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {covered.map((row) => (
                      <li
                        key={row.code}
                        className="label-large inline-flex h-8 items-center gap-1.5 rounded-m3-sm border border-outline-variant pr-3 pl-2"
                      >
                        <span className="text-success">
                          <Icon name="check" size={18} />
                        </span>
                        {row.name}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </Card>
        </div>

        <section aria-labelledby="milestones" className="min-w-0 space-y-3">
          <h2 id="milestones" className="title-large">
            {t("child.tabMilestones")}
          </h2>
          {milestones.length === 0 ? (
            <p className="body-medium text-on-surface-variant">{t("share.noMilestones")}</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {milestones.map((m) => (
                <li key={m.id}>
                  <MilestoneTile milestone={m} locale={locale} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <footer className="body-small space-y-1 border-t border-outline-variant pt-4 text-on-surface-variant">
        <p>{t("share.footer", { name: child.name })}</p>
        {expiresAt && (
          <p>{t("share.expires", { date: formatDate(todayInVietnam(expiresAt), locale) })}</p>
        )}
        <Link href="/about" className="label-large inline-flex h-10 items-center text-primary">
          {t("share.about")}
        </Link>
      </footer>
    </div>
  );
}
