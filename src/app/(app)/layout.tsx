import { BottomNav } from "@/components/BottomNav";

// Layout for the main app screens (Home, Groceries, Calendar).
// The "(app)" folder name in brackets groups these pages without adding
// "/app" to the URL. Later this layout will also check that you're signed in.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="mx-auto max-w-lg px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-24">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
