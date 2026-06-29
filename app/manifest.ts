import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Budget Friendly — split any amount, your way",
    short_name: "Budget Friendly",
    description:
      "A flexible percentage budget calculator. Start at 100%, carve it into your own named splits, and see the real amounts.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait-primary",
    lang: "en",
    dir: "ltr",
    categories: ["finance", "productivity", "utilities"],
    background_color: "#f0f0f0",
    theme_color: "#f2f2f2",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
