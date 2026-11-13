import { DISEASES, type DiseaseCode, TCMR_SOURCE, tcmrOverview } from "@notch/vaccines";

import { ageInMonths, formatDate } from "../lib/format";
import type { Locale, Translate } from "../lib/i18n/messages";
import { Icon } from "./icons";
import { Card } from "./ui";

/**
 * The national schedule (TCMR) by age, next to the doses recorded per disease. Folded by
 * default: the summary line says how many doses due by the child's age are recorded.
 */
export function TcmrCard({
  dosesPerDisease,
  birthDate,
  today,
  t,
  locale,
}: {
  dosesPerDisease: ReadonlyMap<DiseaseCode, number>;
  birthDate: string;
  today: string;
  t: Translate;
  locale: Locale;
}) {
  const groups = tcmrOverview(dosesPerDisease, ageInMonths(birthDate, today));
  const dueRows = groups.filter((g) => g.reached).flatMap((g) => g.rows);
  const disease = (code: DiseaseCode) =>
    DISEASES.find((d) => d.code === code)?.name[locale] ?? code;
  const age = (months: number) =>
    months === 0
      ? t("tcmr.atBirth")
      : months < 24
        ? t("tcmr.months", { n: months })
        : t("tcmr.years", { n: months / 12 });

  return (
    <Card className="p-0">
      <div className="px-4 pt-4 pb-2">
        <h2 className="title-medium">{t("tcmr.title")}</h2>
        <p className="body-small mt-1 text-on-surface-variant">{t("tcmr.intro")}</p>
      </div>
      <details className="border-t border-outline-variant">
        <summary className="body-medium cursor-pointer px-4 py-3 text-on-surface-variant">
          {t("tcmr.summary", {
            done: dueRows.filter((r) => r.recorded).length,
            due: dueRows.length,
          })}
        </summary>
        <ol className="divide-y divide-outline-variant">
          {groups.map((group) => (
            <li
              key={group.ageMonths}
              className="grid gap-x-4 gap-y-2 px-4 py-3 sm:grid-cols-[10rem_1fr]"
            >
              <p className="title-small">
                {age(group.ageMonths)}
                {group.reached && (
                  <span className="body-small block font-normal text-on-surface-variant">
                    {t("tcmr.reached")}
                  </span>
                )}
              </p>
              <ul className="space-y-2">
                {group.rows.map((row) => (
                  <li key={`${row.disease}-${String(row.doseNo)}`} className="flex gap-2">
                    <span className={row.recorded ? "text-success" : "text-outline"}>
                      <Icon
                        name={row.recorded ? "check" : "pending"}
                        size={20}
                        label={row.recorded ? t("tcmr.recorded") : t("tcmr.notRecorded")}
                      />
                    </span>
                    <span>
                      <span className="body-large">
                        {disease(row.disease)} · {t("common.dose", { n: row.doseNo })}
                      </span>
                      <span className="body-small block text-on-surface-variant">
                        {row.vaccine[locale]}
                        {row.timing ? ` · ${row.timing[locale]}` : ""}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
        <p className="body-small border-t border-outline-variant px-4 py-3 text-on-surface-variant">
          {t("tcmr.source", {
            document: TCMR_SOURCE.document,
            issuer: TCMR_SOURCE.issuer,
            date: formatDate(TCMR_SOURCE.effectiveOn, locale),
          })}
        </p>
      </details>
    </Card>
  );
}
