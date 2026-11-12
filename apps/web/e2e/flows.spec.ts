import { expect, test } from "@playwright/test";

// These tests change the shared database; the mobile project skips this file (playwright.config.ts).

test("today shows the child, the next appointment and the latest measurements", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Mây được");
  await expect(page.getByText("Lịch hẹn tiêm tiếp theo")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cân nặng" })).toBeVisible();
});

test("quick add leads to the measurement form", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Thêm nhanh" }).filter({ visible: true }).click();
  await page.getByRole("link", { name: /Thêm lần đo/ }).click();
  await expect(page).toHaveURL(/\/growth\/new$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Thêm lần đo");
});

test("a measurement with an invalid weight is refused, then saved once fixed", async ({ page }) => {
  await page.goto("/growth/new");
  await page.getByLabel("Ngày đo").fill("2026-11-01");
  await page.getByLabel("Cân nặng (kg)").fill("abc");
  await page.getByRole("button", { name: "Thêm lần đo" }).click();
  const weight = page.getByLabel("Cân nặng (kg)");
  await expect(weight).toHaveAttribute("aria-invalid", "true");
  await expect(weight).toHaveValue("abc");

  await weight.fill("10,05");
  await page.getByLabel("Chiều dài / cao (cm)").fill("79,8");
  await page.getByRole("button", { name: "Thêm lần đo" }).click();
  await expect(page).toHaveURL(/\/growth$/);
  const row = page.getByRole("row").filter({ hasText: "01/11/2026" });
  await expect(row).toContainText("10,05");
  await expect(row).toContainText("79,8");
});

test("a measurement can be deleted after confirming in a dialog", async ({ page }) => {
  await page.goto("/growth");
  await page.getByRole("link", { name: "Sửa lần đo 01/11/2026" }).click();
  await page.getByRole("button", { name: "Xoá lần đo này" }).click();
  const dialog = page.getByRole("alertdialog", { name: "Xoá lần đo 01/11/2026?" });
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: "Huỷ" }).click();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\/edit$/);

  await page.getByRole("button", { name: "Xoá lần đo này" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Xoá" }).click();
  await expect(page).toHaveURL(/\/growth$/);
  await expect(page.getByRole("row").filter({ hasText: "01/11/2026" })).toHaveCount(0);
});

test("recording a dose picks the vaccine from the list and books the next one", async ({
  page,
}) => {
  await page.goto("/vaccines/record");
  await page.getByRole("button", { name: /Vaccine/ }).click();
  await page.getByRole("option", { name: "Rotarix" }).click();
  const doseNumbers = page.getByLabel("Mũi số", { exact: true });
  await doseNumbers.first().fill("3");
  await doseNumbers.nth(1).fill("4");
  await page.getByLabel("Ngày tiêm").fill("2026-11-02");
  await page.getByLabel("Ngày hẹn").fill("2027-01-04");
  await page.getByRole("button", { name: "Ghi nhận mũi tiêm" }).click();

  await expect(page).toHaveURL(/\/vaccines$/);
  const history = page.getByRole("list", { name: /Lịch sử tiêm/ });
  await expect(history.getByRole("listitem").filter({ hasText: "02/11/2026" })).toContainText(
    "Rotarix · mũi 3",
  );
  const appointments = page.getByRole("list", { name: "Lịch hẹn" });
  await expect(appointments.getByRole("listitem").filter({ hasText: "04/01/2027" })).toContainText(
    "Rotarix · mũi 4",
  );
});

test("an appointment can be added, edited and deleted", async ({ page }) => {
  await page.goto("/vaccines/appointments/new");
  await page.getByRole("button", { name: /Vaccine/ }).click();
  await page.getByRole("option", { name: "Bexsero" }).click();
  await page.getByLabel("Mũi số").fill("4");
  await page.getByLabel("Ngày hẹn").fill("2027-05-10");
  await page.getByRole("button", { name: "Thêm lịch hẹn" }).click();
  await expect(page).toHaveURL(/\/vaccines$/);
  const appointments = page.getByRole("list", { name: "Lịch hẹn" });
  const item = appointments.getByRole("listitem").filter({ hasText: "Bexsero · mũi 4" });
  await expect(item).toContainText("10/05/2027");

  await item.getByRole("link", { name: "Sửa" }).click();
  await page.getByLabel("Ngày hẹn").fill("2027-05-17");
  await page.getByRole("button", { name: "Lưu lịch hẹn" }).click();
  await expect(item).toContainText("17/05/2027");

  await item.getByRole("link", { name: "Sửa" }).click();
  await page.getByRole("button", { name: "Xoá lịch hẹn này" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Xoá" }).click();
  await expect(page).toHaveURL(/\/vaccines$/);
  await expect(item).toHaveCount(0);
});

test("the calendar file lists appointments with generic titles only", async ({ request }) => {
  const res = await request.get("/calendar.ics");
  expect(res.headers()["content-type"]).toContain("text/calendar");
  const ics = await res.text();
  expect(ics).toContain("BEGIN:VEVENT");
  expect(ics).toContain("SUMMARY:Lịch tiêm cho bé");
  expect(ics).not.toContain("Mây");
});

test("the theme chosen in settings applies at once and survives a reload", async ({ page }) => {
  await page.goto("/settings");
  const html = page.locator("html");
  await expect(html).not.toHaveAttribute("data-theme");

  // The radio inputs are visually hidden inside their segment labels, as in a segmented button.
  await page.locator("label").filter({ hasText: "Tối" }).click();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("radio", { name: "Tối" })).toBeChecked();

  await page.locator("label").filter({ hasText: "Theo hệ thống" }).click();
  await expect(html).not.toHaveAttribute("data-theme");
  await page.reload();
  await expect(html).not.toHaveAttribute("data-theme");
});

test("the daylily palette applies at once and survives a reload", async ({ page }) => {
  await page.goto("/settings");
  const html = page.locator("html");
  await expect(html).not.toHaveAttribute("data-palette");

  await page.locator("label").filter({ hasText: "Huyên thảo" }).click();
  await expect(html).toHaveAttribute("data-palette", "daylily");
  await page.reload();
  await expect(html).toHaveAttribute("data-palette", "daylily");
  await expect(page.getByRole("radio", { name: "Huyên thảo" })).toBeChecked();
  // Only the daylily drawings show.
  await expect(page.locator(".flower-lotus").filter({ visible: true })).toHaveCount(0);
  await expect(page.locator(".flower-daylily").filter({ visible: true }).first()).toBeVisible();

  await page.locator("label").filter({ hasText: "Sen" }).click();
  await expect(html).not.toHaveAttribute("data-palette");
  await page.reload();
  await expect(html).not.toHaveAttribute("data-palette");
  await expect(page.locator(".flower-daylily").filter({ visible: true })).toHaveCount(0);
});

test("the language follows the browser and can be changed in settings", async ({ browser }) => {
  const context = await browser.newContext({ locale: "en-US" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Mây is");

  await page.goto("/settings");
  await page.locator("label").filter({ hasText: "Tiếng Việt" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cài đặt");
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "vi");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Mây được");
  await context.close();
});

test("form errors come in the page's language", async ({ browser }) => {
  const context = await browser.newContext({ locale: "en-US" });
  const page = await context.newPage();
  await page.goto("/growth/new");
  await page.getByLabel("Weight (kg)").fill("abc");
  await page.getByRole("button", { name: "Add measurement" }).click();
  await expect(page.getByText("The weight must be a number, for example 8.6.")).toBeVisible();
  await context.close();
});
