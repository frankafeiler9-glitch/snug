"use client";

import Link from "next/link";
import { useGroceries } from "@/features/groceries/useGroceries";
import type { GroceryItem } from "@/features/groceries/types";

// How many things are left to buy, kept live. Tap to open the list.
export function ShoppingCard({ coupleId, initialItems }: { coupleId: string; initialItems: GroceryItem[] }) {
  const { items } = useGroceries(coupleId, initialItems);
  const open = items
    .filter((i) => !i.is_checked)
    .sort((a, b) => b.created_at.localeCompare(a.created_at)); // newest first

  return (
    <Link href="/groceries" className="block rounded-3xl bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Our shopping list</h2>
        {open.length > 0 && (
          <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-accent px-2.5 text-sm font-semibold text-accent-foreground">
            {open.length}
          </span>
        )}
      </div>
      {open.length === 0 ? (
        <p className="mt-2">All stocked up. Nothing to buy.</p>
      ) : (
        <p className="mt-2 text-muted">
          {open.length === 1 ? "1 thing to buy: " : `${open.length} things to buy, like `}
          <span className="text-foreground">
            {open.slice(0, 3).map((i) => i.name).join(", ")}
            {open.length > 3 && "…"}
          </span>
        </p>
      )}
      <p className="mt-3 text-sm text-accent">Open the list →</p>
    </Link>
  );
}
