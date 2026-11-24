import type { MetadataRoute } from "next";

import { vi } from "../lib/i18n/messages";

/**
 * The web app manifest, so Notch installs on a phone's home screen and opens without the
 * browser bar. Served without a session (proxy.ts): it holds nothing about the family.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Notch",
    short_name: "Notch",
    description: vi["app.description"],
    lang: "vi",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fff8f2",
    theme_color: "#fff8f2",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
