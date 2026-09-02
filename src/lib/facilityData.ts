import type { FacilityEvent, Resource, ResourceDependency } from './facilityTypes';

import { toLocalDateString } from './dateUtils';

export const weekStartISO = '2026-08-24T00:00:00'; // Monday — default/demo week
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Generates a Mon–Sun week (7 days) starting from the Monday on/after
// (or the Monday of the week containing) the given date. Used so the
// Gantt can navigate to any week, not just the hardcoded demo week —
// month/year context comes from these dates, not a fixed label.
export function weekOf(anyDateInWeek: Date): { date: string; label: string }[] {
  const d = new Date(anyDateInWeek);
  const dow = d.getDay(); // 0 = Sun
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return { date: toLocalDateString(day), label: DAY_LABELS[day.getDay()] };
  });
}

export const weekDays = weekOf(new Date(weekStartISO));

export const resources: Resource[] = [
  { id: 'r-a-cr', code: 'ST_A_CR', name: 'Studio A — Control Room', group: 'Studios', order: 1, isBookable: true },
  { id: 'r-a-fl', code: 'ST_A_FL', name: 'Studio A — Floor', group: 'Studios', order: 2, isBookable: true },
  { id: 'r-b-cr', code: 'ST_B_CR', name: 'Studio B — Control Room', group: 'Studios', order: 3, isBookable: true },
  { id: 'r-b-fl', code: 'ST_B_FL', name: 'Studio B — Floor', group: 'Studios', order: 4, isBookable: true },
  { id: 'r-c-cr', code: 'ST_C_CR', name: 'Studio C — Control Room', group: 'Studios', order: 5, isBookable: true },
  { id: 'r-c-fl', code: 'ST_C_FL', name: 'Studio C — Floor', group: 'Studios', order: 6, isBookable: true },
  { id: 'r-d-fl', code: 'ST_D_FL', name: 'Studio D — Floor', group: 'Studios', order: 7, isBookable: true },
];

export const resourceDependencies: ResourceDependency[] = [
  { primaryResourceId: 'r-a-fl', dependentResourceId: 'r-a-cr', type: 'REQUIRES' },
  { primaryResourceId: 'r-b-fl', dependentResourceId: 'r-b-cr', type: 'REQUIRES' },
  { primaryResourceId: 'r-c-fl', dependentResourceId: 'r-c-cr', type: 'REQUIRES' },
];

export const studioResourceMap: Record<string, { cr?: string; fl?: string }> = {
  A: { cr: 'r-a-cr', fl: 'r-a-fl' },
  B: { cr: 'r-b-cr', fl: 'r-b-fl' },
  C: { cr: 'r-c-cr', fl: 'r-c-fl' },
  D: { fl: 'r-d-fl' },
};

export type ResourceSelection = 'BOTH' | 'CR' | 'FL';

/** Resolves a studio letter + CR/Floor/Both selection into actual resource
 * ids. If a studio only has one of the two (e.g. Studio D — Floor only),
 * that single resource is returned regardless of selection. */
export function resolveBookingResourceIds(studio: string, selection: ResourceSelection): string[] {
  const entry = studioResourceMap[studio];
  if (!entry) return [];
  const { cr, fl } = entry;
  if (cr && fl) {
    if (selection === 'CR') return [cr];
    if (selection === 'FL') return [fl];
    return [cr, fl];
  }
  return cr ? [cr] : fl ? [fl] : [];
}

export interface BookingTargetOption {
  value: string; // `${studio}|${selection}`
  studio: string;
  selection: ResourceSelection;
  label: string;
}

/** Flat list of every bookable studio/resource combination, for the
 * wizard's "where" selector — grouped by studio, offering Control Room
 * + Floor together or either one alone where both exist. */
export function bookingTargetOptions(): BookingTargetOption[] {
  const options: BookingTargetOption[] = [];
  for (const studio of Object.keys(studioResourceMap)) {
    const { cr, fl } = studioResourceMap[studio];
    if (cr && fl) {
      options.push({ value: `${studio}|BOTH`, studio, selection: 'BOTH', label: `Studio ${studio} — Control Room + Floor` });
      options.push({ value: `${studio}|CR`, studio, selection: 'CR', label: `Studio ${studio} — Control Room only` });
      options.push({ value: `${studio}|FL`, studio, selection: 'FL', label: `Studio ${studio} — Floor only` });
    } else if (cr) {
      options.push({ value: `${studio}|BOTH`, studio, selection: 'BOTH', label: `Studio ${studio} — Control Room` });
    } else if (fl) {
      options.push({ value: `${studio}|BOTH`, studio, selection: 'BOTH', label: `Studio ${studio} — Floor` });
    }
  }
  return options;
}

let seq = 0;
const id = () => `fe-${++seq}`;

// Helper for creating a Control-Room + Floor linked pair booking in one
// call — kept here for use by the booking wizard and future seed data.
function linkedPair(
  crResourceId: string,
  flResourceId: string,
  linkId: string,
  common: Omit<FacilityEvent, 'id' | 'resourceId' | 'linkedBookingSetId'>
): FacilityEvent[] {
  return [
    { id: id(), resourceId: crResourceId, linkedBookingSetId: linkId, ...common },
    { id: id(), resourceId: flResourceId, linkedBookingSetId: linkId, ...common },
  ];
}

