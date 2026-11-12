import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const pages = [
  "/",
  "/growth",
  "/growth?indicator=length",
  "/vaccines",
  "/growth/new",
  "/vaccines/record",
  "/vaccines/appointments/new",
  "/settings",
];

for (const path of pages) {
  test.describe(path, () => {
    for (const scheme of ["light", "dark"] as const) {
      test(`has no WCAG 2.2 AA violations (${scheme})`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
        await page.goto(path);
        await expect(page.locator("main h1")).toBeVisible();
        const { violations } = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        expect(violations, violations.map((v) => `${v.id}: ${v.help}`).join("\n")).toEqual([]);
      });
    }

    test("does not scroll sideways", async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBe(0);
    });
  });
}

test.describe("in English", () => {
  test.use({ locale: "en-US" });
  for (const path of pages) {
    test(`${path} has no WCAG 2.2 AA violations and is marked as English`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(page.locator("main h1")).toBeVisible();
      const { violations } = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(violations, violations.map((v) => `${v.id}: ${v.help}`).join("\n")).toEqual([]);
    });
  }
});

/** Opacity the element is painted with: its own times every ancestor's (a fading overlay). */
const paintedOpacity = (element: Element) => {
  let opacity = 1;
  for (let e: Element | null = element; e; e = e.parentElement)
    opacity *= Number(getComputedStyle(e).opacity);
  return opacity;
};

test("the quick-add dialog is announced and keeps focus inside", async ({ page }) => {
  // Scan the dialog's final colors. With reduced motion it appears without fading in; a scan
  // during the fade measures half-transparent text.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Thêm nhanh" }).filter({ visible: true }).click();
  const dialog = page.getByRole("dialog", { name: "Thêm nhanh" });
  await expect(dialog).toBeVisible();
  await expect.poll(() => dialog.evaluate(paintedOpacity)).toBe(1);
  const { violations } = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
  expect(violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("dialogs open without animation when reduced motion is requested", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const duration = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--sen-duration-fast").trim(),
  );
  // Browsers may normalize "0ms" to "0s".
  expect(Number.parseFloat(duration)).toBe(0);
});
