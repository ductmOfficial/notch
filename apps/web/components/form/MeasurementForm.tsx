"use client";

import type { Measurement } from "@notch/db";
import Link from "next/link";
import { useActionState } from "react";

import { saveMeasurementAction } from "../../app/actions";
import { fieldValue, type FormState } from "../../lib/form-values";
import {
  Checkbox,
  DateInput,
  DecimalInput,
  Field,
  FormMessage,
  SubmitButton,
  TextArea,
} from "./fields";

const decimal = (value: number | null | undefined, divisor: number) =>
  value === null || value === undefined ? "" : String(value / divisor).replace(".", ",");

export function MeasurementForm({
  childId,
  today,
  measurement,
}: {
  childId: string;
  today: string;
  measurement?: Measurement;
}) {
  const [state, action] = useActionState<FormState, FormData>(saveMeasurementAction, {});
  const v = (name: string, fallback = "") => fieldValue(state, name, fallback);
  const checked = (name: string, stored: boolean | undefined) =>
    state.values ? state.values[name] === "on" : Boolean(stored);

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="childId" value={childId} />
      {measurement && <input type="hidden" name="id" value={measurement.id} />}
      <FormMessage message={state.message} />

      <Field label="Ngày đo" error={state.errors?.measuredOn}>
        {(p) => (
          <DateInput
            {...p}
            name="measuredOn"
            max={today}
            defaultValue={v("measuredOn", measurement?.measuredOn ?? today)}
            required
          />
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Field label="Cân nặng (kg)" hint="Ví dụ 8,6" error={state.errors?.weightKg}>
            {(p) => (
              <DecimalInput
                {...p}
                name="weightKg"
                defaultValue={v("weightKg", decimal(measurement?.weightG, 1000))}
              />
            )}
          </Field>
          <Checkbox
            name="weightEstimated"
            label="Ước lượng (~)"
            defaultChecked={checked("weightEstimated", measurement?.weightEstimated)}
          />
        </div>
        <div className="space-y-2">
          <Field label="Chiều dài / cao (cm)" hint="Ví dụ 69" error={state.errors?.lengthCm}>
            {(p) => (
              <DecimalInput
                {...p}
                name="lengthCm"
                defaultValue={v("lengthCm", decimal(measurement?.lengthMm, 10))}
              />
            )}
          </Field>
          <Checkbox
            name="lengthEstimated"
            label="Ước lượng (~)"
            defaultChecked={checked("lengthEstimated", measurement?.lengthEstimated)}
          />
        </div>
        <div className="space-y-2">
          <Field label="Vòng đầu (cm)" hint="Không bắt buộc" error={state.errors?.headCm}>
            {(p) => (
              <DecimalInput
                {...p}
                name="headCm"
                defaultValue={v("headCm", decimal(measurement?.headMm, 10))}
              />
            )}
          </Field>
          <Checkbox
            name="headEstimated"
            label="Ước lượng (~)"
            defaultChecked={checked("headEstimated", measurement?.headEstimated)}
          />
        </div>
      </div>

      <Field label="Ghi chú" hint="Không bắt buộc">
        {(p) => <TextArea {...p} name="note" defaultValue={v("note", measurement?.note ?? "")} />}
      </Field>

      <div className="flex items-center gap-3">
        <SubmitButton>{measurement ? "Lưu thay đổi" : "Thêm lần đo"}</SubmitButton>
        <Link href="/growth" className="text-sm text-[var(--muted)] hover:text-[var(--text)]">
          Huỷ
        </Link>
      </div>
    </form>
  );
}
