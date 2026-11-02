import type { MetadataRoute } from "next";

// The PWA manifest: tells phones how to install the app on the home screen.
// Next.js serves this at /manifest.webmanifest automatically.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Snug",
    short_name: "Snug",
    description: "One shared space for the two of you.",
    start_url: "/",
    display: "standalone",
    background_color: "#fdf8f6",
    theme_color: "#fdf8f6",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
