import {
  type Child,
  listAppointments,
  listMeasurements,
  listHealthEntries,
  listMilestones,
  listVaccinations,
  type Milestone,
} from "@notch/db";
import type { AppointmentState } from "@notch/vaccines";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { BUTTON } from "../../components/button-styles";
import { Icon, type IconName } from "../../components/icons";
import { CoverArt } from "../../components/Motifs";
import { Card, NoChild, NoDatabase } from "../../components/ui";
import { getCurrentChild } from "../../lib/child";
import { mayEdit, requireViewer } from "../../lib/session";
import {
  buildTimeline,
  isTimelineFilter,
  milestoneKindLabel,
  TIMELINE_FILTERS,
  type TimelineEvent,
  type TimelineFilter,
  type TimelineKind,
} from "../../lib/child-timeline";
import { getDb } from "../../lib/db";
import { formatAge, formatDate, formatMonth, formatNumber, todayInVietnam } from "../../lib/format";
import { type GrowthReading, readGrowth } from "../../lib/growth-assessment";
import { type ChartPoint, chartPoints, INDICATORS } from "../../lib/growth-chart";
import type { Locale, MessageKey, Translate } from "../../lib/i18n/messages";
import { getI18n } from "../../lib/i18n/server";
import { lifePathNumber } from "../../lib/numerology";
import { MEANINGS } from "../../lib/numerology-content";
import {
  buildVaccinationView,
  dueLabel,
  productDiseases,
  productName,
} from "../../lib/vaccines-view";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("child.pageTitle") };
}
export const dynamic = "force-dynamic";

