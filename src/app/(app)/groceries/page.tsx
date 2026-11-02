import { createClient } from "@/lib/supabase/server";
import { getMyCouple } from "@/features/couple/queries";
import { GroceryList } from "@/features/groceries/GroceryList";
import { GROCERY_COLUMNS, type GroceryItem } from "@/features/groceries/types";

// Our shopping list. The list is loaded here on the server (fast first paint),
// then GroceryList keeps it live in the browser.
export default async function GroceriesPage() {
  const couple = (await getMyCouple())!;
  const supabase = await createClient();
  const { data } = await supabase.from("grocery_items").select(GROCERY_COLUMNS);

  return (
    <div className="space-y-4 pt-2">
      <header>
        <h1 className="text-2xl font-semibold">Our shopping list</h1>
        <p className="text-sm text-muted">Whoever&apos;s at the store, it&apos;s all here.</p>
      </header>
      <GroceryList
        coupleId={couple.id}
        meId={couple.me.id}
        partnerName={couple.partner?.displayName ?? null}
        initialItems={(data ?? []) as GroceryItem[]}
      />
    </div>
  );
}
