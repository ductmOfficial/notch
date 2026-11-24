"use client";

import { useActionState } from "react";

import { type InviteState, inviteMemberAction } from "../app/settings/actions";
import { useI18n } from "../lib/i18n/client";
import { EmailField, SelectField, SubmitButton } from "./form/fields";

/** An owner adds a relative by email, as an editor or a viewer. */
export function InviteForm() {
  const [state, action] = useActionState<InviteState, FormData>(inviteMemberAction, {});
  const { t } = useI18n();
  return (
    <form action={action} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr] sm:items-end">
        <EmailField
          // A successful invite clears the field; an error keeps what was typed.
          key={state.ok ? "sent" : "editing"}
          label={t("members.email")}
          name="email"
          defaultValue={state.ok ? "" : (state.values?.email ?? "")}
          required
        />
        <SelectField
          key={state.values?.role ?? "viewer"}
          label={t("members.role")}
          name="role"
          items={[
            { id: "viewer", name: t("members.roleViewer") },
            { id: "editor", name: t("members.roleEditor") },
          ]}
          defaultValue={state.values?.role ?? "viewer"}
          isRequired
        />
      </div>
      <SubmitButton>{t("members.invite")}</SubmitButton>
      <p
        role={state.ok === false ? "alert" : "status"}
        className={`body-medium ${state.ok === false ? "text-error" : ""}`}
      >
        {state.message ?? ""}
      </p>
    </form>
  );
}
