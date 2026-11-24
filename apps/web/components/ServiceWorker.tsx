"use client";

import { useEffect } from "react";

/** Registers public/sw.js in production builds, for installing the app and an offline page. */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Without it the app works as a plain website.
    });
  }, []);
  return null;
}
