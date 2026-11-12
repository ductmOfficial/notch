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

test("the quick-add dialog is announced and keeps focus inside", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Thêm nhanh" }).filter({ visible: true }).click();
  const dialog = page.getByRole("dialog", { name: "Thêm nhanh" });
  await expect(dialog).toBeVisible();
  const { violations } = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
  expect(violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});
