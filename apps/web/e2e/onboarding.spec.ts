import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { EMPTY_OUTBOX, PARENT } from "./constants";
import { signInLink } from "./mail";

// Runs against the second server, whose database has no family and no child yet.
test("a new family signs in, creates its first child and lands on Today", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.getByLabel("Email").fill(PARENT);
  await page.getByRole("button", { name: "Gửi link đăng nhập" }).click();
  await expect(page.getByRole("status")).toContainText(PARENT);
  await page.goto(await signInLink(PARENT, 0, EMPTY_OUTBOX));

  // No child yet: every page leads to the welcome page.
  await expect(page).toHaveURL(/\/welcome$/);
  await page.goto("/growth");
  await expect(page).toHaveURL(/\/welcome$/);
  await expect(page.locator("main h1")).toHaveText("Chào mừng đến với Notch");

  await page.emulateMedia({ reducedMotion: "reduce" });
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(violations, violations.map((v) => `${v.id}: ${v.help}`).join("\n")).toEqual([]);

  // Everything missing, then a birth date in the future.
  await page.getByRole("button", { name: "Tạo hồ sơ" }).click();
  await expect(page.getByText("Nhập tên bé.")).toBeVisible();
  await expect(page.getByText("Chọn bé gái hoặc bé trai.")).toBeVisible();
  await expect(page.getByText("Nhập ngày sinh.")).toBeVisible();

  await page.getByLabel("Tên bé").fill("Bông");
  await page.getByRole("button", { name: /Giới tính/ }).click();
  await page.getByRole("option", { name: "Bé gái" }).click();
  await page.getByLabel("Ngày sinh").fill("2099-01-01");
  await page.getByRole("button", { name: "Tạo hồ sơ" }).click();
  await expect(page.getByText("Ngày sinh không thể ở tương lai.")).toBeVisible();
  // The typed values stay.
  await expect(page.getByLabel("Tên bé")).toHaveValue("Bông");

  await page.getByLabel("Ngày sinh").fill("2026-05-01");
  await page.getByRole("button", { name: "Tạo hồ sơ" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("main h1")).toContainText("Bông");

  // With a child, the welcome page is no longer shown.
  await page.goto("/welcome");
  await expect(page).toHaveURL(/\/$/);
});
