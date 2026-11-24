"use client";

import type { Milestone, MilestoneKind } from "@notch/db";
import { useActionState, useId, useState } from "react";

import { saveMilestoneAction } from "../../app/actions";
import { fieldValue, type FormState } from "../../lib/form-values";
import { milestoneKindLabel } from "../../lib/child-timeline";
import { useI18n } from "../../lib/i18n/client";
import { MILESTONE_SUGGESTIONS } from "../../lib/milestone-suggestions";
import { DateField, FormMessage, NoteField, SelectField, SubmitButton, TextField } from "./fields";

const KINDS: readonly MilestoneKind[] = ["motor", "language", "teeth", "social", "other"];

/**
 * A milestone: its kind, a title in the family's words (with common ones offered for the kind)
 * and the day. Nothing here judges whether it came early or late.
 */
export function MilestoneForm({
  childId,
  today,
  birthDate,
  milestone,
}: {
  childId: string;
  today: string;
  birthDate: string;
  milestone?: Milestone;
}) {
  const [state, action] = useActionState<FormState, FormData>(saveMilestoneAction, {});
  const { t, locale } = useI18n();
  const listId = useId();
  const v = (name: string, stored: string | null | undefined) =>
    fieldValue(state, name, stored ?? "");
  const [kind, setKind] = useState<string>(() => v("kind", milestone?.kind ?? "motor"));
  const suggestions =
    MILESTONE_SUGGESTIONS[locale][
      (KINDS as readonly string[]).includes(kind) ? (kind as MilestoneKind) : "other"
    ];

  return (
    <form action={action} className="space-y-6" noValidate>
      <input type="hidden" name="childId" value={childId} />
      {milestone && <input type="hidden" name="id" value={milestone.id} />}
      <FormMessage message={state.message} />
      <SelectField
        label={t("form.milestoneKind")}
        name="kind"
        items={KINDS.map((k) => ({ id: k, name: milestoneKindLabel(k, locale) }))}
        defaultValue={kind}
        error={state.errors?.kind}
        onChange={setKind}
        isRequired
      />
      <TextField
        label={t("form.milestoneTitle")}
        hint={t("form.milestoneTitleHint")}
        name="title"
        maxLength={120}
        list={listId}
        defaultValue={v("title", milestone?.title)}
        error={state.errors?.title}
        required
      />
      <datalist id={listId}>
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <DateField
        label={t("form.milestoneDate")}
        name="happenedOn"
        min={birthDate}
        max={today}
        defaultValue={v("happenedOn", milestone?.happenedOn ?? today)}
        error={state.errors?.happenedOn}
        required
        className="sm:max-w-60"
      />
      <NoteField
        label={t("common.note")}
        hint={t("common.optional")}
        name="note"
        maxLength={500}
        defaultValue={v("note", milestone?.note)}
      />
      <SubmitButton>{t(milestone ? "milestone.save" : "milestone.add")}</SubmitButton>
    </form>
  );
}
