import type { FacilityEventType } from './facilityTypes';

export const DEFAULT_PX_PER_HOUR = 34; // fallback before the container is measured
export const MIN_PX_PER_HOUR = 6; // Day view only — below this, hour ticks/labels stop being legible
// Week view's day columns share a floor with the Roster board's day
// columns (Board.tsx / RosterTable.tsx, both 190px) so the two panels
// clamp to the identical width — and stay aligned — once either one runs
// out of room, instead of drifting apart at two unrelated floors.
export const MIN_DAY_COLUMN_WIDTH_WEEK = 190;
export const MIN_PX_PER_HOUR_WEEK = MIN_DAY_COLUMN_WIDTH_WEEK / 24;
export const MAX_PX_PER_HOUR_WEEK = 34; // don't stretch a 7-day view absurdly wide on very large screens
export const MAX_PX_PER_HOUR_DAY = 90; // Day view has far more room per hour to work with — use it
export const ROW_HEIGHT = 52;
export const SNAP_HOURS = 0.25; // 15 minutes

// Per the spec's visual-language table:
// yellow = confirmed booking, red = conflict, green outline = available,
// grey = unavailable/blocked (hold/maintenance/blackout).
export const facilityEventStyle: Record<
  FacilityEventType,
  { fill: string; border: string; textColor: string }
> = {
  BOOKING: { fill: '#E8A93C', border: '#E8A93C', textColor: '#1a1508' },
  HOLD: { fill: '#8b98a555', border: '#8B98A5', textColor: '#E7ECEF' },
  MAINTENANCE: { fill: '#4a5560', border: '#6b7784', textColor: '#E7ECEF' },
  BLACKOUT: { fill: '#2a2f36', border: '#4a5560', textColor: '#8B98A5' },
  AVAILABILITY_WINDOW: { fill: 'transparent', border: '#3FBF7F', textColor: '#3FBF7F' },
};

export const conflictStyle = { fill: '#E1543D33', border: '#E1543D', textColor: '#ffe4de' };

export const facilityEventLabel: Record<FacilityEventType, string> = {
  BOOKING: 'Booking',
  HOLD: 'Hold',
  MAINTENANCE: 'Maintenance',
  BLACKOUT: 'Blackout',
  AVAILABILITY_WINDOW: 'Available',
};

// Per-studio accent colors — CONFIRMED BOOKINGS only are tinted by which
// studio they're in, so you can recognize a studio's pattern at a glance
// without reading every row label. Status colors (conflict=red,
// hold=grey, available=green, blackout=near-black) stay universal and
// reserved — they're never overridden by studio color, since diluting
// "this is a conflict" with a studio hue would defeat the point of the
// signal. Hues are deliberately spaced away from signal-green (~150°)
// and signal-red (~5°) so nothing gets mistaken for a status color.
export const studioAccentColor: Record<string, { fill: string; border: string; textColor: string }> = {
  A: { fill: '#E8A93C', border: '#E8A93C', textColor: '#1a1508' }, // amber
  B: { fill: '#35C1D6', border: '#35C1D6', textColor: '#052024' }, // cyan (matches the tally accent)
  C: { fill: '#9B87E8', border: '#9B87E8', textColor: '#1c1533' }, // violet
  D: { fill: '#E86B9E', border: '#E86B9E', textColor: '#330f1c' }, // rose
};
export const studioAccentFallback = studioAccentColor.A;

/** Extracts the studio letter from a resource code like 'ST_A_CR' -> 'A'. */
export function studioLetterOf(code: string): string {
  return code.match(/^ST_([A-Z])_/)?.[1] ?? '?';
}

export function resourceKindOf(code: string): 'CR' | 'FL' | '?' {
  if (code.endsWith('_CR')) return 'CR';
  if (code.endsWith('_FL')) return 'FL';
  return '?';
}

export function studioColorFor(code: string) {
  return studioAccentColor[studioLetterOf(code)] ?? studioAccentFallback;
}
