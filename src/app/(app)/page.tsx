import { logOut } from "../(auth)/actions";
import { createClient } from "@/lib/supabase/server";
import { getMyCouple } from "@/features/couple/queries";
import { InviteCard } from "@/features/couple/InviteCard";
import { GROCERY_COLUMNS, type GroceryItem } from "@/features/groceries/types";
import { Greeting } from "@/features/home/Greeting";
import { ShoppingCard } from "@/features/home/ShoppingCard";
import { TodayCard } from "@/features/home/TodayCard";

// Home: "Your day together". Today's plans + what's left to buy, both kept live.
export default async function HomePage() {
  const couple = (await getMyCouple())!; // the layout already checked this exists
  const supabase = await createClient();
  const { data: groceries } = await supabase.from("grocery_items").select(GROCERY_COLUMNS);

  const names = couple.partner
    ? `${couple.me.displayName} & ${couple.partner.displayName}`
    : couple.me.displayName;

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between pt-2">
        <div>
          <Greeting names={names} />
          <h1 className="text-2xl font-semibold">Your day together</h1>
        </div>
        <form action={logOut}>
          <button className="rounded-full bg-surface px-3 py-1.5 text-sm text-muted shadow-sm">
            Log out
          </button>
        </form>
      </header>

      {!couple.partner && <InviteCard code={couple.inviteCode} expiresAt={couple.inviteExpiresAt} />}

      <TodayCard coupleId={couple.id} me={couple.me} partner={couple.partner} />
      <ShoppingCard coupleId={couple.id} initialItems={(groceries ?? []) as GroceryItem[]} />
    </div>
  );
}
