// Schedule/crewing metadata a coordinator sets up for a show — separate
// from ShowTemplate (showLibrary.ts), which is real cost-sheet data we
// never want to overwrite with hand-entered planning info. A ShowSchedule
// is purely in-memory, user-authored overlay: which days it airs, who the
// regular crew are, which studio it uses. It does not (yet) feed back into
// the booking wizard or auto-generate FacilityEvents — it's the standing
// plan a coordinator maintains, matching what derivedShifts.ts still reads
// (ShowCrewLine.role/count) untouched.
import type { ShowTemplate } from './showLibrary';

export interface ShowCrewAssignment {
  role: string; // matches a ShowCrewLine.role in the same show
  regularEmployeeId: string | null;
  callOffsetMin: number; // minutes relative to the show's start time
  wrapOffsetMin: number; // minutes relative to the show's end time
}

export interface ShowSchedule {
  key: string; // ShowTemplate.key
  color: string; // hex accent, shown on the Shows card and detail header
  repeatDays: number[]; // 0=Sun..6=Sat, matches BookingDraft's convention
  startTime: string; // 'HH:mm'
  endTime: string; // 'HH:mm'
  seasonFrom: string; // ISO date
  seasonTo: string; // ISO date
  resourceIds: string[];
  project: string; // work order / project code
  crewAssignments: ShowCrewAssignment[];
}

const PALETTE = ['#e8a93c', '#4f9de0', '#8b7ce8', '#e07ca8', '#4dd68c', '#c084fc', '#fbbf24', '#94a3b8'];

function colorForKey(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

const DAY_HINT: { pattern: RegExp; day: number }[] = [
  { pattern: /\bmon\b/i, day: 1 },
  { pattern: /\btue\b/i, day: 2 },
  { pattern: /\bwed\b/i, day: 3 },
  { pattern: /\bthu\b/i, day: 4 },
  { pattern: /\bfri\b/i, day: 5 },
  { pattern: /\bsat\b/i, day: 6 },
  { pattern: /\bsun\b/i, day: 0 },
];

// The source sheet's free-text notes often name a day and a 24h window
// (e.g. "Live 1830-2200 Thur") — a best-effort parse so a fresh show
// doesn't open with a blank, unhelpful schedule. Anything not found is
// left for the coordinator to fill in; nothing here is invented.
export function guessScheduleFromNotes(notes: string[]): { repeatDays: number[]; startTime: string; endTime: string } {
  const text = notes.join(' ');
  const days = DAY_HINT.filter((d) => d.pattern.test(text)).map((d) => d.day);
  const timeMatch = text.match(/\b(\d{3,4})-(\d{3,4})\b/);
  const toHM = (t: string) => {
    const padded = t.padStart(4, '0');
    return `${padded.slice(0, 2)}:${padded.slice(2)}`;
  };
  return {
    repeatDays: days,
    startTime: timeMatch ? toHM(timeMatch[1]) : '00:00',
    endTime: timeMatch ? toHM(timeMatch[2]) : '00:00',
  };
}

export function defaultScheduleFor(template: ShowTemplate, seasonFrom: string, seasonTo: string): ShowSchedule {
  const guess = guessScheduleFromNotes(template.notes);
  return {
    key: template.key,
    color: colorForKey(template.key),
    repeatDays: guess.repeatDays,
    startTime: guess.startTime,
    endTime: guess.endTime,
    seasonFrom,
    seasonTo,
    resourceIds: [],
    project: '',
    crewAssignments: template.crew.map((line) => ({
      role: line.role,
      regularEmployeeId: null,
      callOffsetMin: 0,
      wrapOffsetMin: 30,
    })),
  };
}

export const DAY_LABELS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function scheduleSummary(schedule: ShowSchedule): string {
  if (schedule.repeatDays.length === 0) return 'Not scheduled';
  const days = [...schedule.repeatDays].sort().map((d) => DAY_LABELS_SHORT[d]).join(', ');
  return `${days} · ${schedule.startTime}–${schedule.endTime}`;
}
