"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GROCERY_COLUMNS, type GroceryItem } from "./types";


/**
 * Keeps the shared grocery list in sync.
 *
 * - Your own changes show up instantly ("optimistic"), then get saved.
 *   If saving fails, the list reloads from the server and `error` explains why.
 * - Your partner's changes arrive through Supabase Realtime.
 * - When the app comes back to the foreground (phones pause connections in
 *   the background), we reload the list so nothing is missed.
 */
export function useGroceries(coupleId: string, initialItems: GroceryItem[]) {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const { data } = await supabase.from("grocery_items").select(GROCERY_COLUMNS);
    if (data) setItems(data as GroceryItem[]);
  }, [supabase]);

  // Replace an item if we have it already (e.g. our own optimistic copy), else add it.
  const upsert = (row: GroceryItem) => setItems((list) => [...list.filter((i) => i.id !== row.id), row]);

  // ─── Live updates from your partner ──────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(`groceries:${coupleId}`)
      // New and changed items (only ours, thanks to the filter + row-level security).
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "grocery_items", filter: `couple_id=eq.${coupleId}` },
        (change) => upsert(change.new as GroceryItem),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "grocery_items", filter: `couple_id=eq.${coupleId}` },
        (change) => upsert(change.new as GroceryItem),
      )
      // Deleted items. Supabase can't filter deletes by couple, so this only
      // carries the deleted item's id; ids that aren't on our list are ignored.
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "grocery_items" },
        (change) => {
          const goneId = (change.old as { id?: string }).id;
          if (goneId) setItems((list) => list.filter((i) => i.id !== goneId));
        },
      )
      .subscribe((status) => {
        // (Re)connected: catch up on anything that changed while we were away.
        if (status === "SUBSCRIBED") reload();
      });

    const onVisible = () => document.visibilityState === "visible" && reload();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(channel);
    };
  }, [supabase, coupleId, reload]);

  // Apply a change locally right away. If the database says no, reload the
  // real list from the server (that undoes the change) and show a message.
  async function optimistic(
    change: (list: GroceryItem[]) => GroceryItem[],
    save: () => PromiseLike<{ error: { message: string } | null }>,
  ) {
    setItems(change);
    setError(null);
    const { error } = await save();
    if (error) {
      setError("Couldn't save that. Check your connection and try again.");
      reload();
    }
  }

  // ─── Actions ─────────────────────────────────────────────────────────
  function add(name: string, category: string, meId: string) {
    const item: GroceryItem = {
      id: crypto.randomUUID(), // made here so the realtime echo matches this item
      name: name.trim(),
      category,
      is_checked: false,
      checked_by: null,
      created_by: meId,
      created_at: new Date().toISOString(),
    };
    return optimistic(
      (list) => [...list, item],
      () => supabase.from("grocery_items").insert({ id: item.id, name: item.name, category }),
    );
  }

  function toggle(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const is_checked = !item.is_checked;
    return optimistic(
      (list) => list.map((i) => (i.id === id ? { ...i, is_checked } : i)),
      () => supabase.from("grocery_items").update({ is_checked }).eq("id", id),
    );
  }

  function remove(id: string) {
    return optimistic(
      (list) => list.filter((i) => i.id !== id),
      () => supabase.from("grocery_items").delete().eq("id", id),
    );
  }

  function clearChecked() {
    const ids = items.filter((i) => i.is_checked).map((i) => i.id);
    if (ids.length === 0) return;
    return optimistic(
      (list) => list.filter((i) => !i.is_checked),
      () => supabase.from("grocery_items").delete().in("id", ids),
    );
  }

  return { items, error, add, toggle, remove, clearChecked };
}
