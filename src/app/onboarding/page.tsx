import { redirect } from "next/navigation";
import { getMyCouple } from "@/features/couple/queries";
import { CreateCoupleForm, JoinCoupleForm } from "@/features/couple/PairingForms";

// Shown after signing up, before you're part of a couple space.
export default async function OnboardingPage() {
  if (await getMyCouple()) redirect("/"); // already paired

  return (
    <main className="mx-auto max-w-sm space-y-6 px-6 pt-[max(2.5rem,env(safe-area-inset-top))] pb-10">
      <header className="text-center">
        <div className="mb-3 text-4xl">🏡</div>
        <h1 className="text-2xl font-semibold">Let&apos;s set up your space</h1>
        <p className="mt-1 text-muted">One of you starts it, the other joins.</p>
      </header>

      <section className="rounded-3xl bg-surface p-5 shadow-sm">
        <h2 className="mb-1 font-semibold">I&apos;m the first one here</h2>
        <p className="mb-4 text-sm text-muted">Create your shared space and get a code for your partner.</p>
        <CreateCoupleForm />
      </section>

      <section className="rounded-3xl bg-surface p-5 shadow-sm">
        <h2 className="mb-1 font-semibold">My partner invited me</h2>
        <p className="mb-4 text-sm text-muted">Type in the 6-letter code they sent you.</p>
        <JoinCoupleForm />
      </section>
    </main>
  );
}
