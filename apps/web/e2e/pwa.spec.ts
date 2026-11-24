import { expect, request, test } from "@playwright/test";

import { PORT } from "./constants";

test("what installs the app is served without a session and holds no data", async () => {
  const anonymous = await request.newContext({ baseURL: `http://localhost:${String(PORT)}` });
  const manifest = await anonymous.get("/manifest.webmanifest");
  expect(manifest.ok()).toBe(true);
  const body = (await manifest.json()) as {
    name: string;
    display: string;
    icons: { src: string; purpose: string }[];
  };
  expect(body).toMatchObject({ name: "Notch", display: "standalone" });
  expect(body.icons.map((i) => i.purpose)).toEqual(["any", "any", "maskable"]);
  for (const { src } of body.icons) {
    const icon = await anonymous.get(src);
    expect(icon.headers()["content-type"]).toBe("image/png");
  }
  expect((await anonymous.get("/apple-icon.png")).ok()).toBe(true);
  const worker = await anonymous.get("/sw.js");
  expect(worker.headers()["content-type"]).toContain("javascript");
  expect(worker.headers()["cache-control"]).toBe("no-cache");
  const offline = await anonymous.get("/offline");
  expect(offline.ok()).toBe(true);
  expect(await offline.text()).not.toContain("Mây");
  await anonymous.dispose();
});

test("the service worker shows the offline page when the network is gone", async ({
  page,
  context,
}) => {
  await page.goto("/");
  const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
  expect(scope).toMatch(/\/$/);
  // The worker takes over this page; a reload puts it in charge of navigations.
  await page.reload();
  await context.setOffline(true);
  await page.goto("/growth").catch(() => undefined);
  await expect(page.getByRole("heading", { name: "Không có mạng" })).toBeVisible();
  await expect(page.getByText("không được lưu trên máy này")).toBeVisible();
  await context.setOffline(false);
});
