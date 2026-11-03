import { formatTime } from "@/lib/dates";
import { WHOSE_STYLE, whoseEvent, type CalendarEvent } from "./types";

// One plan, shown as a soft coloured pill: title, time and whose it is.
// Used in the calendar and on the home screen.
export function EventChip({ event, meId, partnerName }: {
  event: CalendarEvent;
  meId: string;
  partnerName: string | null;
}) {
  const whose = whoseEvent(event, meId);
  const style = WHOSE_STYLE[whose];
  const label = whose === "ours" ? "Ours" : whose === "mine" ? "Mine" : `${partnerName ?? "Partner"}'s`;

  return (
    <span className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left ${style.soft}`}>
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{event.title}</span>
        <span className="block text-xs text-muted">
          {event.all_day ? "All day" : `${formatTime(new Date(event.starts_at))} – ${formatTime(new Date(event.ends_at))}`}
          {" · "}
          <span className={style.text}>{label}</span>
        </span>
      </span>
    </span>
  );
}
