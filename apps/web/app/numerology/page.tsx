import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { BUTTON } from "../../components/button-styles";
import { ChartSwitch } from "../../components/ChartSwitch";
import { Icon } from "../../components/icons";
import { type CardMotifProps } from "../../components/Motifs";
import { Card, NoChild, NoDatabase } from "../../components/ui";
import { getCurrentChild } from "../../lib/child";
import { getDb } from "../../lib/db";
import { formatDate, todayInVietnam } from "../../lib/format";
import type { Locale, Translate } from "../../lib/i18n/messages";
import { getI18n } from "../../lib/i18n/server";
import {
  type ArrowKey,
  attitudeNumber,
  birthChart,
  addedByName,
  birthdayNumber,
  type BirthChart,
  combinedChart,
  countBucket,
  dominantDigits,
  expressionNumber,
  lifePathNumber,
  maturityNumber,
  type NumberReading,
  personalityNumber,
  personalYearNumber,
  type PlaneKey,
  pinnacles,
  planeTotals,
  soulUrgeNumber,
} from "../../lib/numerology";
import {
  ARROW_MEANINGS,
  CELL_MEANINGS,
  CENTER_FIVE,
  MEANINGS,
  MISSING_MEANINGS,
  PLANE_MEANINGS,
  YEAR_THEMES,
} from "../../lib/numerology-content";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("numerology.title") };
}
export const dynamic = "force-dynamic";

interface Props {
  readonly searchParams: Promise<{ child?: string | string[] }>;
}

/** The 3×3 birth chart, top row first, as numerologists draw it. */
const CHART_ROWS = [
  [3, 6, 9],
  [2, 5, 8],
  [1, 4, 7],
] as const;

interface SmallCard {
  readonly key: string;
  readonly title: string;
  readonly about: string;
  readonly from: string;
  readonly reading: NumberReading | undefined;
  /** A theme replaces the number's meaning, for the personal year. */
  readonly theme?: string;
  readonly wide?: boolean;
}

/**
 * Numerology of the selected child, just for fun: reached from a small card at the end of
 * Today, never from the navigation or the PDF, and said to have no scientific basis.
 */
