"use client";

import type { HealthEntry } from "@notch/db";
import { useActionState } from "react";

import { saveHealthEntryAction } from "../../app/actions";
import { fieldValue, type FormState } from "../../lib/form-values";
import { HEALTH_KINDS, type HealthKind, healthKindLabel } from "../../lib/health-view";
import { useI18n } from "../../lib/i18n/client";
import { DateField, FormMessage, NoteField, SelectField, SubmitButton, TextField } from "./fields";

/** An illness, a course of medicine or a doctor's visit, with its dates. */
export function HealthEntryForm({
  childId,
  today,
  birthDate,
  entry,
  kind = "illness",
}: {
  childId: string;
  today: string;
  birthDate: string;
  entry?: HealthEntry;
  kind?: HealthKind;
}) {
  const [state, action] = useActionState<FormState, FormData>(saveHealthEntryAction, {});
  const { t, locale } = useI18n();
  const v = (name: string, stored: string | null | undefined) =>
    fieldValue(state, name, stored ?? "");

  return (
    <form action={action} className="space-y-6" noValidate>
      <input type="hidden" name="childId" value={childId} />
      {entry && <input type="hidden" name="id" value={entry.id} />}
      <FormMessage message={state.message} />
      <SelectField
        // React 19 resets forms after an action; remount so the choice survives errors.
        key={v("kind", entry?.kind ?? kind)}
        label={t("form.healthKind")}
        name="kind"
        items={HEALTH_KINDS.map((k) => ({ id: k, name: healthKindLabel(k, locale) }))}
        defaultValue={v("kind", entry?.kind ?? kind)}
        error={state.errors?.kind}
        isRequired
      />
      <TextField
        label={t("form.healthTitle")}
        hint={t("form.healthTitleHint")}
        name="title"
        maxLength={120}
        defaultValue={v("title", entry?.title)}
        error={state.errors?.title}
        required
      />
      <div className="field-row sm:grid-cols-2">
        <DateField
          label={t("form.startedOn")}
          name="startedOn"
          min={birthDate}
          max={today}
          defaultValue={v("startedOn", entry?.startedOn ?? today)}
          error={state.errors?.startedOn}
          required
        />
        <DateField
          label={t("form.endedOnOptional")}
          name="endedOn"
          min={birthDate}
          defaultValue={v("endedOn", entry?.endedOn)}
          error={state.errors?.endedOn}
        />
      </div>
      <p className="body-small -mt-4 text-on-surface-variant">{t("form.endedOnHint")}</p>
      <NoteField
        label={t("common.note")}
        hint={t("common.optional")}
        name="note"
        maxLength={500}
        defaultValue={v("note", entry?.note)}
      />
      <SubmitButton>{t(entry ? "health.saveEntry" : "health.addEntry")}</SubmitButton>
    </form>
  );
}
