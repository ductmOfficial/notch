"use client";

import type { Measurement } from "@notch/db";
import Link from "next/link";
import { useActionState } from "react";
import { useI18n } from "../../lib/i18n/client";

import { saveMeasurementAction } from "../../app/actions";
import { fieldValue, type FormState } from "../../lib/form-values";
import { BUTTON } from "../button-styles";
import {
  CheckboxField,
  DateField,
  DecimalField,
  FormMessage,
  NoteField,
  SubmitButton,
} from "./fields";

const decimal = (value: number | null | undefined, divisor: number) =>
  value === null || value === undefined ? "" : String(value / divisor).replace(".", ",");

export function MeasurementForm({
  childId,
  today,
  measurement,
}: {
  childId: string;
  today: string;
  measurement?: Measurement;
}) {
  const [state, action] = useActionState<FormState, FormData>(saveMeasurementAction, {});
  const { t } = useI18n();
  const v = (name: string, fallback = "") => fieldValue(state, name, fallback);
  const checked = (name: string, stored: boolean | undefined) =>
    state.values ? state.values[name] === "on" : Boolean(stored);

  return (
    <form action={action} className="space-y-6" noValidate>
      <input type="hidden" name="childId" value={childId} />
      {measurement && <input type="hidden" name="id" value={measurement.id} />}
      <FormMessage message={state.message} />

      <DateField
        label={t("form.measuredOn")}
        name="measuredOn"
        max={today}
        defaultValue={v("measuredOn", measurement?.measuredOn ?? today)}
        error={state.errors?.measuredOn}
        required
        className="sm:max-w-60"
      />

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="space-y-2">
          <DecimalField
            label={t("form.weight")}
            hint={t("form.weightHint")}
            name="weightKg"
            defaultValue={v("weightKg", decimal(measurement?.weightG, 1000))}
            error={state.errors?.weightKg}
          />
          <CheckboxField
            name="weightEstimated"
            label={t("common.estimated")}
            defaultChecked={checked("weightEstimated", measurement?.weightEstimated)}
          />
        </div>
        <div className="space-y-2">
          <DecimalField
            label={t("form.length")}
            hint={t("form.lengthHint")}
            name="lengthCm"
            defaultValue={v("lengthCm", decimal(measurement?.lengthMm, 10))}
            error={state.errors?.lengthCm}
          />
          <CheckboxField
            name="lengthEstimated"
            label={t("common.estimated")}
            defaultChecked={checked("lengthEstimated", measurement?.lengthEstimated)}
          />
        </div>
        <div className="space-y-2">
          <DecimalField
            label={t("form.head")}
            hint={t("common.optional")}
            name="headCm"
            defaultValue={v("headCm", decimal(measurement?.headMm, 10))}
            error={state.errors?.headCm}
          />
          <CheckboxField
            name="headEstimated"
            label={t("common.estimated")}
            defaultChecked={checked("headEstimated", measurement?.headEstimated)}
          />
        </div>
      </div>

      <NoteField
        label={t("common.note")}
        hint={t("common.optional")}
        name="note"
        defaultValue={v("note", measurement?.note ?? "")}
      />

      <div className="flex flex-row-reverse flex-wrap items-center justify-start gap-2">
        <SubmitButton>
          {measurement ? t("form.saveChanges") : t("form.addMeasurement")}
        </SubmitButton>
        <Link href="/growth" className={BUTTON.text}>
          {t("common.cancel")}
        </Link>
      </div>
    </form>
  );
}
