import { logOut } from "../(auth)/actions";
import { getMyCouple } from "@/features/couple/queries";
import { InviteCard } from "@/features/couple/InviteCard";

// Home dashboard. Real events/groceries come in step 5.
export default async function HomePage() {
  const couple = (await getMyCouple())!; // the layout already checked this exists

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between pt-2">
        <div>
          <p className="text-sm text-muted">
            {couple.partner
              ? `${couple.me.displayName} & ${couple.partner.displayName}`
              : `Good to see you, ${couple.me.displayName}`}
          </p>
          <h1 className="text-2xl font-semibold">Your day together</h1>
        </div>
        <form action={logOut}>
          <button className="rounded-full bg-surface px-3 py-1.5 text-sm text-muted shadow-sm">
            Log out
          </button>
        </form>
      </header>

      {!couple.partner && <InviteCard code={couple.inviteCode} expiresAt={couple.inviteExpiresAt} />}

      <section className="rounded-3xl bg-surface p-5 shadow-sm">
        <h2 className="text-sm font-medium text-muted">Today</h2>
        <p className="mt-1">Nothing planned. A slow day, maybe? ☕</p>
      </section>
      <section className="rounded-3xl bg-surface p-5 shadow-sm">
        <h2 className="text-sm font-medium text-muted">Shopping list</h2>
        <p className="mt-1">All stocked up. Nothing to buy.</p>
      </section>
    </div>
  );
}
