import type { Metadata } from "next";
import Link from "next/link";

import { BUTTON } from "../../components/button-styles";
import { Icon } from "../../components/icons";
import { type CardMotifProps } from "../../components/Motifs";
import { Card, NoChild, NoDatabase } from "../../components/ui";
import { getCurrentChild } from "../../lib/child";
import { getDb } from "../../lib/db";
import { formatDate } from "../../lib/format";
import type { MessageKey, Translate } from "../../lib/i18n/messages";
import { getI18n } from "../../lib/i18n/server";
import {
  birthdayNumber,
  expressionNumber,
  lifePathNumber,
  type NumberReading,
} from "../../lib/numerology";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("numerology.title") };
}
export const dynamic = "force-dynamic";

/** Name and short text of each number, 1–9 and the master numbers. */
const MEANINGS: Record<number, readonly [MessageKey, MessageKey]> = {
  1: ["numerology.n1", "numerology.n1Text"],
  2: ["numerology.n2", "numerology.n2Text"],
  3: ["numerology.n3", "numerology.n3Text"],
  4: ["numerology.n4", "numerology.n4Text"],
  5: ["numerology.n5", "numerology.n5Text"],
  6: ["numerology.n6", "numerology.n6Text"],
  7: ["numerology.n7", "numerology.n7Text"],
  8: ["numerology.n8", "numerology.n8Text"],
  9: ["numerology.n9", "numerology.n9Text"],
  11: ["numerology.n11", "numerology.n11Text"],
  22: ["numerology.n22", "numerology.n22Text"],
  33: ["numerology.n33", "numerology.n33Text"],
};

interface Props {
  readonly searchParams: Promise<{ child?: string | string[] }>;
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

  const day = Number(child.birthDate.slice(8, 10));
  // The expression number goes with the birth-certificate name; the family's name stands in.
  const expressionName = child.fullName ?? child.name;
  const cards = [
    {
      key: "lifePath",
      title: t("numerology.lifePath"),
      from: t("numerology.lifePathFrom", { date: formatDate(child.birthDate, locale) }),
      reading: lifePathNumber(child.birthDate),
      motif: { kind: "heart", place: "topRight", tilt: 12 },
    },
    {
      key: "expression",
      title: t("numerology.expression"),
      from: t("numerology.expressionFrom", { name: expressionName }),
      reading: expressionNumber(expressionName),
      motif: { kind: "bloom", place: "bottomRight", tilt: -8 },
    },
    {
      key: "birthday",
      title: t("numerology.birthday"),
      from: t("numerology.birthdayFrom", { day }),
      reading: birthdayNumber(child.birthDate),
      motif: { kind: "petals", place: "right" },
    },
    ...(child.englishName
      ? [
          {
            key: "english",
            title: t("numerology.englishName"),
            from: t("numerology.englishFrom", { name: child.englishName }),
            reading: expressionNumber(child.englishName),
            motif: { kind: "bud", place: "bottomRight", tilt: 10 } as const,
          },
        ]
      : []),
  ] satisfies readonly {
    key: string;
    title: string;
    from: string;
    reading: NumberReading | undefined;
    motif: CardMotifProps;
  }[];

  return (
    <div className="space-y-6 pt-2">
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

      <div
        className={`grid gap-3 ${cards.length === 4 ? "md:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-3"}`}
      >
        {cards.map(({ key, ...card }) => (
          <NumberCard key={key} {...card} t={t} />
        ))}
      </div>

      <p className="body-small text-on-surface-variant">{t("numerology.method")}</p>
    </div>
  );
}

function NumberCard({
  title,
  from,
  reading,
  motif,
  t,
}: {
  title: string;
  from: string;
  reading: NumberReading | undefined;
  motif: CardMotifProps;
  t: Translate;
}) {
  const meaning = reading ? MEANINGS[reading.value] : undefined;
  return (
    <Card tone="filled" motif={motif} className="flex flex-col gap-2 p-5">
      <h2 className="title-small text-on-surface-variant">{title}</h2>
      {reading && meaning ? (
        <>
          <p className="display-medium tabular-nums">{reading.value}</p>
          <p className="title-medium">{t(meaning[0])}</p>
          <p className="body-medium">{t(meaning[1])}</p>
          <p className="body-small mt-auto pt-2 text-on-surface-variant">
            {from}
            <span className="block tabular-nums">{reading.working}</span>
          </p>
        </>
      ) : (
        <p className="body-medium">{t("numerology.noName")}</p>
      )}
    </Card>
  );
}
