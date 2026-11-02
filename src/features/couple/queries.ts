import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Person = { id: string; displayName: string };

export type CoupleInfo = {
  id: string;
  name: string;
  timezone: string;
  inviteCode: string | null;
  inviteExpiresAt: string | null;
  me: Person;
  partner: Person | null; // null until your partner joins
};

/**
 * Loads the logged-in user's couple space, or null if they haven't paired yet.
 * Wrapped in `cache` so calling it from both a layout and a page in the same
 * request only hits the database once.
 */
export const getMyCouple = cache(async (): Promise<CoupleInfo | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Thanks to row-level security this only ever returns rows from *our* couple.
  const { data: members, error } = await supabase
    .from("couple_members")
    .select("user_id, profiles(display_name), couples(id, name, timezone, invite_code, invite_expires_at)");

  if (error) throw error;
  if (!members || members.length === 0) return null;

  type Row = {
    user_id: string;
    profiles: { display_name: string } | null;
    couples: { id: string; name: string; timezone: string; invite_code: string | null; invite_expires_at: string | null } | null;
  };
  const rows = members as unknown as Row[];
  const couple = rows[0].couples!;
  const toPerson = (r: Row): Person => ({ id: r.user_id, displayName: r.profiles?.display_name ?? "Someone" });
  const myRow = rows.find((r) => r.user_id === user.id);
  const partnerRow = rows.find((r) => r.user_id !== user.id);

  return {
    id: couple.id,
    name: couple.name,
    timezone: couple.timezone,
    inviteCode: couple.invite_code,
    inviteExpiresAt: couple.invite_expires_at,
    me: myRow ? toPerson(myRow) : { id: user.id, displayName: "Me" },
    partner: partnerRow ? toPerson(partnerRow) : null,
  };
});
