import { redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { getMyCouple } from "@/features/couple/queries";

// Layout for the main app screens (Home, Our list, Our week).
// The "(app)" folder name in brackets groups these pages without adding
// "/app" to the URL. You must be logged in (checked by the middleware)
// and part of a couple space (checked here) to see them.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!(await getMyCouple())) redirect("/onboarding");

  return (
    <>
      <main className="mx-auto max-w-lg px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-24">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
