"use client";

import { useState } from "react";
import { addDays, fromInputs, toDateInput, toTimeInput } from "@/lib/dates";
import type { Person } from "@/features/couple/queries";
import type { EventDraft } from "./useEvents";
import { WHOSE_STYLE, type CalendarEvent, type Whose } from "./types";

type Props = {
  /** An existing event to edit, or a starting point for a new one. */
  initial: CalendarEvent | { starts_at: string; ends_at: string };
  me: Person;
  partner: Person | null;
  onSave: (draft: EventDraft) => void;
  onDelete?: () => void;
};

export function EventForm({ initial, me, partner, onSave, onDelete }: Props) {
  const existing = "id" in initial ? initial : null;
  const start = new Date(initial.starts_at);
  const end = new Date(initial.ends_at);
  const wasAllDay = existing?.all_day ?? false;

  const [title, setTitle] = useState(existing?.title ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [whose, setWhose] = useState<Whose>(
    !existing || existing.owner_id === null ? "ours" : existing.owner_id === me.id ? "mine" : "theirs",
  );
  const [allDay, setAllDay] = useState(wasAllDay);
  const [date, setDate] = useState(toDateInput(start));
  // All-day events store the day *after* the last day as their end, so step back one day here.
  const [endDate, setEndDate] = useState(toDateInput(wasAllDay ? addDays(end, -1) : end));
  const [startTime, setStartTime] = useState(toTimeInput(start));
  const [endTime, setEndTime] = useState(toTimeInput(end));
  const [problem, setProblem] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setProblem("Give it a little name first.");

    let startsAt: Date, endsAt: Date;
    if (allDay) {
      startsAt = fromInputs(date);
      endsAt = addDays(fromInputs(endDate < date ? date : endDate), 1);
    } else {
      startsAt = fromInputs(date, startTime);
      endsAt = fromInputs(date, endTime);
      // Ends earlier than it starts? Then it goes past midnight (e.g. 22:00 → 01:00).
      if (endsAt < startsAt) endsAt = addDays(endsAt, 1);
    }

    onSave({
      id: existing?.id,
      title: title.trim(),
      notes: notes.trim() || null,
      all_day: allDay,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      owner_id: whose === "ours" ? null : whose === "mine" ? me.id : partner!.id,
    });
  }

  const whoseOptions: { key: Whose; label: string }[] = [
    { key: "mine", label: "Just me" },
    ...(partner ? [{ key: "theirs" as const, label: `Just ${partner.displayName}` }] : []),
    { key: "ours", label: "Both of us" },
  ];
  const field = "h-12 w-full rounded-2xl border border-border bg-surface px-4 text-base outline-none focus:border-accent";

  return (
    <form onSubmit={submit} className="space-y-4">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What's happening?"
        maxLength={100}
        autoFocus={!existing}
        className={`${field} text-lg`}
      />

      <div>
        <span className="mb-1 block text-sm text-muted">Who&apos;s it for?</span>
        <div className="flex gap-2">
          {whoseOptions.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => setWhose(o.key)}
              className={`h-11 flex-1 truncate rounded-full px-2 text-sm font-medium transition ${
                whose === o.key ? `${WHOSE_STYLE[o.key].dot} text-white` : "bg-surface text-muted shadow-sm"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3 shadow-sm">
        <span>All day</span>
        <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="h-5 w-5 accent-[var(--accent)]" />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="col-span-2 block">
          <span className="mb-1 block text-sm text-muted">{allDay ? "From" : "Day"}</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={field} />
        </label>
        {allDay ? (
          <label className="col-span-2 block">
            <span className="mb-1 block text-sm text-muted">Until</span>
            <input type="date" value={endDate} min={date} onChange={(e) => setEndDate(e.target.value)} required className={field} />
          </label>
        ) : (
          <>
            <label className="block">
              <span className="mb-1 block text-sm text-muted">Starts</span>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className={field} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-muted">Ends</span>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required className={field} />
            </label>
          </>
        )}
      </div>

      <label className="block">
        <span className="mb-1 block text-sm text-muted">Notes (optional)</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={1000}
          rows={2}
          className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-accent"
        />
      </label>

      {problem && <p className="text-sm text-accent">{problem}</p>}

      <button type="submit" className="h-12 w-full rounded-full bg-accent font-medium text-accent-foreground">
        {existing ? "Save changes" : "Add to our week"}
      </button>
      {onDelete && (
        <button type="button" onClick={onDelete} className="h-11 w-full rounded-full text-sm text-muted">
          Remove this event
        </button>
      )}
    </form>
  );
}
