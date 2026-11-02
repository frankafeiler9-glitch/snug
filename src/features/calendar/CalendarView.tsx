"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import type { Person } from "@/features/couple/queries";
import {
  addDays, addMonths, formatDayMonth, formatLongDay, formatMonthYear, formatTime, formatWeekday,
  isSameDay, monthGrid, overlapsDay, startOfDay, weekDays,
} from "@/lib/dates";
import { EventForm } from "./EventForm";
import { useEvents } from "./useEvents";
import { WHOSE_STYLE, whoseEvent, type CalendarEvent } from "./types";

type Props = { coupleId: string; me: Person; partner: Person | null };
type Editing = CalendarEvent | { starts_at: string; ends_at: string } | null;

export function CalendarView(props: Props) {
  // Dates depend on the phone's clock and time zone, so only draw the calendar
  // in the browser (the server doesn't know what "today" is for you).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <p className="py-10 text-center text-muted">Opening your calendar…</p>;
  return <Calendar {...props} />;
}

function Calendar({ coupleId, me, partner }: Props) {
  const today = startOfDay(new Date());
  const [view, setView] = useState<"week" | "month">("week");
  const [anchor, setAnchor] = useState(today); // any day inside the week/month being shown
  const [selected, setSelected] = useState(today); // highlighted day in month view
  const [editing, setEditing] = useState<Editing>(null);

  const days = view === "week" ? weekDays(anchor) : monthGrid(anchor);
  const { events, error, save, remove } = useEvents(coupleId, days[0], addDays(days[days.length - 1], 1));
  const eventsOn = (day: Date) =>
    events.filter((e) => overlapsDay(new Date(e.starts_at), new Date(e.ends_at), day));

  function step(direction: 1 | -1) {
    setAnchor(view === "week" ? addDays(anchor, 7 * direction) : addMonths(anchor, direction));
  }

  // A new event on `day`, starting at the next full hour, lasting an hour.
  function newEvent(day: Date) {
    const now = new Date();
    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), isSameDay(day, now) ? now.getHours() + 1 : 18);
    setEditing({ starts_at: start.toISOString(), ends_at: new Date(start.getTime() + 3600_000).toISOString() });
  }

  const name = (e: CalendarEvent) => {
    const w = whoseEvent(e, me.id);
    return w === "ours" ? "Ours" : w === "mine" ? "Mine" : `${partner?.displayName ?? "Partner"}'s`;
  };

  const rangeLabel =
    view === "week" ? `${formatDayMonth(days[0])} – ${formatDayMonth(days[6])}` : formatMonthYear(anchor);

  return (
    <div className="space-y-4">
      {/* Week / Month switch */}
      <div className="flex rounded-full bg-surface p-1 shadow-sm">
        {(["week", "month"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`h-9 flex-1 rounded-full text-sm font-medium capitalize transition ${
              view === v ? "bg-accent text-accent-foreground" : "text-muted"
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Previous / next / today */}
      <div className="flex items-center gap-2">
        <button onClick={() => step(-1)} aria-label="Previous" className="h-10 w-10 rounded-full bg-surface text-lg shadow-sm">‹</button>
        <p className="flex-1 text-center font-medium">{rangeLabel}</p>
        <button onClick={() => step(1)} aria-label="Next" className="h-10 w-10 rounded-full bg-surface text-lg shadow-sm">›</button>
        <button
          onClick={() => { setAnchor(today); setSelected(today); }}
          className="h-10 rounded-full bg-surface px-3 text-sm text-accent shadow-sm"
        >
          Today
        </button>
      </div>

      {/* Colour key */}
      <div className="flex justify-center gap-4 text-xs text-muted">
        <Legend className={WHOSE_STYLE.mine.dot} label="Mine" />
        {partner && <Legend className={WHOSE_STYLE.theirs.dot} label={`${partner.displayName}'s`} />}
        <Legend className={WHOSE_STYLE.ours.dot} label="Ours" />
      </div>

      {error && <p className="rounded-2xl bg-accent/10 p-3 text-sm text-accent">{error}</p>}

      {view === "week" ? (
        <div className="space-y-2">
          {days.map((day) => (
            <DayCard
              key={day.toISOString()}
              day={day}
              isToday={isSameDay(day, today)}
              events={eventsOn(day)}
              meId={me.id}
              ownerLabel={name}
              onAdd={() => newEvent(day)}
              onOpen={setEditing}
            />
          ))}
        </div>
      ) : (
        <>
          <MonthGrid
            days={days}
            month={anchor.getMonth()}
            today={today}
            selected={selected}
            onSelect={setSelected}
            dotsFor={(day) => eventsOn(day).map((e) => WHOSE_STYLE[whoseEvent(e, me.id)].dot)}
          />
          <DayCard
            day={selected}
            isToday={isSameDay(selected, today)}
            events={eventsOn(selected)}
            meId={me.id}
            ownerLabel={name}
            onAdd={() => newEvent(selected)}
            onOpen={setEditing}
            long
          />
        </>
      )}

      {/* Floating add button, above the tab bar */}
      <button
        onClick={() => newEvent(view === "month" ? selected : isSameDay(startOfDay(anchor), today) ? today : days[0])}
        aria-label="Add an event"
        className="fixed right-5 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 h-14 w-14 rounded-full bg-accent text-3xl text-accent-foreground shadow-lg"
      >
        +
      </button>

      <Sheet open={editing !== null} onClose={() => setEditing(null)} title={editing && "id" in editing ? "Edit plan" : "New plan"}>
        {editing && (
          <EventForm
            key={"id" in editing ? editing.id : editing.starts_at}
            initial={editing}
            me={me}
            partner={partner}
            onSave={(draft) => { save(draft, me.id); setEditing(null); }}
            onDelete={
              "id" in editing
                ? () => {
                    if (confirm(`Remove "${editing.title}"?`)) { remove(editing.id); setEditing(null); }
                  }
                : undefined
            }
          />
        )}
      </Sheet>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${className}`} /> {label}
    </span>
  );
}

// One day with its events (used for every day in week view, and the picked day in month view).
function DayCard({ day, isToday, events, meId, ownerLabel, onAdd, onOpen, long = false }: {
  day: Date;
  isToday: boolean;
  events: CalendarEvent[];
  meId: string;
  ownerLabel: (e: CalendarEvent) => string;
  onAdd: () => void;
  onOpen: (e: CalendarEvent) => void;
  long?: boolean;
}) {
  return (
    <section className={`flex gap-3 rounded-3xl bg-surface p-3 shadow-sm ${isToday ? "ring-2 ring-accent/40" : ""}`}>
      <div className="w-12 shrink-0 pt-1 text-center">
        <p className={`text-xs ${isToday ? "text-accent" : "text-muted"}`}>{formatWeekday(day)}</p>
        <p className={`mx-auto mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-lg font-semibold ${isToday ? "bg-accent text-accent-foreground" : ""}`}>
          {day.getDate()}
        </p>
      </div>
      <div className="min-w-0 flex-1 space-y-1.5 py-1">
        {long && <p className="text-sm font-medium">{formatLongDay(day)}</p>}
        {events.map((e) => {
          const style = WHOSE_STYLE[whoseEvent(e, meId)];
          return (
            <button key={e.id} onClick={() => onOpen(e)} className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left ${style.soft}`}>
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{e.title}</span>
                <span className="block text-xs text-muted">
                  {e.all_day ? "All day" : `${formatTime(new Date(e.starts_at))} – ${formatTime(new Date(e.ends_at))}`}
                  {" · "}
                  <span className={style.text}>{ownerLabel(e)}</span>
                </span>
              </span>
            </button>
          );
        })}
        <button onClick={onAdd} className="w-full rounded-2xl px-3 py-1.5 text-left text-sm text-muted">
          {events.length === 0 ? "Free · tap to add something" : "+ Add"}
        </button>
      </div>
    </section>
  );
}