let bookingSeq = 0;
const newBookingLinkId = () => `link-seed-${++bookingSeq}`;

interface SeedBooking {
  studio: 'A' | 'B' | 'C';
  title: string;
  showKey?: string;
  start: string; // 'YYYY-MM-DDTHH:mm:ss'
  end: string;
}

// Real bookings parsed from the FoxSports DA/PA/VIZ roster PDF
// (pmg_rosterdapaviz_r_we_sept_20.pdf), matched against showLibrary by
// name. Only the w/c 24 Aug and 31 Aug weeks are included — those are the
// only two where the scanned table's day-of-week alignment could be
// confirmed with confidence (either from an explicit day in the show
// name, e.g. "NRL Friday Night Footy", or a same-day cross-reference
// between two staff rows sharing the same RLG/GEN booking number).
// Weeks of 7 Sep and 14 Sep (NRL Finals ramp-up — QUAL/ELIMS fixtures)
// were left out rather than guessed at.
const seedBookings: SeedBooking[] = [
  // w/c 24 Aug 2026
  { studio: 'C', title: 'NRL 360', showKey: 'nrl-360-mon', start: '2026-08-24T13:00:00', end: '2026-08-24T20:00:00' },
  { studio: 'C', title: 'NRL 360', showKey: 'nrl-360-tue', start: '2026-08-25T16:00:00', end: '2026-08-25T20:00:00' },
  { studio: 'C', title: 'NRL 360', showKey: 'nrl-360-wed', start: '2026-08-26T13:00:00', end: '2026-08-26T19:30:00' },
  { studio: 'B', title: 'NRL Thursday (Thurs Night League)', showKey: 'thurs-night-league', start: '2026-08-27T17:00:00', end: '2026-08-27T22:30:00' },
  { studio: 'A', title: 'NRLW 2025 Hostings', start: '2026-08-27T16:00:00', end: '2026-08-27T19:00:00' },
  { studio: 'A', title: 'Matty Johns Late Show Thursday', showKey: 'matty-johns-late-show-thursday', start: '2026-08-27T19:00:00', end: '2026-08-27T23:00:00' },
  { studio: 'B', title: 'NRL Friday Night Footy', showKey: 'nrl-friday-night-footy', start: '2026-08-28T14:00:00', end: '2026-08-28T23:00:00' },
  { studio: 'B', title: 'Sportsbet', showKey: 'sportsbet-nrl-wagering-fri', start: '2026-08-28T08:30:00', end: '2026-08-28T12:30:00' },
  { studio: 'B', title: 'NRL Super Saturday', showKey: 'nrl-super-saturday', start: '2026-08-29T15:00:00', end: '2026-08-29T23:00:00' },
  { studio: 'A', title: 'Sunday Matty Johns Show', showKey: 'sunday-matty-johns-show', start: '2026-08-30T15:30:00', end: '2026-08-30T19:30:00' },

  // w/c 31 Aug 2026
  { studio: 'C', title: 'NRL 360', showKey: 'nrl-360-mon', start: '2026-08-31T12:00:00', end: '2026-08-31T20:00:00' },
  { studio: 'A', title: 'NRLW 2025 Hostings', start: '2026-09-03T16:00:00', end: '2026-09-03T19:00:00' },
  { studio: 'A', title: 'Matty Johns Late Show Thursday', showKey: 'matty-johns-late-show-thursday', start: '2026-09-03T19:00:00', end: '2026-09-03T23:00:00' },
  { studio: 'B', title: 'NRL Thursday (Thurs Night League)', showKey: 'thurs-night-league', start: '2026-09-03T16:30:00', end: '2026-09-03T22:30:00' },
  { studio: 'B', title: 'NRL Friday Night Footy', showKey: 'nrl-friday-night-footy', start: '2026-09-04T14:00:00', end: '2026-09-04T23:30:00' },
  { studio: 'B', title: 'Sportsbet', showKey: 'sportsbet-nrl-wagering-fri', start: '2026-09-04T08:30:00', end: '2026-09-04T12:30:00' },
  { studio: 'B', title: 'NRL Super Saturday (x3 games)', showKey: 'nrl-super-saturday', start: '2026-09-05T12:30:00', end: '2026-09-05T23:30:00' },
  { studio: 'A', title: 'Sunday Matty Johns Show', showKey: 'sunday-matty-johns-show', start: '2026-09-06T13:30:00', end: '2026-09-06T20:00:00' },
];

const studioCrFl: Record<'A' | 'B' | 'C', [string, string]> = {
  A: ['r-a-cr', 'r-a-fl'],
  B: ['r-b-cr', 'r-b-fl'],
  C: ['r-c-cr', 'r-c-fl'],
};

export const initialFacilityEvents: FacilityEvent[] = seedBookings.flatMap((b) => {
  const [cr, fl] = studioCrFl[b.studio];
  return linkedPair(cr, fl, newBookingLinkId(), {
    eventType: 'BOOKING',
    isBlocking: true,
    start: b.start,
    end: b.end,
    status: 'CONFIRMED',
    title: b.title,
    production: b.title,
    showKey: b.showKey,
  });
});
