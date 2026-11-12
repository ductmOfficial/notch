import { SubmitButton } from "./fields";

/**
 * A delete button behind a disclosure, so a single tap never deletes. Works
 * without client JavaScript (native <details> and a Server Action).
 */
export function DeleteForm({
  action,
  childId,
  id,
  label,
  confirm,
}: {
  action: (form: FormData) => Promise<void>;
  childId: string;
  id: string;
  label: string;
  confirm: string;
}) {
  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-[var(--danger)]">{label}</summary>
      <form action={action} className="mt-2 flex flex-wrap items-center gap-3">
        <input type="hidden" name="childId" value={childId} />
        <input type="hidden" name="id" value={id} />
        <span className="text-[var(--muted)]">{confirm}</span>
        <SubmitButton variant="danger" pendingLabel="Đang xoá…">
          Xoá
        </SubmitButton>
      </form>
    </details>
  );
}