const TABS = ["timeline", "about", "milestones"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABELS: Record<Tab, MessageKey> = {
  timeline: "child.tabTimeline",
  about: "child.tabAbout",
  milestones: "child.tabMilestones",
};
const isTab = (value: unknown): value is Tab =>
  typeof value === "string" && (TABS as readonly string[]).includes(value);

interface Props {
  readonly searchParams: Promise<{
    child?: string | string[];
    tab?: string | string[];
    filter?: string | string[];
  }>;
}

const KIND_ICON: Record<TimelineKind, IconName> = {
  milestone: "event",
  health: "health",
  measurement: "scale",
  dose: "vaccines",
};

const FILTER_LABELS: Record<TimelineFilter, MessageKey> = {
  all: "timeline.all",
  milestone: "timeline.milestones",
  health: "timeline.health",
  measurement: "timeline.measurements",
  dose: "timeline.doses",
};

interface Growth {
  readonly indicator: "weight" | "length";
  readonly point: ChartPoint;
  readonly reading: GrowthReading | undefined;
}

/**
 * The child's own page, laid out like a social profile: a cover and an avatar, the name and
 * actions, tabs, then an intro column next to a feed of the child's story. Family only, like
 * every page; no photos yet, so the cover is the palette's drawing.
 */
export default async function ChildPage({ searchParams }: Props) {
  const params = await searchParams;
  const { t, locale } = await getI18n();
  const db = await getDb();
  if (!db) return <NoDatabase />;
  const { child } = await getCurrentChild(db, params.child);
  // Viewers see the page without the add and edit controls.
  const editable = mayEdit(await requireViewer());
  if (!child) return <NoChild />;

  const tab: Tab = isTab(params.tab) ? params.tab : "timeline";
  const filter: TimelineFilter = isTimelineFilter(params.filter) ? params.filter : "all";
  const [measurements, vaccinations, appointments, milestones, healthEntries] = await Promise.all([
    listMeasurements(db, child.id),
    listVaccinations(db, child.id),
    listAppointments(db, child.id),
    listMilestones(db, child.id),
    listHealthEntries(db, child.id),
  ]);
  const today = todayInVietnam();
  const next = buildVaccinationView(vaccinations, appointments, today, undefined, locale).next;
  const growth: Growth[] = (["weight", "length"] as const).flatMap((indicator) => {
    const points = chartPoints(indicator, child.sex, child.birthDate, measurements);
    const point = points.at(-1);
    return point
      ? [
          {
            indicator,
            point,
            reading: readGrowth(indicator, child.sex, child.birthDate, points, locale),
          },
        ]
      : [];
  });
  const q = `child=${child.id}`;
  const initial = child.name.trim().charAt(0).toUpperCase();
  const otherNames = [child.fullName, child.englishName].filter((n): n is string => Boolean(n));

  return (
    <div className="space-y-4 pt-2">
      <section
        aria-labelledby="child-name"
        className="overflow-hidden rounded-m3-xl bg-surface-container-low"
      >
        {/* Cover: the palette's drawing until there are photos. */}
        <div className="relative isolate h-40 overflow-hidden bg-gradient-to-br from-primary-container via-secondary-container to-tertiary-container md:h-56">
          <CoverArt />
        </div>
        <div className="px-5 pb-2 md:px-8">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
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
              {otherNames.length > 0 && (
                <p className="title-medium text-on-surface-variant">{otherNames.join(" · ")}</p>
              )}
              <p className="body-large text-on-surface-variant">
                {formatAge(child.birthDate, today, locale)}
              </p>
            </div>
            <div className="editor-only flex flex-wrap gap-2 pb-2">
              <Link href={`/child/milestones/new?${q}`} className={BUTTON.filled}>
                <Icon name="add" size={18} />
                {t("milestone.add")}
              </Link>
              <Link href={`/child/edit?${q}`} className={BUTTON.tonal}>
                <Icon name="edit" size={18} />
                {t("settings.editChild")}
              </Link>
            </div>
          </div>
          <nav
            aria-label={t("child.tabs")}
            className="mt-4 flex gap-1 overflow-x-auto border-t border-outline-variant"
          >
            {TABS.map((key) => (
              <Link
                key={key}
                href={`/child?${q}${key === "timeline" ? "" : `&tab=${key}`}`}
                aria-current={key === tab ? "page" : undefined}
                className="state-layer title-small relative inline-flex h-12 shrink-0 items-center px-4 text-on-surface-variant aria-[current=page]:text-primary aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-2 aria-[current=page]:after:bottom-0 aria-[current=page]:after:h-[3px] aria-[current=page]:after:rounded-t-full aria-[current=page]:after:bg-primary"
              >
                {t(TAB_LABELS[key])}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      {tab === "timeline" && (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <div className="space-y-4 lg:sticky lg:top-4">
            <IntroCard child={child} q={q} t={t} locale={locale} />
            <NowCard growth={growth} next={next} t={t} locale={locale} />
            <HighlightsCard
              milestones={milestones}
              q={q}
              t={t}
              locale={locale}
              editable={editable}
            />
            <FunCard birthDate={child.birthDate} q={q} t={t} locale={locale} />
          </div>
          <Feed
            child={child}
            initial={initial}
            filter={filter}
            q={q}
            milestones={milestones}
            months={buildTimeline(
              { milestones, measurements, vaccinations, healthEntries },
              child.id,
              filter,
              locale,
              today,
            )}
            t={t}
            locale={locale}
          />
        </div>
      )}

      {tab === "about" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <AboutSection title={t("child.basics")}>
            <Fact label={t("child.familyName")}>{child.name}</Fact>
            {child.fullName && <Fact label={t("form.fullName")}>{child.fullName}</Fact>}
            {child.englishName && <Fact label={t("form.englishName")}>{child.englishName}</Fact>}
            <Fact label={t("form.sex")}>
              {t(child.sex === "female" ? "common.female" : "common.male")}
            </Fact>
            <Fact label={t("form.birthDate")}>
              {formatDate(child.birthDate, locale)}
              {child.birthTime && ` · ${child.birthTime.slice(0, 5)}`}
            </Fact>
            <Fact label={t("child.age")}>{formatAge(child.birthDate, today, locale)}</Fact>
          </AboutSection>
          <AboutSection title={t("child.health")}>
            {growth.length === 0 ? (
              <p className="body-medium">{t("today.noMeasurements")}</p>
            ) : (
              growth.map((g) => (
                <Fact key={g.indicator} label={t(INDICATORS[g.indicator].labelKey)}>
                  {g.point.estimated ? "≈" : ""}
                  {formatNumber(g.point.value, INDICATORS[g.indicator].digits, locale)}{" "}
                  {INDICATORS[g.indicator].unit}
                  {g.reading && ` · ${g.reading.label}`}
                  {g.reading?.range && (
                    <span className="body-small block text-on-surface-variant">
                      {g.reading.range}
                    </span>
                  )}
                </Fact>
              ))
            )}
            <Link href="/growth" className={BUTTON.text}>
              {t("today.seeChart")}
              <Icon name="chevronRight" size={18} />
            </Link>
          </AboutSection>
          <AboutSection title={t("child.vaccines")}>
            <Fact label={t("child.dosesGiven")}>{vaccinations.length}</Fact>
            <Fact label={t("today.nextAppointment")}>
              {next ? (
                <>
                  {productDiseases(next.productCode, locale)}
                  <span className="body-small block text-on-surface-variant">
                    {productName(next.productCode)} · {t("common.dose", { n: next.doseNo })} ·{" "}
                    {dueLabel(next, locale)}
                  </span>
                </>
              ) : (
                t("today.noAppointments")
              )}
            </Fact>
            <Link href="/vaccines" className={BUTTON.text}>
              {t("today.seeVaccines")}
              <Icon name="chevronRight" size={18} />
            </Link>
          </AboutSection>
          <AboutSection title={t("today.funLabel")}>
            <FunLine birthDate={child.birthDate} t={t} locale={locale} />
            <Link href={`/numerology?${q}`} className={BUTTON.text}>
              {t("numerology.title")}
              <Icon name="chevronRight" size={18} />
            </Link>
          </AboutSection>
        </div>
      )}

      {tab === "milestones" && (
        <section aria-labelledby="all-milestones" className="space-y-3">
          <h2 id="all-milestones" className="title-large">
            {t("child.tabMilestones")}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <li className="editor-only">
              <Link
                href={`/child/milestones/new?${q}`}
                className="state-layer flex h-full min-h-36 flex-col items-center justify-center gap-2 rounded-m3-lg border-2 border-dashed border-outline-variant p-5 text-primary"
              >
                <Icon name="add" size={28} />
                <span className="label-large">{t("milestone.add")}</span>
              </Link>
            </li>
            {milestones.map((m) => (
              <li key={m.id}>
                <MilestoneTile milestone={m} q={q} locale={locale} editable={editable} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function IntroCard({
  child,
  q,
  t,
  locale,
}: {
  child: Child;
  q: string;
  t: Translate;
  locale: Locale;
}) {
  return (
    <Card tone="filled" className="space-y-3 p-5">
      <h2 className="title-large">{t("child.intro")}</h2>
      <ul className="body-medium space-y-2">
        <IntroLine icon="event">
          {child.birthTime
            ? t("settings.childBornAt", {
                date: formatDate(child.birthDate, locale),
                time: child.birthTime.slice(0, 5),
              })
            : t("settings.childBorn", { date: formatDate(child.birthDate, locale) })}
        </IntroLine>
        {child.fullName && (
          <IntroLine>{t("settings.childFullName", { name: child.fullName })}</IntroLine>
        )}
        {child.englishName && (
          <IntroLine>{t("settings.childEnglishName", { name: child.englishName })}</IntroLine>
        )}
      </ul>
      <Link
        href={`/child/edit?${q}`}
        className={`${BUTTON.tonal} editor-only w-full justify-center`}
      >
        {t("settings.editChild")}
      </Link>
    </Card>
  );
}

/** A line of the intro; lines without an icon keep the text aligned with those that have one. */
function IntroLine({ icon, children }: { icon?: IconName; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 w-5 shrink-0 text-on-surface-variant">
        {icon && <Icon name={icon} size={20} />}
      </span>
      <span>{children}</span>
    </li>
  );
}

function NowCard({
  growth,
  next,
  t,
  locale,
}: {
  growth: readonly Growth[];
  next: AppointmentState | undefined;
  t: Translate;
  locale: Locale;
}) {
  return (
    <Card tone="filled" className="space-y-3 p-5">
      <h2 className="title-large">{t("child.now")}</h2>
      {growth.length > 0 && (
        <dl className="grid grid-cols-2 gap-3">
          {growth.map((g) => {
            const info = INDICATORS[g.indicator];
            return (
              <div key={g.indicator} className="rounded-m3-md bg-surface-container-low p-3">
                <dt className="body-small text-on-surface-variant">{t(info.labelKey)}</dt>
                <dd className="title-large tabular-nums">
                  {g.point.estimated ? "≈" : ""}
                  {formatNumber(g.point.value, info.digits, locale)}{" "}
                  <span className="body-small text-on-surface-variant">{info.unit}</span>
                </dd>
                {g.reading && <dd className="body-small">{g.reading.label}</dd>}
              </div>
            );
          })}
        </dl>
      )}
      <div className="body-medium">
        <p className="body-small text-on-surface-variant">{t("today.nextAppointment")}</p>
        {next ? (
          <>
            <p className="title-small">{productDiseases(next.productCode, locale)}</p>
            <p>
              {next.dueOn ? formatDate(next.dueOn, locale) : t("common.noDate")} ·{" "}
              {dueLabel(next, locale)}
            </p>
          </>
        ) : (
          <p>{t("today.noAppointments")}</p>
        )}
      </div>
    </Card>
  );
}

const HIGHLIGHT_TILE =
  "flex aspect-square flex-col justify-between rounded-m3-md bg-tertiary-container p-2 text-on-tertiary-container";

function HighlightsCard({
  milestones,
  q,
  t,
  locale,
  editable,
}: {
  milestones: readonly Milestone[];
  q: string;
  t: Translate;
  locale: Locale;
  editable: boolean;
}) {
  const shown = milestones.slice(0, 6);
  return (
    <Card tone="filled" className="space-y-3 p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="title-large">{t("child.tabMilestones")}</h2>
        {milestones.length > 0 && (
          <Link href={`/child?${q}&tab=milestones`} className="label-large text-primary">
            {t("child.seeAll")}
          </Link>
        )}
      </div>
      {shown.length === 0 ? (
        <p className="body-medium text-on-surface-variant">{t("child.noMilestones")}</p>
      ) : (
        <ul className="grid grid-cols-3 gap-2">
          {shown.map((m) => (
            <li key={m.id}>
              {editable ? (
                <Link
                  href={`/child/milestones/${m.id}/edit?${q}`}
                  className={`state-layer ${HIGHLIGHT_TILE}`}
                >
                  <span className="label-medium">{formatDate(m.happenedOn, locale)}</span>
                  <span className="label-large line-clamp-3">{m.title}</span>
                </Link>
              ) : (
                <div className={HIGHLIGHT_TILE}>
                  <span className="label-medium">{formatDate(m.happenedOn, locale)}</span>
                  <span className="label-large line-clamp-3">{m.title}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function FunCard({
  birthDate,
  q,
  t,
  locale,
}: {
  birthDate: string;
  q: string;
  t: Translate;
  locale: Locale;
}) {
  return (
    <Link
      href={`/numerology?${q}`}
      className="state-layer block rounded-m3-md border border-outline-variant p-4"
    >
      <span className="label-large mb-1 inline-flex h-6 items-center rounded-m3-sm bg-tertiary-container px-2 text-on-tertiary-container">
        {t("today.funLabel")}
      </span>
      <FunLine birthDate={birthDate} t={t} locale={locale} />
    </Link>
  );
}

function FunLine({ birthDate, t, locale }: { birthDate: string; t: Translate; locale: Locale }) {
  const lifePath = lifePathNumber(birthDate);
  return (
    <span className="body-medium block">
      {t("child.lifePath", {
        n: lifePath.value,
        title: MEANINGS[locale][lifePath.value]?.title ?? "",
      })}
    </span>
  );
}

function Feed({
  child,
  initial,
  filter,
  q,
  milestones,
  months,
  t,
  locale,
}: {
  child: Child;
  initial: string;
  filter: TimelineFilter;
  q: string;
  milestones: readonly Milestone[];
  months: ReturnType<typeof buildTimeline>;
  t: Translate;
  locale: Locale;
}) {
  return (
    <section aria-labelledby="timeline" className="min-w-0 space-y-4">
      <h2 id="timeline" className="sr-only">
        {t("timeline.title")}
      </h2>
      {/* Like the box where a post is written: it opens the milestone form. */}
      <Card tone="filled" className="editor-only flex items-center gap-3 p-4">
        <Avatar initial={initial} />
        <Link
          href={`/child/milestones/new?${q}`}
          className="state-layer body-large flex h-11 flex-1 items-center rounded-full bg-surface-container-low px-4 text-on-surface-variant"
        >
          {t("child.composer", { name: child.name })}
        </Link>
      </Card>

      <nav aria-label={t("timeline.filter")} className="flex flex-wrap gap-2">
        {TIMELINE_FILTERS.map((f) => (
          <Link
            key={f}
            href={`/child?${q}${f === "all" ? "" : `&filter=${f}`}`}
            aria-current={f === filter ? "page" : undefined}
            className="state-layer label-large inline-flex h-8 items-center rounded-m3-sm border border-outline-variant px-3 text-on-surface-variant aria-[current=page]:border-transparent aria-[current=page]:bg-secondary-container aria-[current=page]:text-on-secondary-container"
          >
            {t(FILTER_LABELS[f])}
          </Link>
        ))}
      </nav>

      {milestones.length === 0 && (filter === "all" || filter === "milestone") && (
        <Card tone="outlined" className="p-5">
          <p className="body-medium">{t("timeline.firstMilestone")}</p>
        </Card>
      )}

      {months.length === 0 ? (
        <p className="body-medium text-on-surface-variant">{t("timeline.empty")}</p>
      ) : (
        months.map((month) => (
          <section key={month.month} aria-labelledby={`m-${month.month}`} className="space-y-3">
            <h3
              id={`m-${month.month}`}
              className="title-small flex items-center gap-3 text-on-surface-variant after:h-px after:flex-1 after:bg-outline-variant"
            >
              {formatMonth(month.month, locale)}
            </h3>
            <ol className="space-y-3">
              {month.events.map((e) => (
                <li key={e.id}>
                  <Post event={e} child={child} initial={initial} t={t} locale={locale} />
                </li>
              ))}
            </ol>
          </section>
        ))
      )}
    </section>
  );
}

function Avatar({ initial }: { initial: string }) {
  return (
    <span
      aria-hidden="true"
      className="title-medium flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary"
    >
      {initial}
    </span>
  );
}

const POST_LABELS: Record<TimelineKind, MessageKey> = {
  milestone: "child.postMilestone",
  health: "child.postHealth",
  measurement: "child.postMeasurement",
  dose: "child.postDose",
};

/** One event as a post: who and when on top, then what happened. */
function Post({
  event,
  child,
  initial,
  t,
  locale,
}: {
  event: TimelineEvent;
  child: Child;
  initial: string;
  t: Translate;
  locale: Locale;
}) {
  const isMilestone = event.kind === "milestone";
  return (
    <Card tone={isMilestone ? "filled" : "low"} className="space-y-3 p-4">
      <div className="flex items-center gap-3">
        <Avatar initial={initial} />
        <div className="min-w-0 flex-1">
          <p className="title-small">
            {child.name}{" "}
            <span className="body-medium text-on-surface-variant">
              {t(POST_LABELS[event.kind])}
            </span>
          </p>
          <p className="body-small tabular-nums text-on-surface-variant">
            {formatDate(event.date, locale)}
            {event.milestoneKind && ` · ${milestoneKindLabel(event.milestoneKind, locale)}`}
          </p>
        </div>
        {event.href && (
          <Link
            href={event.href}
            aria-label={t(event.kind === "health" ? "health.editEntry" : "milestone.edit")}
            className="editor-only state-layer inline-flex size-10 items-center justify-center rounded-full text-on-surface-variant"
          >
            <Icon name="edit" size={18} />
          </Link>
        )}
      </div>
      <div
        className={`flex items-start gap-3 rounded-m3-md p-3 ${isMilestone ? "bg-tertiary-container text-on-tertiary-container" : "bg-surface-container-highest"}`}
      >
        <Icon name={KIND_ICON[event.kind]} size={22} />
        <div className="min-w-0">
          {/* A measurement's header already says it was measured: the values are the news. */}
          {event.kind === "measurement" ? (
            <p className="title-medium tabular-nums">{event.detail}</p>
          ) : (
            <>
              <p className={isMilestone ? "title-large" : "title-medium"}>{event.title}</p>
              {event.detail && <p className="body-medium">{event.detail}</p>}
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

function MilestoneTile({
  milestone,
  q,
  locale,
  editable,
}: {
  milestone: Milestone;
  q: string;
  locale: Locale;
  /** Opens the edit form; a plain tile for viewers. */
  editable: boolean;
}) {
  const className =
    "flex h-full min-h-36 flex-col gap-2 rounded-m3-lg bg-tertiary-container p-5 text-on-tertiary-container";
  const content = (
    <>
      <span className="label-medium">
        {formatDate(milestone.happenedOn, locale)} · {milestoneKindLabel(milestone.kind, locale)}
      </span>
      <span className="title-large">{milestone.title}</span>
      {milestone.note && <span className="body-medium">{milestone.note}</span>}
    </>
  );
  return editable ? (
    <Link
      href={`/child/milestones/${milestone.id}/edit?${q}`}
      className={`state-layer ${className}`}
    >
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

function AboutSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card tone="filled" className="space-y-3 p-5">
      <h2 className="title-large">{title}</h2>
      <div className="space-y-3">{children}</div>
    </Card>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="body-small text-on-surface-variant">{label}</p>
      <div className="body-large">{children}</div>
    </div>
  );
}
