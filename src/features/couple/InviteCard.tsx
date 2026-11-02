"use client";

import { useState } from "react";
import { refreshInviteCode } from "./actions";

// Shown on the home screen until your partner has joined.
export function InviteCard({ code, expiresAt }: { code: string | null; expiresAt: string | null }) {
  const [copied, setCopied] = useState(false);
  const expired = !code || (expiresAt !== null && new Date(expiresAt) < new Date());

  async function share() {
    const link = `${window.location.origin}/join/${code}`;
    const text = `Come join me on Snug 💕 Open this link, or use the code ${code}`;
    // On phones this opens the share sheet (Messages, WhatsApp…). Otherwise copy.
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join me on Snug", text, url: link });
        return;
      } catch {
        // User closed the share sheet. That's fine.
        return;
      }
    }
    await navigator.clipboard.writeText(`${text}\n${link}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="rounded-3xl bg-accent/10 p-5">
      <h2 className="font-semibold">Invite your partner</h2>
      {expired ? (
        <>
          <p className="mt-1 text-sm text-muted">Your invite code has expired.</p>
          <form action={refreshInviteCode} className="mt-3">
            <button className="h-11 w-full rounded-full bg-accent font-medium text-accent-foreground">
              Get a new code
            </button>
          </form>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted">
            Send them a link, or let them type in this code after signing up.
          </p>
          <p className="my-4 text-center font-mono text-3xl font-semibold tracking-[0.3em]">{code}</p>
          <button
            onClick={share}
            className="h-11 w-full rounded-full bg-accent font-medium text-accent-foreground"
          >
            {copied ? "Copied! ✓" : "Share invite link"}
          </button>
        </>
      )}
    </section>
  );
}