export default async function NumerologyPage({ searchParams }: Props) {
  const params = await searchParams;
  const { t, locale } = await getI18n();
  const db = getDb();
  if (!db) return <NoDatabase />;
  const { child } = await getCurrentChild(db, params.child);
  if (!child) return <NoChild />;

  const today = todayInVietnam();
  const year = Number(today.slice(0, 4));
  const age = ageInYears(child.birthDate, today);
  // The name numbers go with the birth-certificate name; the family's name stands in.
  const name = child.fullName ?? child.name;
  const lifePath = lifePathNumber(child.birthDate);
  const expression = expressionNumber(name);
  const chart = birthChart(child.birthDate);
  const combined = combinedChart(child.birthDate, name);
  const added = addedByName(chart, combined);
  const peaks = pinnacles(child.birthDate);

  const others: SmallCard[] = [
    {
      key: "expression",
      title: t("numerology.expression"),
      about: t("numerology.expressionAbout"),
      from: t("numerology.expressionFrom", { name }),
      reading: expression,
    },
    {
      key: "soul",
      title: t("numerology.soulUrge"),
      about: t("numerology.soulUrgeAbout"),
      from: t("numerology.soulUrgeFrom", { name }),
      reading: soulUrgeNumber(name),
    },
    {
      key: "personality",
      title: t("numerology.personality"),
      about: t("numerology.personalityAbout"),
      from: t("numerology.personalityFrom", { name }),
      reading: personalityNumber(name),
    },
    {
      key: "attitude",
      title: t("numerology.attitude"),
      about: t("numerology.attitudeAbout"),
      from: t("numerology.attitudeFrom"),
      reading: attitudeNumber(child.birthDate),
    },
    {
      key: "birthday",
      title: t("numerology.birthday"),
      about: t("numerology.birthdayAbout"),
      from: t("numerology.birthdayFrom", { day: Number(child.birthDate.slice(8, 10)) }),
      reading: birthdayNumber(child.birthDate),
    },
    {
      key: "maturity",
      title: t("numerology.maturity"),
      about: t("numerology.maturityAbout"),
      from: t("numerology.maturityFrom"),
      reading: expression ? maturityNumber(lifePath, expression) : undefined,
    },
    ...(child.englishName
      ? [
          {
            key: "english",
            title: t("numerology.englishName"),
            about: t("numerology.englishAbout"),
            from: t("numerology.englishFrom", { name: child.englishName }),
            reading: expressionNumber(child.englishName),
          },
        ]
      : []),
  ];
  const yearReading = personalYearNumber(child.birthDate, year);
  others.push({
    key: "year",
    title: t("numerology.personalYear", { year }),
    about: "",
    from: t("numerology.personalYearFrom", { year }),
    reading: yearReading,
    theme: YEAR_THEMES[locale][yearReading.value],
    // Seven cards fill two rows of four only if this one takes two places.
    wide: others.length === 6,
  });

  return (
    <div className="space-y-8 pt-2">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-large mb-2 inline-flex h-7 items-center rounded-m3-sm bg-tertiary-container px-3 text-on-tertiary-container">
            {t("numerology.forFun")}
          </p>
          <h1 className="headline-medium">{t("numerology.heading", { name: child.name })}</h1>
        </div>
        <Link href="/" className={BUTTON.text}>
          <Icon name="back" size={18} />
          {t("nav.today")}
        </Link>
      </header>

      <p className="body-medium rounded-m3-md border border-outline-variant p-4 text-on-surface-variant">
        {t("numerology.disclaimer")}
      </p>

      {!child.fullName && (
        <p className="body-medium flex flex-wrap items-center gap-x-3 gap-y-1">
          {t("numerology.fullNameMissing", { name: child.name })}
          <Link
            href={`/child/edit?child=${child.id}`}
            className="label-large text-primary underline"
          >
            {t("numerology.addFullName")}
          </Link>
        </p>
      )}

      <section aria-labelledby="main-number" className="space-y-3">
        <h2 id="main-number" className="title-large">
          {t("numerology.sectionMain")}
        </h2>
        <MainCard
          reading={lifePath}
          from={t("numerology.lifePathFrom", { date: formatDate(child.birthDate, locale) })}
          t={t}
          locale={locale}
        />
      </section>

      <section aria-labelledby="other-numbers" className="space-y-3">
        <h2 id="other-numbers" className="title-large">
          {t("numerology.sectionOthers")}
        </h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {others.map((card) => (
            <NumberCard key={card.key} card={card} t={t} locale={locale} />
          ))}
        </div>
      </section>

      <section aria-labelledby="birth-chart" className="space-y-3">
        <h2 id="birth-chart" className="title-large">
          {t("numerology.sectionChart")}
        </h2>
        <p className="body-medium text-on-surface-variant">{t("numerology.chartIntro")}</p>
        <ChartSwitch
          legend={t("numerology.chartSwitch")}
          options={[
            {
              value: "date",
              label: t("numerology.chartDate"),
              panel: <ChartPanel chart={chart} t={t} locale={locale} />,
            },
            {
              value: "combined",
              // Short, so the switch stays on one line on a phone; the name shows below.
              label: t("numerology.chartCombinedShort"),
              panel: (
                <div className="space-y-3">
                  <NameAdds added={added} combined={combined} name={name} t={t} locale={locale} />
                  <ChartPanel chart={combined} t={t} locale={locale} />
                </div>
              ),
            },
          ]}
        />
      </section>

      <section aria-labelledby="pinnacles" className="space-y-3">
        <h2 id="pinnacles" className="title-large">
          {t("numerology.sectionPinnacles")}
        </h2>
        <p className="body-medium text-on-surface-variant">
          {t("numerology.pinnaclesIntro", { age: peaks[0]?.toAge ?? 0 })}
        </p>
        <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {peaks.map((p) => {
            const now = age >= p.fromAge && (p.toAge === null || age <= p.toAge);
            const meaning = MEANINGS[locale][p.reading.value];
            return (
              <li key={p.fromAge}>
                <Card tone={now ? "primary" : "filled"} className="flex h-full flex-col gap-1 p-5">
                  <p className="title-small flex items-center justify-between gap-2">
                    {p.toAge === null
                      ? t("numerology.pinnacleFromAge", { from: p.fromAge })
                      : t("numerology.pinnacleAges", { from: p.fromAge, to: p.toAge })}
                    {now && (
                      <span className="label-medium rounded-m3-sm bg-primary px-2 py-0.5 text-on-primary">
                        {t("numerology.pinnacleNow")}
                      </span>
                    )}
                  </p>
                  <p className="display-small tabular-nums">{p.reading.value}</p>
                  {meaning && (
                    <>
                      <p className="title-medium">{meaning.title}</p>
                      <p className="body-medium">{meaning.summary}</p>
                    </>
                  )}
                  <p className="body-small mt-auto pt-2 tabular-nums opacity-80">
                    {p.reading.working}
                  </p>
                </Card>
              </li>
            );
          })}
        </ol>
      </section>

      <p className="body-small text-on-surface-variant">{t("numerology.method")}</p>
    </div>
  );
}

