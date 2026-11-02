"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CoupleFormState = { error?: string; code?: string } | undefined;

// Start a new couple space (you'll then invite your partner).
export async function createCouple(_prev: CoupleFormState, formData: FormData): Promise<CoupleFormState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_couple", {
    space_name: String(formData.get("name") ?? ""),
    tz: String(formData.get("timezone") ?? "UTC"),
  });
  if (error) return { error: error.message };
  redirect("/");
}

// Join your partner's space with their invite code.
export async function joinCouple(_prev: CoupleFormState, formData: FormData): Promise<CoupleFormState> {
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!code) return { error: "Type in the code your partner shared." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("join_couple", { code });
  if (error) return { code, error: error.message };
  redirect("/");
}

// Make a new invite code (e.g. when the old one expired).
export async function refreshInviteCode() {
  const supabase = await createClient();
  await supabase.rpc("refresh_invite_code");
  revalidatePath("/");
}
