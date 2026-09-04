import type { Shift } from './types';

// Floating local time, no TZID — good enough for a single-studio prototype
// where every shift is already in the one timezone the crew works in.
function toIcsDateTime(day: string, time: string): string {
  return `${day.replace(/-/g, '')}T${time.replace(':', '')}00`;
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

export function buildIcsCalendar(calendarName: string, shifts: Shift[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Broadcast Ops Roster//EN',
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
  ];
  for (const s of shifts) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${s.id}@broadcast-ops-roster`,
      `DTSTART:${toIcsDateTime(s.day, s.start)}`,
      `DTEND:${toIcsDateTime(s.day, s.end)}`,
      `SUMMARY:${escapeIcsText(s.production)}`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadIcs(filename: string, calendarName: string, shifts: Shift[]) {
  const ics = buildIcsCalendar(calendarName, shifts);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
