"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { logIn, signUp } from "./actions";

// Shared form for both /login and /signup.
// `next` is where to go afterwards (e.g. back to an invite link).
export function AuthForm({ mode, next = "" }: { mode: "login" | "signup"; next?: string }) {
  const isSignup = mode === "signup";
  const [state, formAction] = useActionState(isSignup ? signUp : logIn, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      {isSignup && (
        <Input label="Your name" name="display_name" defaultValue={state?.displayName} autoComplete="given-name" required maxLength={40} />
      )}
      <Input label="Email" name="email" type="email" defaultValue={state?.email} autoComplete="email" required />
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete={isSignup ? "new-password" : "current-password"}
        minLength={isSignup ? 8 : undefined}
        required
      />

      {state?.error && <p className="rounded-2xl bg-accent/10 p-3 text-sm text-accent">{state.error}</p>}
      {state?.message && <p className="rounded-2xl bg-surface p-3 text-sm shadow-sm">{state.message}</p>}

      <Button type="submit">{isSignup ? "Create my account" : "Log in"}</Button>

      <p className="text-center text-sm text-muted">
        {isSignup ? (
          <>Already have an account? <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="text-accent">Log in</Link></>
        ) : (
          <>New here? <Link href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"} className="text-accent">Create an account</Link></>
        )}
      </p>
    </form>
  );
}
