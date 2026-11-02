import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyCouple } from "@/features/couple/queries";
import { JoinCoupleForm } from "@/features/couple/PairingForms";

// The invite link (snug…/join/K7M2QX) lands here.
export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const backHere = encodeURIComponent(`/join/${code}`);

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-10">
      <div className="mb-6 text-center">
        <div className="mb-3 text-4xl">💌</div>
        <h1 className="text-2xl font-semibold">You&apos;ve been invited</h1>
        <p className="mt-1 text-muted">Your partner wants to share a cozy space with you on Snug.</p>
      </div>

      {!user ? (
        // Not logged in: create an account first, then come back here.
        <div className="space-y-3">
          <Link href={`/signup?next=${backHere}`} className="flex h-12 items-center justify-center rounded-full bg-accent font-medium text-accent-foreground">
            Create my account
          </Link>
          <Link href={`/login?next=${backHere}`} className="flex h-12 items-center justify-center rounded-full bg-surface font-medium shadow-sm">
            I already have an account
          </Link>
        </div>
      ) : (await getMyCouple()) ? (
        <div className="space-y-3 text-center">
          <p className="rounded-2xl bg-surface p-4 text-sm shadow-sm">
            You&apos;re already in a space, so you can&apos;t join another one.
          </p>
          <Link href="/" className="text-accent">Go to my space</Link>
        </div>
      ) : (
        <div className="rounded-3xl bg-surface p-5 shadow-sm">
          <JoinCoupleForm initialCode={code.toUpperCase()} />
        </div>
      )}
    </main>
  );
}
