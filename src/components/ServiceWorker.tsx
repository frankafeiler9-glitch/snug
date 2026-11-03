"use client";

import { useEffect } from "react";

// Starts the service worker (public/sw.js) once the page has loaded.
// Only in the real (production) app; during development it would just get in the way.
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Not critical: the app works without it, just not offline.
    });
  }, []);
  return null;
}
