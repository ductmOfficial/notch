import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { PARENT } from "./constants";
import { sentTo, signInLink } from "./mail";

// These tests start signed out.
test.use({ storageState: { cookies: [], origins: [] } });

test("every page and every file need a session", async ({ page, request }) => {
  for (const path of ["/", "/growth", "/vaccines", "/settings", "/growth/new"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/sign-in$/);
  }
  for (const file of ["/calendar.ics", "/report.pdf", "/backup.json"]) {
    expect((await request.get(file, { maxRedirects: 0 })).status()).toBe(307);
  }
  // No navigation to pages that would only send the visitor back here.
  await expect(page.getByRole("navigation")).toHaveCount(0);
});

test("the sign-in page has no WCAG 2.2 AA violations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/sign-in");
  await expect(page.locator("main h1")).toHaveText("Đăng nhập");
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(violations, violations.map((v) => `${v.id}: ${v.help}`).join("\n")).toEqual([]);
});

test("an email outside the allowlist gets the same answer and no email", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill("stranger@example.com");
  await page.getByRole("button", { name: "Gửi link đăng nhập" }).click();
  await expect(page.getByRole("status")).toContainText("stranger@example.com");
  expect(await sentTo("stranger@example.com")).toBe(0);
});

test("a malformed email is refused before anything is sent", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByRole("button", { name: "Gửi link đăng nhập" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("Email chưa đúng");
});

test("a link signs in once; signing out ends the session", async ({ page }) => {
  const before = await sentTo(PARENT);
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(PARENT);
  await page.getByRole("button", { name: "Gửi link đăng nhập" }).click();
  const link = await signInLink(PARENT, before);

  await page.goto(link);
  await expect(page.locator("main h1")).toContainText("Mây");

  await page.goto("/settings");
  await expect(page.getByText(`Đăng nhập bằng ${PARENT}`)).toBeVisible();
  await page.getByRole("button", { name: "Đăng xuất" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/sign-in$/);

  // The same link again: already used, so it leads back with a message.
  await page.goto(link);
  await expect(page).toHaveURL(/\/sign-in\?error=/);
  await expect(page.locator("main").getByRole("alert")).toContainText("hết hạn hoặc đã được dùng");
});
