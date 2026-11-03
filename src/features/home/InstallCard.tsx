"use client";

import { useEffect, useState } from "react";

// Chrome/Android's "install this app" event (not in TypeScript's built-in types).
type InstallPromptEvent = Event & { prompt: () => Promise<void> };

const DISMISSED_KEY = "snug:install-card-dismissed";

/**
 * A gentle "Add Snug to your home screen" card on the home screen.
 * - Android/Chrome: a button that opens the real install dialog.
 * - iPhone/iPad Safari: short instructions (Apple doesn't allow a button).
 * Hidden once Snug is installed, or after tapping "Not now".
 */
export function InstallCard() {
  const [mode, setMode] = useState<"hidden" | "button" | "ios">("hidden");
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const installed =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISSED_KEY) === "1";
    } catch {
      // Private browsing etc.: just show the card.
    }
    if (installed || dismissed) return;

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIOS) setMode("ios");

    const onPrompt = (e: Event) => {
      e.preventDefault(); // we'll show our own button instead of the browser's banner
      setPromptEvent(e as InstallPromptEvent);
      setMode("button");
    };
    const onInstalled = () => setMode("hidden");
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    setMode("hidden");
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {}
  }

  if (mode === "hidden") return null;

  return (
    <section className="rounded-3xl bg-surface p-5 shadow-sm">
      <h2 className="font-semibold">Keep Snug on your home screen</h2>
      {mode === "ios" ? (
        <p className="mt-1 text-sm text-muted">
          In Safari, tap the <strong>Share</strong> button (the square with an arrow), then{" "}
          <strong>Add to Home Screen</strong>.
        </p>
      ) : (
        <p className="mt-1 text-sm text-muted">Open it like any other app, full-screen, in one tap.</p>
      )}
      <div className="mt-3 flex gap-2">
        {mode === "button" && promptEvent && (
          <button
            onClick={async () => {
              await promptEvent.prompt();
              setMode("hidden");
            }}
            className="h-10 flex-1 rounded-full bg-accent text-sm font-medium text-accent-foreground"
          >
            Add to home screen
          </button>
        )}
        <button onClick={dismiss} className="h-10 flex-1 rounded-full text-sm text-muted">
          Not now
        </button>
      </div>
    </section>
  );
}
