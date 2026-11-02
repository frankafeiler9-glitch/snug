// Shared by server and browser code (so not in a "use client" file).

export type CalendarEvent = {
  id: string;
  title: string;
  notes: string | null;
  starts_at: string; // ISO timestamp
  ends_at: string;
  all_day: boolean;
  owner_id: string | null; // null = ours
  created_by: string | null;
};

export const EVENT_COLUMNS = "id, title, notes, starts_at, ends_at, all_day, owner_id, created_by";

/** Who an event belongs to, from the point of view of whoever is looking. */
export type Whose = "mine" | "theirs" | "ours";

export function whoseEvent(event: Pick<CalendarEvent, "owner_id">, meId: string): Whose {
  if (event.owner_id === null) return "ours";
  return event.owner_id === meId ? "mine" : "theirs";
}

/** Tailwind classes per owner. Colors come from the tokens in globals.css. */
export const WHOSE_STYLE: Record<Whose, { dot: string; soft: string; text: string }> = {
  mine: { dot: "bg-me", soft: "bg-me/15", text: "text-me" },
  theirs: { dot: "bg-partner", soft: "bg-partner/15", text: "text-partner" },
  ours: { dot: "bg-accent", soft: "bg-accent/15", text: "text-accent" },
};