/** Whole years between two ISO dates. */
function ageInYears(birthDate: string, today: string): number {
  const years = Number(today.slice(0, 4)) - Number(birthDate.slice(0, 4));
  return today.slice(5) < birthDate.slice(5) ? years - 1 : years;
}

const MAIN_MOTIF: CardMotifProps = { kind: "bloom", place: "topRight", tilt: 10 };

/** The life path number, with everything said about it. */
function MainCard({
  reading,
  from,
  t,
  locale,
}: {
  reading: NumberReading;
  from: string;
  t: Translate;
  locale: Locale;
}) {
  const meaning = MEANINGS[locale][reading.value];
  if (!meaning) return null;
  return (
    <Card tone="filled" motif={MAIN_MOTIF} className="space-y-5 p-6">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
        <p className="display-medium tabular-nums">{reading.value}</p>
        <div>
          <p className="headline-small">{meaning.title}</p>
          <p className="body-large">{meaning.summary}</p>
        </div>
      </div>
      <p className="body-medium text-on-surface-variant">{t("numerology.lifePathAbout")}</p>
      <div className="grid gap-4 md:grid-cols-3">
        <Traits title={t("numerology.strengths")} items={meaning.strengths} />
        <Traits title={t("numerology.nurture")} items={meaning.nurture} />
        <Traits title={t("numerology.parents")} items={meaning.parents} />
      </div>
      <p className="body-small text-on-surface-variant">
        {from}
        <span className="block tabular-nums">{reading.working}</span>
      </p>
    </Card>
  );
}

