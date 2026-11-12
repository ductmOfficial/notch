import { expect, test as setup } from "@playwright/test";

import { PARENT, SIGNED_IN } from "./constants";
import { signInLink } from "./mail";

setup("sign in with a magic link", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.getByLabel("Email").fill(PARENT);
  await page.getByRole("button", { name: "Gửi link đăng nhập" }).click();
  await expect(page.getByRole("status")).toContainText(PARENT);

  await page.goto(await signInLink(PARENT));
  await expect(page.locator("main h1")).toContainText("Mây");
  await page.context().storageState({ path: SIGNED_IN });
});
