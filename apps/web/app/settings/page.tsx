import type { Metadata } from "next";

import { ThemePicker } from "../../components/ThemePicker";
import { Card } from "../../components/ui";
import { getTheme } from "../../lib/preferences";

export const metadata: Metadata = { title: "Cài đặt" };

export default async function SettingsPage() {
  const theme = await getTheme();
  return (
    <div className="space-y-6 pt-2">
      <header>
        <h1 className="headline-medium">Cài đặt</h1>
        <p className="body-medium mt-1 text-on-surface-variant">Áp dụng cho trình duyệt này.</p>
      </header>
      <Card className="p-5">
        <ThemePicker initial={theme} />
      </Card>
    </div>
  );
}
