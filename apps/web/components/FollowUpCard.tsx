import type { Child } from "@notch/db";
import Link from "next/link";

import { formatDate } from "../lib/format";
import {
  formatDateTime,
  formatTemperature,
  LEVEL_TONE,
  temperatureAdvice,
  temperatureLevel,
  temperatureLevelLabel,
  vietnamDateTime,
} from "../lib/health-view";
import type { Locale, Translate } from "../lib/i18n/messages";
import type { FollowUp } from "../lib/vaccine-follow-up";
import { productName } from "../lib/vaccines-view";
import { BUTTON } from "./button-styles";
import { Icon } from "./icons";
import { Badge, Card } from "./ui";

/**
 * The days after a vaccine: what was given, the readings since, what is common and when to
 * see a doctor. It records and reminds; it never diagnoses a reaction.
 */
export function FollowUpCard({
  followUp,
  child,
  t,
  locale,
  className = "",
}: {
  followUp: FollowUp;
  child: Child;
  t: Translate;
  locale: Locale;
  className?: string;
}) {
  const when =
    followUp.day === 0
      ? t("followUp.today")
      : followUp.day === 1
        ? t("followUp.yesterday")
        : t("followUp.on", { date: formatDate(followUp.givenOn, locale) });
  const vaccines = [...new Set(followUp.doses.map((d) => productName(d.productCode)))].join(", ");
  const latest = followUp.readings[0];
  const advice =
    latest &&
    temperatureAdvice(
      latest.tenthsC,
      child.birthDate,
      vietnamDateTime(latest.measuredAt).date,
      locale,
    );

  return (
    <Card tone="primary" className={`flex flex-col gap-3 p-5 ${className}`}>
      <h2 className="title-small flex items-center gap-2">
        <Icon name="thermostat" size={20} />
        {t("followUp.title")}
      </h2>
      <p className="title-medium">{t("followUp.given", { name: child.name, vaccines, when })}</p>
      <p className="body-medium">{t("followUp.guidance")}</p>
      <div className="rounded-m3-md bg-surface/60 p-3 text-on-surface">
        {followUp.readings.length === 0 ? (
          <p className="body-medium text-on-surface-variant">{t("followUp.noReadings")}</p>
        ) : (
          <>
            <p className="label-large mb-1 text-on-surface-variant">{t("followUp.readings")}</p>
            <ul className="space-y-1">
              {followUp.readings.slice(0, 3).map((r) => {
                const level = temperatureLevel(r.tenthsC);
                return (
                  <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="title-medium tabular-nums">
                      {formatTemperature(r.tenthsC, locale)}
                    </span>
                    <Badge tone={LEVEL_TONE[level]}>{temperatureLevelLabel(level, locale)}</Badge>
                    <span className="body-small tabular-nums text-on-surface-variant">
                      {formatDateTime(r.measuredAt, locale)}
                    </span>
                  </li>
                );
              })}
            </ul>
            {advice && <p className="body-medium mt-2">{advice}</p>}
          </>
        )}
      </div>
      <p className="body-small">{t("followUp.warning")}</p>
      <Link className={`${BUTTON.filled} w-fit`} href={`/health/temperature/new?child=${child.id}`}>
        <Icon name="thermostat" size={18} />
        {t("health.addTemperature")}
      </Link>
    </Card>
  );
}
