// toISOString() always converts to UTC before formatting — for anyone in a
// positive UTC offset (e.g. Sydney, UTC+10/+11), local midnight becomes the
// PREVIOUS day in UTC, so `new Date(2026,7,24).toISOString().slice(0,10)`
// silently returns '2026-08-23'. These helpers format using the Date
// object's LOCAL components instead, so what you see is what you meant.

function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0');
}

/** 'YYYY-MM-DD' using local date components (not UTC). */
export function toLocalDateString(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 'YYYY-MM-DDTHH:mm:ss' using local date/time components (not UTC). */
export function toLocalDateTimeString(d: Date): string {
  return `${toLocalDateString(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** Monday of the calendar week containing `d` (local time), at midnight. */
export function startOfWeekMonday(d: Date): Date {
  const x = new Date(d);
  const dow = x.getDay(); // 0 = Sun
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  x.setDate(x.getDate() + mondayOffset);
  x.setHours(0, 0, 0, 0);
  return x;
}
