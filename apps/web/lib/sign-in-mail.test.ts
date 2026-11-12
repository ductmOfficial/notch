import { describe, expect, it } from "vitest";

import { signInMail } from "./sign-in-mail";

describe("signInMail", () => {
  const url = "https://notch.example/api/auth/magic-link/verify?token=abc&callbackURL=%2F";

  it("carries the link in text and HTML, escaped in HTML", () => {
    const mail = signInMail(url, "vi", 10);
    expect(mail.text).toContain(url);
    expect(mail.html).toContain(url.replace("&", "&#38;"));
    expect(mail.text).toContain("10 phút");
  });

  it("follows the language", () => {
    expect(signInMail(url, "en", 10).subject).toBe("Sign in to Notch");
    expect(signInMail(url, "vi", 10).subject).toBe("Đăng nhập Notch");
  });
});
