"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { EVENT_COLUMNS, type CalendarEvent } from "./types";

export type EventDraft = Omit<CalendarEvent, "id" | "created_by"> & { id?: string };

/**
 * Loads the couple's events between `from` and `to` and keeps them live.
 * Same pattern as the grocery list (see useGroceries.ts):
 * optimistic changes + Supabase Realtime + reload when the app reopens.
 */
export function useEvents(coupleId: string, from: Date, to: Date) {
  const supabase = useMemo(() => createClient(), []);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dates as strings so the effects below only re-run when the range really changes.
  const fromIso = from.toISOString();
  const toIso = to.toISOString();

  const reload = useCallback(async () => {
    // Anything that overlaps the range: starts before it ends, ends after it starts.
    const { data, error } = await supabase
      .from("events")
      .select(EVENT_COLUMNS)
      .lt("starts_at", toIso)
      .gte("ends_at", fromIso)
      .order("starts_at");
    if (!error && data) setEvents(data as CalendarEvent[]);
    setLoading(false);
  }, [supabase, fromIso, toIso]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    const upsert = (row: CalendarEvent) => setEvents((list) => [...list.filter((e) => e.id !== row.id), row]);
    const filter = `couple_id=eq.${coupleId}`;

    const channel = supabase
      .channel(`events:${coupleId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "events", filter }, (c) => upsert(c.new as CalendarEvent))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "events", filter }, (c) => upsert(c.new as CalendarEvent))
      // Deletes can't be filtered by couple; the payload is just an id, unknown ids are ignored.
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "events" }, (c) => {
        const goneId = (c.old as { id?: string }).id;
        if (goneId) setEvents((list) => list.filter((e) => e.id !== goneId));
      })
      .subscribe((status) => status === "SUBSCRIBED" && reload());

    const onVisible = () => document.visibilityState === "visible" && reload();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(channel);
    };
  }, [supabase, coupleId, reload]);

  async function optimistic(change: (list: CalendarEvent[]) => CalendarEvent[], save: () => PromiseLike<{ error: unknown }>) {
    setEvents(change);
    setError(null);
    const { error } = await save();
    if (error) {
      setError("Couldn't save that. Check your connection and try again.");
      reload();
    }
  }

  /** Create a new event, or update it if the draft has an id. */
  function save(draft: EventDraft, meId: string) {
    const { id, ...fields } = draft;
    if (id) {
      return optimistic(
        (list) => list.map((e) => (e.id === id ? { ...e, ...fields } : e)),
        () => supabase.from("events").update(fields).eq("id", id),
      );
    }
    const newId = crypto.randomUUID();
    return optimistic(
      (list) => [...list, { ...fields, id: newId, created_by: meId }],
      () => supabase.from("events").insert({ ...fields, id: newId }),
    );
  }

  function remove(id: string) {
    return optimistic(
      (list) => list.filter((e) => e.id !== id),
      () => supabase.from("events").delete().eq("id", id),
    );
  }

  const sorted = [...events].sort((a, b) =>
    a.all_day === b.all_day ? a.starts_at.localeCompare(b.starts_at) : a.all_day ? -1 : 1,
  );
  return { events: sorted, loading, error, save, remove };
}
