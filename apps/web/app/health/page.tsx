import { type HealthEntry, listHealthEntries, listTemperatures, type Temperature } from "@notch/db";
import type { Metadata } from "next";
import Link from "next/link";

import { BUTTON } from "../../components/button-styles";
import { Icon, type IconName } from "../../components/icons";
import { MotifMark } from "../../components/Motifs";
import { Badge, Card, NoChild, NoDatabase } from "../../components/ui";
import { getCurrentChild } from "../../lib/child";
import { getDb } from "../../lib/db";
import { formatDate, todayInVietnam } from "../../lib/format";
import {
  entryPeriod,
  formatDateTime,
  formatTemperature,
  type HealthKind,
  healthKindLabel,
  healthOverview,
  LEVEL_TONE,
  readingsByDay,
  temperatureAdvice,
  temperatureLevel,
  temperatureLevelLabel,
  vietnamDateTime,
} from "../../lib/health-view";
import type { Locale, Translate } from "../../lib/i18n/messages";
import { getI18n } from "../../lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("health.title") };
}
export const dynamic = "force-dynamic";

const KIND_ICON: Record<HealthKind, IconName> = {
  illness: "sick",
  medication: "medication",
  visit: "stethoscope",
};

interface Props {
  readonly searchParams: Promise<{ child?: string }>;
}

/**
 * The health log: what is going on now and the latest temperature first, then every entry and
 * every reading. Notch records; it never diagnoses or works out a dose.
 */
