import { AxeBuilder } from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const WCAG = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];

async function noViolations(page: Page) {
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
    expect(violations, violations.map((v) => `${v.id}: ${v.help}`).join("\n")).toEqual([]);
  }
}

test("a share link opens the child's page without an account, until it is replaced or revoked", async ({
  page,
  browser,
}) => {
  await page.goto("/settings");
  const links = page.getByRole("list", { name: "Chia sẻ trang của bé" });
  // A link from another project's run of this test is revoked first.
  if ((await links.getByRole("button", { name: "Thu hồi link" }).count()) > 0) {
    await links.getByRole("button", { name: "Thu hồi link" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Thu hồi link" }).click();
  }

  // The radio inputs are visually hidden inside their segment labels.
  await links.locator("label").filter({ hasText: "7 ngày" }).click();
  await links.getByRole("button", { name: "Tạo link chia sẻ" }).click();
  const field = links.getByLabel("Link chia sẻ của Mây");
  await expect(field).toHaveValue(/\/share\/[\w-]{43}$/);
  const url = await field.inputValue();
  await expect(links).toContainText("Hết hạn ngày");
  await expect(links).toContainText("Chưa ai mở link này.");

  // Someone without an account opens it: the shared parts only.
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const guest = await context.newPage();
  const response = await guest.goto(url);
  expect(response?.headers()["x-robots-tag"]).toContain("noindex");
  await expect(guest.locator("main h1")).toHaveText("Mây");
  await expect(guest.getByText("Trang chia sẻ, chỉ đọc")).toBeVisible();
  await expect(guest.getByRole("heading", { name: "Số đo gần nhất" })).toBeVisible();
  await expect(guest.getByText(/\d+ mũi đã tiêm/)).toBeVisible();
  await expect(guest.getByRole("heading", { name: "Cột mốc" })).toBeVisible();
  await expect(guest.getByRole("navigation", { name: "Chính" })).toHaveCount(0);
  const main = guest.locator("main");
  await expect(main).not.toContainText("Sức khoẻ");
  await expect(main).not.toContainText("20/05/2025");
  await expect(main).not.toContainText("08:40");
  await expect(main).toContainText("Link dùng được tới ngày");
  await noViolations(guest);
  const overflow = await guest.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);

  // A family member who opens the link sees what others see: no app navigation.
  const preview = await page.context().newPage();
  await preview.goto(url);
  await expect(preview.locator("main h1")).toHaveText("Mây");
  await expect(preview.getByRole("navigation", { name: "Chính" })).toHaveCount(0);
  await preview.close();

  // Nor does a browser in the demo get the demo's banner over a real child's page.
  const demo = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const demoPage = await demo.newPage();
  await demoPage.goto("/demo");
  await expect(demoPage.getByRole("note")).toBeVisible();
  await demoPage.goto(url);
  await expect(demoPage.locator("main h1")).toHaveText("Mây");
  await expect(demoPage.getByRole("note")).toHaveCount(0);
  await demo.close();

  // The family sees that it was opened.
  await page.reload();
  await expect(links).toContainText("Mở lần cuối ngày");

  // A new link replaces the old one.
  await links.getByRole("button", { name: "Tạo link mới" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Tạo link mới" }).click();
  await expect(field).not.toHaveValue(url);
  const replaced = await field.inputValue();
  await guest.goto(url);
  await expect(guest.getByRole("heading", { name: "Link không còn dùng được" })).toBeVisible();
  await expect(guest.locator("main")).not.toContainText("Mây");
  await noViolations(guest);

  // Revoked: the link stops working at once, even on a page left open (it checks again when
  // it comes back into view).
  await guest.goto(replaced);
  await expect(guest.locator("main h1")).toHaveText("Mây");
  await links.getByRole("button", { name: "Thu hồi link" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Thu hồi link" }).click();
  await expect(links.getByRole("button", { name: "Tạo link chia sẻ" })).toBeVisible();
  await guest.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(guest.getByRole("heading", { name: "Link không còn dùng được" })).toBeVisible();
  await expect(guest.locator("main")).not.toContainText("Mây");
  await guest.goto(replaced);
  await expect(guest.getByRole("heading", { name: "Link không còn dùng được" })).toBeVisible();
  await context.close();
});

test("an unknown address shows a page in the app's language", async ({ page }) => {
  await page.goto("/growth/00000000-0000-4000-8000-000000000000/edit");
  await expect(page.getByRole("heading", { name: "Không tìm thấy trang" })).toBeVisible();
  await page.getByRole("link", { name: "Về Hôm nay" }).click();
  await expect(page).toHaveURL(/\/$/);
});
