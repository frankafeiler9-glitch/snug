import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Supabase client for code that runs on the server (pages, server actions).
// It reads the logged-in user's session from cookies, so every query runs
// as that user and row-level security applies.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Pages can't set cookies; that's fine because the middleware
            // refreshes the session on every request.
          }
        },
      },
    },
  );
}