export default async function HealthPage({ searchParams }: Props) {
  const { t, locale } = await getI18n();
  const db = await getDb();
  if (!db) return <NoDatabase />;
  const { child } = await getCurrentChild(db, (await searchParams).child);
  if (!child) return <NoChild />;

  const [entries, temperatures] = await Promise.all([
    listHealthEntries(db, child.id),
    listTemperatures(db, child.id),
  ]);
  const today = todayInVietnam();
  const overview = healthOverview(entries, temperatures, today);
  const q = `?child=${child.id}`;
  const titles = new Map(entries.map((e) => [e.id, e.title]));
  const readingsOf = (entry: HealthEntry) =>
    temperatures.filter((r) => r.healthEntryId === entry.id).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 pt-2">
        <div className="max-w-2xl">
          <h1 className="headline-medium">{t("health.title")}</h1>
          <p className="body-medium mt-1 text-on-surface-variant">
            {t("health.intro", { name: child.name })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className={`${BUTTON.tonal} editor-only`} href={`/health/temperature/new${q}`}>
            <Icon name="thermostat" size={18} />
            {t("health.addTemperature")}
          </Link>
          <Link className={`${BUTTON.filled} editor-only`} href={`/health/new${q}`}>
            <Icon name="add" size={18} />
            {t("health.addEntry")}
          </Link>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <LatestReading
          reading={overview.latest}
          birthDate={child.birthDate}
          today={today}
          locale={locale}
          t={t}
          href={`/health/temperature/new${q}`}
        />
        <Card tone="low" className="flex flex-col gap-3 p-5 md:col-span-2">
          <h2 className="title-medium">{t("health.ongoing")}</h2>
          {overview.ongoing.length === 0 ? (
            <p className="body-medium flex items-center gap-3 text-on-surface-variant">
              <MotifMark size={28} />
              {t("health.noEntries")}
            </p>
          ) : (
            <ul className="divide-y divide-outline-variant">
              {overview.ongoing.map((entry) => (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  today={today}
                  locale={locale}
                  t={t}
                  q={q}
                  readings={readingsOf(entry)}
                  addReading
                />
              ))}
            </ul>
          )}
        </Card>
      </div>

      <section aria-labelledby="health-log" className="space-y-3">
        <h2 id="health-log" className="title-large">
          {t("health.past")}
        </h2>
        {overview.past.length === 0 ? (
          <p className="body-medium text-on-surface-variant">{t("health.noPast")}</p>
        ) : (
          <Card tone="outlined" className="p-2">
            <ul className="divide-y divide-outline-variant">
              {overview.past.map((entry) => (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  today={today}
                  locale={locale}
                  t={t}
                  q={q}
                  readings={readingsOf(entry)}
                />
              ))}
            </ul>
          </Card>
        )}
      </section>

      <section aria-labelledby="health-temperatures" className="space-y-3">
        <h2 id="health-temperatures" className="title-large">
          {t("health.temperatures")}
        </h2>
        <p className="body-small text-on-surface-variant">{t("health.thresholds")}</p>
        {temperatures.length === 0 ? (
          <p className="body-medium text-on-surface-variant">{t("health.noTemperatures")}</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {readingsByDay(temperatures).map((day) => (
              <Card key={day.date} tone="outlined" className="p-2">
                <h3 className="title-small px-3 pt-2 pb-1">{formatDate(day.date, locale)}</h3>
                <ul className="divide-y divide-outline-variant">
                  {day.readings.map((r) => (
                    <ReadingRow
                      key={r.id}
                      reading={r}
                      locale={locale}
                      partOf={r.healthEntryId ? titles.get(r.healthEntryId) : undefined}
                      t={t}
                      href={`/health/temperature/${r.id}/edit${q}`}
                    />
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function LatestReading({
  reading,
  birthDate,
  today,
  locale,
  t,
  href,
}: {
  reading: Temperature | undefined;
  birthDate: string;
  today: string;
  locale: Locale;
  t: Translate;
  href: string;
}) {
  if (!reading) {
    return (
      <Card tone="filled" className="flex flex-col gap-2 p-5">
        <h2 className="title-small flex items-center gap-2 text-on-surface-variant">
          <Icon name="thermostat" size={20} />
          {t("health.latest")}
        </h2>
        <p className="body-medium">{t("health.noTemperatures")}</p>
        <Link
          href={href}
          className="editor-only state-layer label-large -mx-3 mt-auto inline-flex h-10 w-fit items-center gap-1 rounded-full px-3 text-primary"
        >
          {t("health.addTemperature")}
          <Icon name="chevronRight" size={18} />
        </Link>
      </Card>
    );
  }
  const level = temperatureLevel(reading.tenthsC);
  const advice = temperatureAdvice(
    reading.tenthsC,
    birthDate,
    vietnamDateTime(reading.measuredAt).date,
    locale,
  );
  return (
    <Card tone="filled" className="flex flex-col gap-2 p-5">
      <h2 className="title-small flex items-center gap-2">
        <Icon name="thermostat" size={20} />
        {t("health.latest")}
      </h2>
      <p className="display-small tabular-nums">{formatTemperature(reading.tenthsC, locale)}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={LEVEL_TONE[level]}>{temperatureLevelLabel(level, locale)}</Badge>
        <span className="body-medium tabular-nums">
          {formatDateTime(reading.measuredAt, locale)}
        </span>
      </div>
      {advice && <p className="body-medium">{advice}</p>}
      {today !== vietnamDateTime(reading.measuredAt).date && (
        <Link
          href={href}
          className="editor-only state-layer label-large -mx-3 mt-auto inline-flex h-10 w-fit items-center gap-1 rounded-full px-3"
        >
          {t("health.addTemperature")}
          <Icon name="chevronRight" size={18} />
        </Link>
      )}
    </Card>
  );
}

function EntryRow({
  entry,
  today,
  locale,
  t,
  q,
  readings,
  addReading = false,
}: {
  entry: HealthEntry;
  today: string;
  locale: Locale;
  t: Translate;
  q: string;
  readings: number;
  addReading?: boolean;
}) {
  return (
    <li className="flex flex-wrap items-start gap-3 px-3 py-3">
      <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-full bg-secondary-container text-on-secondary-container">
        <Icon name={KIND_ICON[entry.kind]} size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="label-medium text-on-surface-variant">
          {healthKindLabel(entry.kind, locale)} · {entryPeriod(entry, today, locale)}
        </p>
        <p className="body-large">{entry.title}</p>
        {entry.note && <p className="body-medium text-on-surface-variant">{entry.note}</p>}
        {readings > 0 && (
          <p className="body-small text-on-surface-variant">
            {t("health.readings", { n: readings })}
          </p>
        )}
      </div>
      <div className="editor-only flex gap-1">
        {addReading && entry.kind === "illness" && (
          <Link
            href={`/health/temperature/new${q}&entry=${entry.id}`}
            className={BUTTON.text}
            aria-label={`${t("health.addTemperature")}: ${entry.title}`}
          >
            <Icon name="thermostat" size={18} />
            <span className="max-sm:sr-only">{t("health.addTemperature")}</span>
          </Link>
        )}
        <Link
          href={`/health/${entry.id}/edit${q}`}
          className={BUTTON.text}
          aria-label={`${t("health.edit")}: ${entry.title}`}
        >
          <Icon name="edit" size={18} />
        </Link>
      </div>
    </li>
  );
}

function ReadingRow({
  reading,
  locale,
  partOf,
  t,
  href,
}: {
  reading: Temperature;
  locale: Locale;
  partOf: string | undefined;
  t: Translate;
  href: string;
}) {
  const level = temperatureLevel(reading.tenthsC);
  const value = formatTemperature(reading.tenthsC, locale);
  return (
    <li className="flex items-center gap-3 px-3 py-2">
      <span className="body-medium w-12 tabular-nums text-on-surface-variant">
        {vietnamDateTime(reading.measuredAt).time}
      </span>
      <div className="min-w-0 flex-1">
        <p className="title-medium tabular-nums">{value}</p>
        {(partOf ?? reading.note) && (
          <p className="body-small truncate text-on-surface-variant">
            {[partOf && t("health.partOf", { title: partOf }), reading.note]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </div>
      <Badge tone={LEVEL_TONE[level]}>{temperatureLevelLabel(level, locale)}</Badge>
      <Link
        href={href}
        className={`${BUTTON.text} editor-only`}
        aria-label={`${t("health.edit")}: ${value}, ${formatDateTime(reading.measuredAt, locale)}`}
      >
        <Icon name="edit" size={18} />
      </Link>
    </li>
  );
}
