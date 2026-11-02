// Small date helpers, so we don't need a date library.
// All of these work in the phone's local time zone.

/** 1 = weeks start on Monday, 0 = Sunday. */
export const WEEK_STARTS_ON = 1;

export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, days: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days, d.getHours(), d.getMinutes());
}

export function addMonths(d: Date, months: number) {
  return new Date(d.getFullYear(), d.getMonth() + months, 1);
}

export function startOfWeek(d: Date) {
  const day = startOfDay(d);
  const diff = (day.getDay() - WEEK_STARTS_ON + 7) % 7;
  return addDays(day, -diff);
}

export function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** The 7 days of the week containing `d`. */
export function weekDays(d: Date) {
  const start = startOfWeek(d);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** 6 rows × 7 days covering the month containing `d` (padded with neighbours). */
export function monthGrid(d: Date) {
  const start = startOfWeek(startOfMonth(d));
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

/** Does something running from `start` to `end` touch this calendar day? */
export function overlapsDay(start: Date, end: Date, day: Date) {
  const dayStart = startOfDay(day);
  const dayEnd = addDays(dayStart, 1);
  return start < dayEnd && (end > dayStart || start >= dayStart);
}

// ─── Form helpers: <input type="date"> and <input type="time"> ───────────

const pad = (n: number) => String(n).padStart(2, "0");

/** Date → "2026-11-02" */
export function toDateInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Date → "18:30" */
export function toTimeInput(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "2026-11-02" + "18:30" → Date (local time) */
export function fromInputs(date: string, time = "00:00") {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  return new Date(y, m - 1, d, h, min);
}

// ─── Friendly formatting (uses the phone's language settings) ────────────

export const formatTime = (d: Date) => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
export const formatWeekday = (d: Date) => d.toLocaleDateString(undefined, { weekday: "short" });
export const formatDayMonth = (d: Date) => d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
export const formatMonthYear = (d: Date) => d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
export const formatLongDay = (d: Date) => d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
