"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Person } from "@/features/couple/queries";
import { EventChip } from "@/features/calendar/EventChip";
import { useEvents } from "@/features/calendar/useEvents";
import { addDays, formatLongDay, startOfDay } from "@/lib/dates";

// Today's plans on the home screen, kept live.
export function TodayCard(props: { coupleId: string; me: Person; partner: Person | null }) {
  // "Today" depends on the phone's clock, so only show this in the browser.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <section className="rounded-3xl bg-surface p-5 shadow-sm">
      {mounted ? <Today {...props} /> : <p className="text-muted">Looking at your day…</p>}
    </section>
  );
}

function Today({ coupleId, me, partner }: { coupleId: string; me: Person; partner: Person | null }) {
  const [today] = useState(() => startOfDay(new Date()));
  const { events, loading } = useEvents(coupleId, today, addDays(today, 1));
  // Hide plans that already ended earlier today (keeps the card about what's ahead).
  const now = new Date();
  const ahead = events.filter((e) => e.all_day || new Date(e.ends_at) > now);
  const done = events.length - ahead.length;

  return (
    <>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-semibold">Today</h2>
        <p className="text-xs text-muted">{formatLongDay(today)}</p>
      </div>

      {loading ? (
        <p className="text-muted">Looking at your day…</p>
      ) : ahead.length === 0 ? (
        <p>{done > 0 ? "That's everything for today. Time to unwind 🛋️" : "Nothing planned. A slow day, maybe? ☕"}</p>
      ) : (
        <ul className="space-y-1.5">
          {ahead.map((e) => (
            <li key={e.id}>
              <Link href="/calendar">
                <EventChip event={e} meId={me.id} partnerName={partner?.displayName ?? null} />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link href="/calendar" className="mt-3 block text-sm text-accent">
        See your week →
      </Link>
    </>
  );
}
