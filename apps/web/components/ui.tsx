import type { ReactNode } from "react";

const CARD = {
  /** M3 filled card: the default container for a block of content. */
  filled: "bg-surface-container-highest text-on-surface",
  /** M3 elevated-style surface without shadow, for quieter blocks. */
  low: "bg-surface-container-low text-on-surface",
  /** Highlighted card on the primary container color. */
  primary: "bg-primary-container text-on-primary-container",
  /** Needs attention, such as an overdue appointment. */
  error: "bg-error-container text-on-error-container",
  /** M3 outlined card. */
  outlined: "border border-outline-variant bg-surface text-on-surface",
} as const;

export function Card({
  children,
  tone = "low",
  className = "",
}: {
  children: ReactNode;
  tone?: keyof typeof CARD;
  className?: string;
}) {
  return <section className={`rounded-m3-md p-4 ${CARD[tone]} ${className}`}>{children}</section>;
}

export function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card tone="outlined" className="p-6">
      <h1 className="title-large mb-2">{title}</h1>
      <p className="body-medium text-on-surface-variant">{children}</p>
    </Card>
  );
}

const TONES = {
  overdue: "bg-error-container text-on-error-container",
  today: "bg-primary text-on-primary",
  soon: "bg-warning-container text-on-warning-container",
  done: "bg-success-container text-on-success-container",
  neutral: "border border-outline-variant text-on-surface-variant",
} as const;

/** Status label in the shape of an M3 chip (8px corners, label-large text). */
export function Badge({ tone, children }: { tone: keyof typeof TONES; children: ReactNode }) {
  return (
    <span
      className={`label-large inline-flex h-8 items-center rounded-m3-sm px-3 whitespace-nowrap ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function NoDatabase() {
  return (
    <Notice title="Chưa cấu hình database">
      Đặt DATABASE_URL trong file .env ở thư mục gốc repo.
    </Notice>
  );
}

export function NoChild() {
  return (
    <Notice title="Chưa có hồ sơ bé">
      Chạy <code>pnpm --filter @notch/db seed</code> với NOTCH_SEED_FILE trỏ tới file dữ liệu.
    </Notice>
  );
}
