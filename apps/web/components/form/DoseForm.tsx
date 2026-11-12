"use client";

import { CATALOG } from "@notch/vaccines";
import Link from "next/link";
import { useActionState } from "react";

import { recordDoseAction } from "../../app/actions";
import { fieldValue, type FormState } from "../../lib/form-values";
import { DateInput, Field, FormMessage, Select, SubmitButton, TextArea, TextInput } from "./fields";

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
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="childId" value={childId} />
      <FormMessage message={state.message} />

      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <Field label="Vaccine" error={state.errors?.productCode}>
          {(p) => (
            <Select
              // React 19 resets forms after an action, but a <select> only applies
              // defaultValue when mounted: remount it so the choice survives errors.
              key={v("productCode", productCode)}
              {...p}
              name="productCode"
              defaultValue={v("productCode", productCode)}
              required
            >
              <option value="">Chọn vaccine…</option>
              {CATALOG.products.map((product) => (
                <option key={product.code} value={product.code}>
                  {product.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Mũi số" error={state.errors?.doseNo}>
          {(p) => (
            <TextInput
              {...p}
              name="doseNo"
              inputMode="numeric"
              defaultValue={v("doseNo", String(doseNo))}
              required
            />
          )}
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Ngày tiêm" error={state.errors?.givenOn}>
          {(p) => (
            <DateInput
              {...p}
              name="givenOn"
              max={today}
              defaultValue={v("givenOn", today)}
              required
            />
          )}
        </Field>
        <Field label="Nơi tiêm" hint="Không bắt buộc">
          {(p) => <TextInput {...p} name="place" defaultValue={v("place")} />}
        </Field>
        <Field label="Số lô" hint="Không bắt buộc">
          {(p) => <TextInput {...p} name="lot" defaultValue={v("lot")} />}
        </Field>
      </div>

      <fieldset className="space-y-4 rounded-lg border border-[var(--border)] p-4">
        <legend className="px-1 text-sm font-medium">Lịch hẹn mũi kế tiếp</legend>
        <p className="text-xs text-[var(--muted)]">
          Theo lịch phòng tiêm hẹn. Để trống nếu không có hẹn; chỉ ghi chú (như “sau 1 tuổi”) nếu
          chưa có ngày.
        </p>
        <div className="grid gap-4 sm:grid-cols-[1fr_2fr_3fr]">
          <Field label="Mũi số" error={state.errors?.nextDoseNo}>
            {(p) => (
              <TextInput
                {...p}
                name="nextDoseNo"
                inputMode="numeric"
                defaultValue={v("nextDoseNo", String(doseNo + 1))}
              />
            )}
          </Field>
          <Field label="Ngày hẹn" error={state.errors?.nextDueOn}>
            {(p) => <DateInput {...p} name="nextDueOn" defaultValue={v("nextDueOn")} />}
          </Field>
          <Field label="Ghi chú hẹn">
            {(p) => <TextInput {...p} name="nextNote" defaultValue={v("nextNote")} />}
          </Field>
        </div>
      </fieldset>

      <Field label="Ghi chú" hint="Không bắt buộc">
        {(p) => <TextArea {...p} name="note" defaultValue={v("note")} />}
      </Field>

      <div className="flex items-center gap-3">
        <SubmitButton>Ghi nhận mũi tiêm</SubmitButton>
        <Link href="/vaccines" className="text-sm text-[var(--muted)] hover:text-[var(--text)]">
          Huỷ
        </Link>
      </div>
    </form>
  );
}
