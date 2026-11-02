"use client";

import { useEffect, useRef, useState } from "react";
import { CATEGORIES, categoryInfo, guessCategory, type CategoryKey } from "./categories";
import { useGroceries } from "./useGroceries";
import type { GroceryItem } from "./types";

type Props = {
  coupleId: string;
  meId: string;
  partnerName: string | null;
  initialItems: GroceryItem[];
};

export function GroceryList({ coupleId, meId, partnerName, initialItems }: Props) {
  const { items, error, add, toggle, remove, clearChecked } = useGroceries(coupleId, initialItems);

  const toBuy = items.filter((i) => !i.is_checked);
  const done = items.filter((i) => i.is_checked);

  // Group the "to buy" items by category, in store-walking order.
  const groups = CATEGORIES.map((c) => ({
    ...c,
    items: toBuy
      .filter((i) => categoryInfo(i.category).key === c.key)
      .sort((a, b) => a.created_at.localeCompare(b.created_at)),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-5">
      <AddItem onAdd={(name, category) => add(name, category, meId)} />

      {error && <p className="rounded-2xl bg-accent/10 p-3 text-sm text-accent">{error}</p>}

      {toBuy.length === 0 && (
        <p className="py-6 text-center text-muted">
          {done.length > 0 ? "All done. Nice teamwork 🧺" : "Nothing on the list. Add the first thing above."}
        </p>
      )}

      {groups.map((group) => (
        <section key={group.key}>
          <h2 className="mb-2 px-1 text-sm font-medium text-muted">
            {group.emoji} {group.label}
          </h2>
          <ul className="overflow-hidden rounded-3xl bg-surface shadow-sm">
            {group.items.map((item) => (
              <Row
                key={item.id}
                item={item}
                addedBy={item.created_by && item.created_by !== meId ? partnerName : null}
                onToggle={() => toggle(item.id)}
                onRemove={() => remove(item.id)}
              />
            ))}
          </ul>
        </section>
      ))}

      {done.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-sm font-medium text-muted">In the basket</h2>
            <button onClick={clearChecked} className="rounded-full bg-surface px-3 py-1 text-sm text-accent shadow-sm">
              Clear {done.length} done
            </button>
          </div>
          <ul className="overflow-hidden rounded-3xl bg-surface/60">
            {done.map((item) => (
              <Row key={item.id} item={item} addedBy={null} onToggle={() => toggle(item.id)} onRemove={() => remove(item.id)} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

// One line on the list: tap the circle (or the name) to tick it off.
function Row({ item, addedBy, onToggle, onRemove }: {
  item: GroceryItem;
  addedBy: string | null;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <li className="flex items-center gap-3 border-b border-border px-4 last:border-b-0">
      <button
        onClick={onToggle}
        aria-label={item.is_checked ? `Put ${item.name} back on the list` : `Tick off ${item.name}`}
        className="flex min-h-14 flex-1 items-center gap-3 text-left"
      >
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-sm transition ${
            item.is_checked ? "border-accent bg-accent text-accent-foreground" : "border-border"
          }`}
        >
          {item.is_checked && "✓"}
        </span>
        <span className={item.is_checked ? "text-muted line-through" : ""}>
          {item.name}
          {addedBy && <span className="ml-2 text-xs text-partner">from {addedBy}</span>}
        </span>
      </button>
      <button onClick={onRemove} aria-label={`Remove ${item.name}`} className="-mr-2 p-2 text-lg text-muted/60">
        ×
      </button>
    </li>
  );
}

// The "add something" box with category chips underneath.
function AddItem({ onAdd }: { onAdd: (name: string, category: CategoryKey) => void }) {
  const [name, setName] = useState("");
  // null = use our automatic guess; set when you tap a chip yourself.
  const [picked, setPicked] = useState<CategoryKey | null>(null);
  const category = picked ?? guessCategory(name);

  // Keep the chosen category chip in view (the row scrolls sideways).
  const chipsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chipsRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [category]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name, category);
    setName("");
    setPicked(null);
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add something…"
          maxLength={80}
          enterKeyHint="done"
          className="h-12 min-w-0 flex-1 rounded-full bg-surface px-5 text-base shadow-sm outline-none focus:ring-2 focus:ring-accent/40"
        />
        <button
          type="submit"
          aria-label="Add to list"
          disabled={!name.trim()}
          className="h-12 w-12 shrink-0 rounded-full bg-accent text-2xl text-accent-foreground transition disabled:opacity-40"
        >
          +
        </button>
      </div>
      {name.trim() && (
        <div ref={chipsRef} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              data-active={c.key === category}
              onClick={() => setPicked(c.key)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm transition ${
                c.key === category ? "bg-accent text-accent-foreground" : "bg-surface text-muted shadow-sm"
              }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
