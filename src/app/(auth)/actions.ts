"use server";

// Server actions: these run on the server when a form is submitted.

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; message?: string } | undefined;

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const displayName = String(formData.get("display_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!displayName) return { error: "What should we call you?" };
  if (password.length < 8) return { error: "Please use at least 8 characters for your password." };

  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName }, // picked up by the profiles trigger
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) return { error: friendly(error.message) };

  // If email confirmation is turned on in Supabase, there's no session yet.
  if (!data.session) {
    return { message: "Almost there! Check your email and tap the link to finish signing up." };
  }
  redirect("/");
}

export async function logIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (error) return { error: friendly(error.message) };
  redirect("/");
}

export async function logOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// Turn Supabase's technical error messages into kinder ones.
function friendly(message: string) {
  if (/invalid login credentials/i.test(message)) return "That email and password don't match. Try again?";
  if (/already registered/i.test(message)) return "There's already an account with that email. Try logging in.";
  if (/email not confirmed/i.test(message)) return "Please confirm your email first. Check your inbox.";
  return message;
}