function Traits({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <div>
      <h3 className="title-small mb-1">{title}</h3>
      <ul className="body-medium list-disc space-y-1 pl-5">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function NumberCard({ card, t, locale }: { card: SmallCard; t: Translate; locale: Locale }) {
  const meaning = card.reading ? MEANINGS[locale][card.reading.value] : undefined;
  return (
    <Card tone="filled" className={`flex flex-col gap-2 p-5 ${card.wide ? "md:col-span-2" : ""}`}>
      <h3 className="title-small">{card.title}</h3>
      {card.about && <p className="body-small text-on-surface-variant">{card.about}</p>}
      {card.reading && meaning ? (
        <>
          <p className="display-small tabular-nums">{card.reading.value}</p>
          {card.theme ? (
            <p className="body-medium">{card.theme}</p>
          ) : (
            <>
              <p className="title-medium">{meaning.title}</p>
              <p className="body-medium">{meaning.summary}</p>
              <p className="body-small text-on-surface-variant">
                {t("numerology.strengths")}: {meaning.strengths.join(", ").toLowerCase()}
              </p>
            </>
          )}
          <p className="body-small mt-auto pt-2 text-on-surface-variant">
            {card.from}
            <span className="block tabular-nums">{card.reading.working}</span>
          </p>
        </>
      ) : (
        <p className="body-medium">{t("numerology.noName")}</p>
      )}
    </Card>
  );
}

const PLANE_GROUPS: readonly (readonly PlaneKey[])[] = [
  ["rowMind", "rowHeart", "rowBody"],
  ["colThought", "colWill", "colAction"],
];

/**
 * One chart, read for a parent: the grid and a summary first, then the arrows next to the
 * rows and columns, then every digit 1–9 with what it says, present or empty.
 */
function ChartPanel({ chart, t, locale }: { chart: BirthChart; t: Translate; locale: Locale }) {
  const dominant = dominantDigits(chart);
  const planes = planeTotals(chart);
  const max = Math.max(1, ...Object.values(planes.totals));
  const strongest = [...planes.topRows, ...planes.topCols];
  const hasFive = (chart.counts[5] ?? 0) > 0;
  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-[auto_1fr]">
        <Card tone="filled" className="flex justify-center p-5">
          <table className="border-collapse self-start" aria-label={t("numerology.chartGrid")}>
            <tbody>
              {CHART_ROWS.map((row) => (
                <tr key={row[0]}>
                  {row.map((digit) => {
                    const count = chart.counts[digit] ?? 0;
                    return (
                      <td
                        key={digit}
                        className={`title-medium size-20 border border-outline-variant text-center tabular-nums ${count === 0 ? "text-outline" : ""}`}
                      >
                        {count === 0 ? "·" : String(digit).repeat(count)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card tone="filled" className="p-5">
          <h3 className="title-medium mb-3">{t("numerology.summary")}</h3>
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <Fact label={t("numerology.dominant")}>
              {dominant.length === 0
                ? t("numerology.noDominant")
                : dominant
                    .map(
                      (d) =>
                        `${String(d).repeat(chart.counts[d] ?? 0)}: ${CELL_MEANINGS[locale][d]?.[countBucket(chart.counts[d] ?? 0)] ?? ""}`,
                    )
                    .join(" ")}
            </Fact>
            <Fact label={t("numerology.tendency")}>
              {strongest.length === 0
                ? t("numerology.arrowsNone")
                : strongest.map((k) => PLANE_MEANINGS[locale][k].strong).join(" ")}
            </Fact>
            <Fact label={t("numerology.center")}>
              {hasFive ? CENTER_FIVE[locale].present : CENTER_FIVE[locale].absent}
            </Fact>
            <Fact label={t("numerology.arrows")}>
              {t("numerology.arrowsCount", { full: chart.full.length, empty: chart.empty.length })}
              {chart.missing.length > 0 && (
                <span className="block text-on-surface-variant">
                  {t("numerology.missing", { digits: chart.missing.join(", ") })}
                </span>
              )}
            </Fact>
          </dl>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card tone="filled" className="grid gap-4 p-5 sm:grid-cols-2">
          <ArrowList
            title={t("numerology.arrowsFull")}
            keys={chart.full}
            text={(k) => ARROW_MEANINGS[locale][k].full}
            locale={locale}
            none={t("numerology.arrowsNone")}
          />
          <ArrowList
            title={t("numerology.arrowsEmpty")}
            keys={chart.empty}
            text={(k) => ARROW_MEANINGS[locale][k].empty}
            locale={locale}
            none={t("numerology.arrowsNone")}
          />
        </Card>
        <Card tone="filled" className="space-y-4 p-5">
          <h3 className="title-small">{t("numerology.planes")}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {PLANE_GROUPS.map((group) => (
              <ul key={group[0]} className="space-y-2">
                {group.map((k) => (
                  <li key={k} className="body-small space-y-1">
                    <span className="flex justify-between gap-2">
                      <span className={strongest.includes(k) ? "font-medium" : ""}>
                        {PLANE_MEANINGS[locale][k].name}
                      </span>
                      <span className="tabular-nums text-on-surface-variant">
                        {t("numerology.planesCount", { n: planes.totals[k] })}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="block h-2 rounded-full bg-surface-container-low"
                    >
                      <span
                        className="block h-2 rounded-full bg-primary"
                        style={{ width: `${String((planes.totals[k] / max) * 100)}%` }}
                      />
                    </span>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </Card>
      </div>

      <Card tone="filled" className="p-5">
        <h3 className="title-small mb-3">{t("numerology.cells")}</h3>
        <ul className="grid gap-x-6 gap-y-3 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => {
            const count = chart.counts[d] ?? 0;
            return (
              <li key={d} className="flex gap-3">
                <span
                  className={`label-large inline-flex h-8 min-w-12 shrink-0 items-center justify-center rounded-m3-sm px-2 tabular-nums ${count === 0 ? "border border-dashed border-outline text-on-surface-variant" : "bg-secondary-container text-on-secondary-container"}`}
                >
                  {count === 0 ? String(d) : String(d).repeat(count)}
                </span>
                <span className="body-medium">
                  <span className="block text-on-surface-variant">
                    {count === 0
                      ? t("numerology.cellEmpty")
                      : t("numerology.cellTimes", { n: count })}
                  </span>
                  {count === 0
                    ? MISSING_MEANINGS[locale][d]
                    : CELL_MEANINGS[locale][d]?.[countBucket(count)]}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="title-small">{label}</dt>
      <dd className="body-medium">{children}</dd>
    </div>
  );
}

/** What the full name adds to the birth date: the digits it fills in, the arrows it completes. */
function NameAdds({
  added,
  combined,
  name,
  t,
  locale,
}: {
  added: { readonly digits: readonly number[]; readonly arrows: readonly ArrowKey[] };
  combined: BirthChart;
  name: string;
  t: Translate;
  locale: Locale;
}) {
  return (
    <Card tone="outlined" className="space-y-3 p-5">
      <h3 className="title-medium">{t("numerology.compare")}</h3>
      <p className="body-medium text-on-surface-variant">
        {t("numerology.compareIntro", { name })}
      </p>
      {added.digits.length === 0 && added.arrows.length === 0 ? (
        <p className="body-medium">{t("numerology.compareNone")}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {added.digits.length > 0 && (
            <div>
              <h4 className="title-small mb-2">{t("numerology.compareDigits")}</h4>
              <ul className="space-y-1">
                {added.digits.map((d) => (
                  <li key={d} className="body-medium">
                    <span className="font-medium tabular-nums">{d}</span>:{" "}
                    {CELL_MEANINGS[locale][d]?.[countBucket(combined.counts[d] ?? 1)]}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {added.arrows.length > 0 && (
            <div>
              <h4 className="title-small mb-2">{t("numerology.compareArrows")}</h4>
              <ul className="space-y-1">
                {added.arrows.map((k) => (
                  <li key={k} className="body-medium">
                    <span className="font-medium">{ARROW_MEANINGS[locale][k].name}</span>:{" "}
                    {ARROW_MEANINGS[locale][k].full}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function ArrowList({
  title,
  keys,
  text,
  locale,
  none,
}: {
  title: string;
  keys: readonly ArrowKey[];
  text: (key: ArrowKey) => string;
  locale: Locale;
  none: string;
}) {
  return (
    <div>
      <h3 className="title-small mb-2">{title}</h3>
      {keys.length === 0 ? (
        <p className="body-medium text-on-surface-variant">{none}</p>
      ) : (
        <ul className="space-y-2">
          {keys.map((k) => (
            <li key={k}>
              <p className="body-medium font-medium">{ARROW_MEANINGS[locale][k].name}</p>
              <p className="body-medium text-on-surface-variant">{text(k)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
