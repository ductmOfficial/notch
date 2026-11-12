import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 ${className}`}
    >
      {children}
    </section>
  );
}

export function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h1 className="mb-2 text-lg font-semibold">{title}</h1>
      <p className="text-sm text-[var(--muted)]">{children}</p>
    </div>
  );
}

const TONES = {
  overdue: "bg-[var(--danger-soft)] text-[var(--danger)]",
  today: "bg-[var(--accent)] text-[var(--surface)]",
  soon: "bg-[var(--accent-soft)] text-[var(--accent)]",
  neutral: "bg-[var(--grid)] text-[var(--muted)]",
} as const;

export function Badge({ tone, children }: { tone: keyof typeof TONES; children: ReactNode }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${TONES[tone]}`}
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
