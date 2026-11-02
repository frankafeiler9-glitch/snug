"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createCouple, joinCouple } from "./actions";

// "Start our space": creates the couple and makes you its first member.
export function CreateCoupleForm() {
  const [state, formAction] = useActionState(createCouple, undefined);
  // The phone's time zone, so "today" on the dashboard means *your* today.
  const [timezone, setTimezone] = useState("UTC");
  useEffect(() => setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone), []);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="timezone" value={timezone} />
      <Input label="Name your space (optional)" name="name" placeholder="Our space" maxLength={60} />
      {state?.error && <p className="text-sm text-accent">{state.error}</p>}
      <Button type="submit">Start our space</Button>
    </form>
  );
}

// "I have a code": joins your partner's couple.
export function JoinCoupleForm({ initialCode = "" }: { initialCode?: string }) {
  const [state, formAction] = useActionState(joinCouple, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <Input
        label="Invite code"
        name="code"
        defaultValue={state?.code ?? initialCode}
        placeholder="K7M2QX"
        autoCapitalize="characters"
        autoComplete="off"
        maxLength={6}
        className="text-center font-mono text-xl tracking-[0.3em] uppercase"
        required
      />
      {state?.error && <p className="text-sm text-accent">{state.error}</p>}
      <Button type="submit">Join my partner</Button>
    </form>
  );
}
