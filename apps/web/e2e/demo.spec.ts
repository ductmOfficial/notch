import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// A first visitor, without an account.
test.use({ storageState: { cookies: [], origins: [] } });

test("the about page leads to a read-only demo of a fictional child", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Notch");
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(violations, violations.map((v) => `${v.id}: ${v.help}`).join("\n")).toEqual([]);

  await page.getByRole("link", { name: "Xem bản demo" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("note")).toContainText("Mây là bé giả lập");
  await expect(page.locator("main h1")).toContainText("Mây được");
  // Read-only: no quick add, no add buttons, and forms explain why.
  await expect(page.getByRole("button", { name: "Thêm nhanh" })).toHaveCount(0);
  await page.goto("/health");
  await expect(page.getByText("Sốt nhẹ sau tiêm").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Ghi sức khoẻ" })).toBeHidden();
  await page.goto("/child?tab=milestones");
  await expect(page.getByText("Những bước đi đầu tiên")).toBeVisible();
  // The demo database is its own: what the tests added to the family is not there.
  await expect(page.getByText("Chiếc răng đầu tiên", { exact: true })).toHaveCount(1);
  await page.goto("/growth/new");
  await expect(page.getByText("Bạn đang xem với quyền người xem")).toBeVisible();

  // Leaving the demo goes back to the about page; the app asks to sign in again.
  await page.getByRole("link", { name: "Thoát demo" }).first().click();
  await expect(page).toHaveURL(/\/about$/);
  await page.goto("/growth");
  await expect(page).toHaveURL(/\/sign-in$/);
});

test("in the demo, signing in leaves the demo first", async ({ page }) => {
  await page.goto("/demo");
  await page.getByRole("note").getByRole("link", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByLabel("Email")).toBeVisible();
});
