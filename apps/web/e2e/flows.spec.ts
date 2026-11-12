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
