"use client";

import { CATALOG } from "@notch/vaccines";
import Link from "next/link";
import { useActionState, useState } from "react";
import { useI18n } from "../../lib/i18n/client";

import { recordDoseAction } from "../../app/actions";
import { fieldValue, type FormState } from "../../lib/form-values";
import { BUTTON } from "../button-styles";
import {
  DateField,
  FormMessage,
  NoteField,
  NumberField,
  SelectField,
  SubmitButton,
  TextField,
} from "./fields";

const PRODUCTS = CATALOG.products.map((p) => ({ id: p.code, name: p.name }));

export function DoseForm({
  childId,
  today,
  productCode = "",
  doseNo = 1,
}: {
  childId: string;
  today: string;
  productCode?: string;
  doseNo?: number;
}) {
  const [state, action] = useActionState<FormState, FormData>(recordDoseAction, {});
  const { t } = useI18n();
  const v = (name: string, fallback = "") => fieldValue(state, name, fallback);
  // The next appointment's dose follows the dose being recorded until it is edited by hand.
  const [dose, setDose] = useState(() => v("doseNo", String(doseNo)));
  const [nextByHand, setNextByHand] = useState<string | null>(null);
  const doseNumber = Number(dose);
  const nextDose =
    nextByHand ??
    (dose.trim() !== "" && Number.isInteger(doseNumber) ? String(doseNumber + 1) : "");

  return (
    <form action={action} className="space-y-6" noValidate>
      <input type="hidden" name="childId" value={childId} />
      <FormMessage message={state.message} />

      <div className="grid gap-6 sm:grid-cols-[2fr_1fr]">
        <SelectField
          // React 19 resets forms after an action; remount so the choice survives errors.
          key={v("productCode", productCode)}
          label={t("form.vaccine")}
          name="productCode"
          items={PRODUCTS}
          defaultValue={v("productCode", productCode)}
          placeholder={t("form.pickVaccine")}
          error={state.errors?.productCode}
          isRequired
        />
        <NumberField
          label={t("form.doseNo")}
          name="doseNo"
          value={dose}
          onChange={(e) => {
            setDose(e.target.value);
          }}
          error={state.errors?.doseNo}
          required
        />
      </div>

      {/* No hint lines here: field-row lines the inputs up across the row. */}
      <div className="field-row sm:grid-cols-3">
        <DateField
          label={t("form.givenOn")}
          name="givenOn"
          max={today}
          defaultValue={v("givenOn", today)}
          error={state.errors?.givenOn}
          required
        />
        <TextField label={t("form.placeOptional")} name="place" defaultValue={v("place")} />
        <TextField label={t("form.lotOptional")} name="lot" defaultValue={v("lot")} />
      </div>

      <fieldset className="min-w-0 space-y-4 rounded-m3-md border border-outline-variant p-4">
        <legend className="title-small px-1">{t("form.nextAppointment")}</legend>
        <p className="body-small text-on-surface-variant">{t("form.nextAppointmentHint")}</p>
        <div className="grid gap-6 sm:grid-cols-[1fr_2fr_3fr]">
          <NumberField
            label={t("form.doseNo")}
            name="nextDoseNo"
            value={nextDose}
            onChange={(e) => {
              setNextByHand(e.target.value);
            }}
            error={state.errors?.nextDoseNo}
          />
          <DateField
            label={t("form.dueOn")}
            name="nextDueOn"
            defaultValue={v("nextDueOn")}
            error={state.errors?.nextDueOn}
          />
          <TextField label={t("form.nextNote")} name="nextNote" defaultValue={v("nextNote")} />
        </div>
      </fieldset>

      <NoteField
        label={t("common.note")}
        hint={t("common.optional")}
        name="note"
        defaultValue={v("note")}
      />

      <div className="flex flex-row-reverse flex-wrap items-center justify-start gap-2">
        <SubmitButton>{t("form.recordDose")}</SubmitButton>
        <Link href="/vaccines" className={BUTTON.text}>
          {t("common.cancel")}
        </Link>
      </div>
    </form>
  );
}
