"use client";

import type { HealthEntry, Temperature } from "@notch/db";
import { useActionState } from "react";

import { saveTemperatureAction } from "../../app/actions";
import { formatNumber } from "../../lib/format";
import { fieldValue, type FormState } from "../../lib/form-values";
import { vietnamDateTime } from "../../lib/health-view";
import { useI18n } from "../../lib/i18n/client";
import {
  DateField,
  DecimalField,
  FormMessage,
  NoteField,
  SelectField,
  SubmitButton,
  TimeField,
} from "./fields";

/**
 * One temperature reading: day and time in Vietnam, degrees Celsius, and the entry it belongs
 * to, such as the illness it was taken during.
 */
export function TemperatureForm({
  childId,
  now,
  birthDate,
  entries,
  reading,
  entryId,
}: {
  childId: string;
  /** The moment the page was made, ISO, to prefill the date and time. */
  now: string;
  birthDate: string;
  /** The child's entries a reading can belong to, ongoing first. */
  entries: readonly HealthEntry[];
  reading?: Temperature;
  /** Preselected entry, when the form is opened from one. */
  entryId?: string;
}) {
  const [state, action] = useActionState<FormState, FormData>(saveTemperatureAction, {});
  const { t, locale } = useI18n();
  const v = (name: string, stored: string | null | undefined) =>
    fieldValue(state, name, stored ?? "");
  const at = vietnamDateTime(reading ? reading.measuredAt : new Date(now));
  const entry = v(
    "healthEntryId",
    reading ? (reading.healthEntryId ?? "none") : (entryId ?? "none"),
  );

  return (
    <form action={action} className="space-y-6" noValidate>
      <input type="hidden" name="childId" value={childId} />
      {reading && <input type="hidden" name="id" value={reading.id} />}
      <FormMessage message={state.message} />
      <div className="field-row sm:grid-cols-3">
        <DecimalField
          label={t("form.temperature")}
          name="temperature"
          defaultValue={v(
            "temperature",
            reading ? formatNumber(reading.tenthsC / 10, 1, locale) : undefined,
          )}
          error={state.errors?.temperature}
          placeholder={t("form.temperatureHint")}
          required
        />
        <DateField
          label={t("form.measuredOn")}
          name="measuredOn"
          min={birthDate}
          max={vietnamDateTime(new Date(now)).date}
          defaultValue={v("measuredOn", at.date)}
          error={state.errors?.measuredOn}
          required
        />
        <TimeField
          label={t("form.measuredTime")}
          name="measuredTime"
          defaultValue={v("measuredTime", at.time)}
          error={state.errors?.measuredTime}
          required
        />
      </div>
      {entries.length > 0 && (
        <SelectField
          key={entry}
          label={t("form.healthEntryOptional")}
          name="healthEntryId"
          items={[
            { id: "none", name: t("form.noHealthEntry") },
            ...entries.map((e) => ({ id: e.id, name: e.title })),
          ]}
          defaultValue={entry}
          error={state.errors?.healthEntryId}
        />
      )}
      <NoteField
        label={t("common.note")}
        hint={t("common.optional")}
        name="note"
        maxLength={500}
        defaultValue={v("note", reading?.note)}
      />
      <SubmitButton>{t(reading ? "health.saveTemperature" : "health.addTemperature")}</SubmitButton>
    </form>
  );
}
