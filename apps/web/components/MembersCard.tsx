import type { FamilyInvite, FamilyMemberRow, MemberRole } from "@notch/db";

import {
  removeInviteAction,
  removeMemberAction,
  setMemberRoleAction,
} from "../app/settings/actions";
import { formatDate, todayInVietnam } from "../lib/format";
import type { Locale, MessageKey, Translate } from "../lib/i18n/messages";
import { BUTTON } from "./button-styles";
import { DeleteForm } from "./form/DeleteForm";
import { InviteForm } from "./InviteForm";

export const ROLE_LABEL: Record<MemberRole, MessageKey> = {
  owner: "members.roleOwner",
  editor: "members.roleEditor",
  viewer: "members.roleViewer",
};

/**
 * Who belongs to the family, for owners: the members with their role, invites not used yet,
 * and a form to add a relative. Owners come from NOTCH_ALLOWED_EMAILS and stay.
 */
export function MembersCard({
  members,
  invites,
  selfId,
  t,
  locale,
}: {
  members: readonly FamilyMemberRow[];
  invites: readonly FamilyInvite[];
  selfId: string;
  t: Translate;
  locale: Locale;
}) {
  return (
    <div className="space-y-4">
      <p className="body-medium text-on-surface-variant">{t("members.intro")}</p>
      <ul className="divide-y divide-outline-variant" aria-label={t("members.title")}>
        {members.map((m) => (
          <li
            key={m.userId}
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3 first:pt-0"
          >
            <div className="min-w-0">
              <p className="body-large break-all">
                {m.email}
                {m.userId === selfId && (
                  <span className="text-on-surface-variant"> · {t("members.you")}</span>
                )}
              </p>
              <p className="body-medium text-on-surface-variant">
                {t(ROLE_LABEL[m.role])} ·{" "}
                {t("members.since", { date: formatDate(todayInVietnam(m.createdAt), locale) })}
              </p>
            </div>
            {m.role !== "owner" && (
              <span className="flex flex-wrap gap-2">
                <form action={setMemberRoleAction}>
                  <input type="hidden" name="userId" value={m.userId} />
                  <input
                    type="hidden"
                    name="role"
                    value={m.role === "viewer" ? "editor" : "viewer"}
                  />
                  <button type="submit" className={BUTTON.text}>
                    {t(m.role === "viewer" ? "members.makeEditor" : "members.makeViewer")}
                  </button>
                </form>
                <DeleteForm
                  action={removeMemberAction}
                  childId=""
                  id={m.userId}
                  label={t("members.remove")}
                  title={t("members.removeTitle", { email: m.email })}
                  confirm={t("members.removeConfirm")}
                />
              </span>
            )}
          </li>
        ))}
      </ul>

      {invites.length > 0 && (
        <div className="space-y-2">
          <h3 className="label-large text-on-surface-variant">{t("members.pending")}</h3>
          <ul className="divide-y divide-outline-variant">
            {invites.map((i) => (
              <li
                key={i.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2"
              >
                <p className="body-medium break-all">
                  {i.email}
                  <span className="text-on-surface-variant"> · {t(ROLE_LABEL[i.role])}</span>
                </p>
                <DeleteForm
                  action={removeInviteAction}
                  childId=""
                  id={i.id}
                  label={t("members.cancelInvite")}
                  title={t("members.cancelInviteTitle", { email: i.email })}
                  confirm={t("members.cancelInviteConfirm")}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      <InviteForm />
    </div>
  );
}
