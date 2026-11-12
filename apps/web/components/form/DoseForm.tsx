"use client";

import { CATALOG } from "@notch/vaccines";
import Link from "next/link";
import { useActionState } from "react";

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
  const v = (name: string, fallback = "") => fieldValue(state, name, fallback);

  return (
    <form action={action} className="space-y-6" noValidate>
      <input type="hidden" name="childId" value={childId} />
      <FormMessage message={state.message} />

      <div className="grid gap-6 sm:grid-cols-[2fr_1fr]">
        <SelectField
          // React 19 resets forms after an action; remount so the choice survives errors.
          key={v("productCode", productCode)}
          label="Vaccine"
          name="productCode"
          items={PRODUCTS}
          defaultValue={v("productCode", productCode)}
          placeholder="Chọn vaccine…"
          error={state.errors?.productCode}
          isRequired
        />
        <NumberField
          label="Mũi số"
          name="doseNo"
          defaultValue={v("doseNo", String(doseNo))}
          error={state.errors?.doseNo}
          required
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <DateField
          label="Ngày tiêm"
          name="givenOn"
          max={today}
          defaultValue={v("givenOn", today)}
          error={state.errors?.givenOn}
          required
        />
        <TextField label="Nơi tiêm" hint="Không bắt buộc" name="place" defaultValue={v("place")} />
        <TextField label="Số lô" hint="Không bắt buộc" name="lot" defaultValue={v("lot")} />
      </div>

      <fieldset className="min-w-0 space-y-4 rounded-m3-md border border-outline-variant p-4">
        <legend className="title-small px-1">Lịch hẹn mũi kế tiếp</legend>
        <p className="body-small text-on-surface-variant">
          Theo lịch phòng tiêm hẹn. Để trống nếu không có hẹn; chỉ ghi chú (như “sau 1 tuổi”) nếu
          chưa có ngày.
        </p>
        <div className="grid gap-6 sm:grid-cols-[1fr_2fr_3fr]">
          <NumberField
            label="Mũi số"
            name="nextDoseNo"
            defaultValue={v("nextDoseNo", String(doseNo + 1))}
            error={state.errors?.nextDoseNo}
          />
          <DateField
            label="Ngày hẹn"
            name="nextDueOn"
            defaultValue={v("nextDueOn")}
            error={state.errors?.nextDueOn}
          />
          <TextField label="Ghi chú hẹn" name="nextNote" defaultValue={v("nextNote")} />
        </div>
      </fieldset>

      <NoteField label="Ghi chú" hint="Không bắt buộc" name="note" defaultValue={v("note")} />

      <div className="flex flex-row-reverse flex-wrap items-center justify-start gap-2">
        <SubmitButton>Ghi nhận mũi tiêm</SubmitButton>
        <Link href="/vaccines" className={BUTTON.text}>
          Huỷ
        </Link>
      </div>
    </form>
  );
}
