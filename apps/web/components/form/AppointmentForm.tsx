"use client";

import type { AppointmentRow } from "@notch/db";
import { CATALOG } from "@notch/vaccines";
import Link from "next/link";
import { useActionState } from "react";

import { saveAppointmentAction } from "../../app/actions";
import { fieldValue, type FormState } from "../../lib/form-values";
import { BUTTON } from "../button-styles";
import {
  DateField,
  FormMessage,
  NumberField,
  SelectField,
  SubmitButton,
  TextField,
} from "./fields";

const PRODUCTS = CATALOG.products.map((p) => ({ id: p.code, name: p.name }));

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
    <form action={action} className="space-y-6" noValidate>
      <input type="hidden" name="childId" value={childId} />
      {appointment && <input type="hidden" name="id" value={appointment.id} />}
      <FormMessage message={state.message} />

      <div className="grid gap-6 sm:grid-cols-[2fr_1fr]">
        <SelectField
          // React 19 resets forms after an action; remount so the choice survives errors.
          key={v("productCode", appointment?.productCode ?? "")}
          label="Vaccine"
          name="productCode"
          items={PRODUCTS}
          defaultValue={v("productCode", appointment?.productCode ?? "")}
          placeholder="Chọn vaccine…"
          error={state.errors?.productCode}
          isRequired
        />
        <NumberField
          label="Mũi số"
          name="doseNo"
          defaultValue={v("doseNo", String(appointment?.doseNo ?? 1))}
          error={state.errors?.doseNo}
          required
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <DateField
          label="Ngày hẹn"
          hint="Để trống nếu chưa có ngày"
          name="dueOn"
          defaultValue={v("dueOn", appointment?.dueOn ?? "")}
          error={state.errors?.dueOn}
        />
        <TextField
          label="Ghi chú"
          hint="Ví dụ: sau 1 tuổi"
          name="note"
          defaultValue={v("note", appointment?.note ?? "")}
        />
      </div>

      <div className="flex flex-row-reverse flex-wrap items-center justify-start gap-2">
        <SubmitButton>{appointment ? "Lưu lịch hẹn" : "Thêm lịch hẹn"}</SubmitButton>
        <Link href="/vaccines" className={BUTTON.text}>
          Huỷ
        </Link>
      </div>
    </form>
  );
}
