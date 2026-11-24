"use client";

import type { Child } from "@notch/db";
import { useActionState } from "react";

import { updateChildAction } from "../../app/child/actions";
import { fieldValue, type FormState } from "../../lib/form-values";
import { useI18n } from "../../lib/i18n/client";
import { DateField, FormMessage, SelectField, SubmitButton, TextField, TimeField } from "./fields";

/**
 * A child's profile: the family's name for the child, shown across the app, the
 * birth-certificate and English names, sex (for the WHO charts), date and time of birth.
 */
export function ChildProfileForm({ child, today }: { child: Child; today: string }) {
  const [state, action] = useActionState<FormState, FormData>(updateChildAction, {});
  const { t } = useI18n();
  const v = (name: string, stored: string | null) => fieldValue(state, name, stored ?? "");

  return (
    <form action={action} className="space-y-6" noValidate>
      <input type="hidden" name="childId" value={child.id} />
      <FormMessage message={state.message} />
      <TextField
        label={t("form.childName")}
        hint={t("form.childNameHint")}
        name="name"
        maxLength={60}
        defaultValue={v("name", child.name)}
        error={state.errors?.name}
        required
      />
      <TextField
        label={t("form.fullName")}
        hint={t("form.fullNameHint")}
        name="fullName"
        maxLength={100}
        defaultValue={v("fullName", child.fullName)}
        error={state.errors?.fullName}
      />
      <TextField
        label={t("form.englishName")}
        hint={t("form.optional")}
        name="englishName"
        maxLength={100}
        defaultValue={v("englishName", child.englishName)}
        error={state.errors?.englishName}
      />
      <div className="space-y-1">
        <SelectField
          label={t("form.sex")}
          name="sex"
          items={[
            { id: "female", name: t("common.female") },
            { id: "male", name: t("common.male") },
          ]}
          defaultValue={v("sex", child.sex)}
          placeholder={t("form.pickSex")}
          error={state.errors?.sex}
          isRequired
        />
        <p className="body-small text-on-surface-variant">{t("form.sexHint")}</p>
      </div>
      <div className="field-row sm:grid-cols-2">
        <DateField
          label={t("form.birthDate")}
          name="birthDate"
          max={today}
          defaultValue={v("birthDate", child.birthDate)}
          error={state.errors?.birthDate}
          required
        />
        {/* No hint line: field-row lines it up with the date beside it. */}
        <TimeField
          label={t("form.birthTimeOptional")}
          name="birthTime"
          defaultValue={v("birthTime", child.birthTime?.slice(0, 5) ?? null)}
          error={state.errors?.birthTime}
        />
      </div>
      <SubmitButton>{t("page.saveChild")}</SubmitButton>
    </form>
  );
}
