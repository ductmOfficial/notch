"use client";

import type { AppointmentRow } from "@notch/db";
import { CATALOG } from "@notch/vaccines";
import Link from "next/link";
import { useActionState } from "react";

import { saveAppointmentAction } from "../../app/actions";
import { fieldValue, type FormState } from "../../lib/form-values";
import { DateInput, Field, FormMessage, Select, SubmitButton, TextInput } from "./fields";

export function AppointmentForm({
  childId,
  appointment,
}: {
  childId: string;
  appointment?: AppointmentRow;
}) {
  const [state, action] = useActionState<FormState, FormData>(saveAppointmentAction, {});
  const v = (name: string, fallback = "") => fieldValue(state, name, fallback);

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="childId" value={childId} />
      {appointment && <input type="hidden" name="id" value={appointment.id} />}
      <FormMessage message={state.message} />

      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <Field label="Vaccine" error={state.errors?.productCode}>
          {(p) => (
            <Select
              // React 19 resets forms after an action, but a <select> only applies
              // defaultValue when mounted: remount it so the choice survives errors.
              key={v("productCode", appointment?.productCode ?? "")}
              {...p}
              name="productCode"
              defaultValue={v("productCode", appointment?.productCode ?? "")}
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
              defaultValue={v("doseNo", String(appointment?.doseNo ?? 1))}
              required
            />
          )}
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ngày hẹn" hint="Để trống nếu chưa có ngày" error={state.errors?.dueOn}>
          {(p) => (
            <DateInput {...p} name="dueOn" defaultValue={v("dueOn", appointment?.dueOn ?? "")} />
          )}
        </Field>
        <Field label="Ghi chú" hint="Ví dụ: sau 1 tuổi">
          {(p) => (
            <TextInput {...p} name="note" defaultValue={v("note", appointment?.note ?? "")} />
          )}
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton>{appointment ? "Lưu lịch hẹn" : "Thêm lịch hẹn"}</SubmitButton>
        <Link href="/vaccines" className="text-sm text-[var(--muted)] hover:text-[var(--text)]">
          Huỷ
        </Link>
      </div>
    </form>
  );
}
