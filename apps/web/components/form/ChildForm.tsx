"use client";

import { useActionState } from "react";

import { createChildAction } from "../../app/welcome/actions";
import { fieldValue, type FormState } from "../../lib/form-values";
import { useI18n } from "../../lib/i18n/client";
import { DateField, FormMessage, SelectField, SubmitButton, TextField } from "./fields";

/** The first child's profile: name, sex (for the WHO charts) and date of birth. */
export function ChildForm({ today }: { today: string }) {
  const [state, action] = useActionState<FormState, FormData>(createChildAction, {});
  const { t } = useI18n();
  const v = (name: string) => fieldValue(state, name);

  return (
    <form action={action} className="space-y-6" noValidate>
      <FormMessage message={state.message} />
      <TextField
        label={t("form.childName")}
        hint={t("form.childNameHint")}
        name="name"
        maxLength={60}
        defaultValue={v("name")}
        error={state.errors?.name}
        required
      />
      <div className="space-y-1">
        <SelectField
          label={t("form.sex")}
          name="sex"
          items={[
            { id: "female", name: t("common.female") },
            { id: "male", name: t("common.male") },
          ]}
          defaultValue={v("sex")}
          placeholder={t("form.pickSex")}
          error={state.errors?.sex}
          isRequired
        />
        <p className="body-small text-on-surface-variant">{t("form.sexHint")}</p>
      </div>
      <DateField
        label={t("form.birthDate")}
        name="birthDate"
        max={today}
        defaultValue={v("birthDate")}
        error={state.errors?.birthDate}
        required
        className="sm:max-w-60"
      />
      <SubmitButton>{t("welcome.submit")}</SubmitButton>
    </form>
  );
}
