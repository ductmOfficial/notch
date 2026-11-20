import { getI18n } from "../lib/i18n/server";

/** One placeholder block in the shape of a card. */
function Block({ className }: { className: string }) {
  return <div className={`rounded-m3-md bg-surface-container-low ${className}`} />;
}

/**
 * Shown at once while a page renders on the server, so a tap on the navigation answers
 * immediately. Next.js also prefetches the layout down to this boundary.
 */
export default async function Loading() {
  const { t } = await getI18n();
  return (
    <div role="status" aria-busy="true" className="space-y-6 pt-2">
      <span className="sr-only">{t("app.loading")}</span>
      <div aria-hidden="true" className="space-y-6 motion-safe:animate-pulse">
        <Block className="h-12 w-2/3 max-w-sm" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Block className="h-32" />
          <Block className="h-32" />
        </div>
        <Block className="h-48" />
      </div>
    </div>
  );
}
