// Home dashboard. Placeholder for now; real data comes in step 5.
export default function HomePage() {
  return (
    <div className="space-y-4">
      <header className="pt-2">
        <p className="text-sm text-muted">Good to see you</p>
        <h1 className="text-2xl font-semibold">Your day together</h1>
      </header>
      <section className="rounded-3xl bg-surface p-5 shadow-sm">
        <h2 className="text-sm font-medium text-muted">Today</h2>
        <p className="mt-1">Nothing planned. A slow day, maybe? ☕</p>
      </section>
      <section className="rounded-3xl bg-surface p-5 shadow-sm">
        <h2 className="text-sm font-medium text-muted">Shopping list</h2>
        <p className="mt-1">All stocked up. Nothing to buy.</p>
      </section>
    </div>
  );
}