// The month grid: 6 rows of 7 days, with a coloured dot per event.
function MonthGrid({ days, month, today, selected, onSelect, dotsFor }: {
  days: Date[];
  month: number;
  today: Date;
  selected: Date;
  onSelect: (d: Date) => void;
  dotsFor: (d: Date) => string[];
}) {
  return (
    <div className="rounded-3xl bg-surface p-3 shadow-sm">
      <div className="mb-1 grid grid-cols-7 text-center text-xs text-muted">
        {days.slice(0, 7).map((d) => <span key={d.toISOString()}>{formatWeekday(d).slice(0, 2)}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day) => {
          const dots = dotsFor(day);
          const isSelected = isSameDay(day, selected);
          const isToday = isSameDay(day, today);
          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelect(day)}
              aria-label={formatLongDay(day)}
              className={`flex h-12 flex-col items-center justify-start gap-1 rounded-2xl pt-1 ${isSelected ? "bg-accent/10" : ""} ${day.getMonth() !== month ? "opacity-35" : ""}`}
            >
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${isToday ? "bg-accent font-semibold text-accent-foreground" : ""}`}>
                {day.getDate()}
              </span>
              <span className="flex gap-0.5">
                {dots.slice(0, 3).map((c, i) => <span key={i} className={`h-1.5 w-1.5 rounded-full ${c}`} />)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
