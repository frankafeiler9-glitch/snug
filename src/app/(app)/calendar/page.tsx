import { getMyCouple } from "@/features/couple/queries";
import { CalendarView } from "@/features/calendar/CalendarView";

// "Your week together": the shared calendar.
export default async function CalendarPage() {
  const couple = (await getMyCouple())!;

  return (
    <div className="space-y-4 pt-2">
      <header>
        <h1 className="text-2xl font-semibold">Your week together</h1>
        <p className="text-sm text-muted">Plans for you, for them, and for the two of you.</p>
      </header>
      <CalendarView coupleId={couple.id} me={couple.me} partner={couple.partner} />
    </div>
  );
}
