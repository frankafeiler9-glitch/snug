import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Pages anyone can visit without being logged in.
const PUBLIC_PATHS = ["/login", "/signup", "/auth", "/join"];

// Runs before every page load (see src/middleware.ts):
// 1. keeps the login session fresh,
// 2. sends logged-out visitors to /login,
// 3. sends logged-in visitors away from /login and /signup.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers ?? {}).forEach(([key, value]) =>
            response.headers.set(key, value),
          );
        },
      },
    },
  );

  // Checks (and if needed refreshes) the session. Don't remove.
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + "/"));

  if (!isLoggedIn && !isPublic) {
    return redirectWithCookies(request, response, "/login");
  }
  if (isLoggedIn && (path === "/login" || path === "/signup")) {
    return redirectWithCookies(request, response, safeNext(request.nextUrl.searchParams.get("next")));
  }

  return response;
}

// Redirect while keeping any refreshed session cookies.
function redirectWithCookies(request: NextRequest, from: NextResponse, to: string) {
  const redirect = NextResponse.redirect(new URL(to, request.url));
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

// Only allow redirects to pages on our own site (e.g. "/join/ABC123"),
// never to another website.
export function safeNext(next: string | null | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : "/";
}
