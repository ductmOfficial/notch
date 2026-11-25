"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** How often an open shared page checks its link while it is on screen. */
const EVERY_MS = 60_000;

/**
 * Checks the share link again when the page comes back into view and every minute while it
 * is on screen, so a page left open closes once the family revokes the link or it expires,
 * without a reload.
 */
export function ShareRefresh() {
  const router = useRouter();
  useEffect(() => {
    const check = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    const timer = window.setInterval(check, EVERY_MS);
    return () => {
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
      window.clearInterval(timer);
    };
  }, [router]);
  return null;
}
