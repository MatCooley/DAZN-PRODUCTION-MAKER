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
  { id: 'r-d-cr', code: 'ST_D_CR', name: 'Studio D — Control Room', group: 'Studios', order: 6, isBookable: true },
];

export const resourceDependencies: ResourceDependency[] = [
  { primaryResourceId: 'r-a-fl', dependentResourceId: 'r-a-cr', type: 'REQUIRES' },
  { primaryResourceId: 'r-b-fl', dependentResourceId: 'r-b-cr', type: 'REQUIRES' },
];

export const studioResourceMap: Record<string, string[]> = {
  A: ['r-a-cr', 'r-a-fl'],
  B: ['r-b-cr', 'r-b-fl'],
  C: ['r-c-cr'],
  D: ['r-d-cr'],
};

let seq = 0;
const id = () => `fe-${++seq}`;

// Bookings sourced from Studio_Staff_cost.xlsx, placed onto the week of
// Mon 24 – Sun 30 Aug 2026. The sheet is a per-show crewing/cost template
// (rate card), not a dated calendar — so only shows with an unambiguous
// day-of-week AND time were placed here. Shows with no day specified
// (Netball - Pivot, NRLW Off Tube Call), a conditional/irregular trigger
// (NRL Simulcast Thursday — "additional AD only for Warriors home game"),
// a likely-alternate slot (NRL W - Thursday, Finals Footy — only 4
// episodes/season, almost certainly replaces the regular Friday show
// during finals rather than running alongside it), or no studio at all
// (NRL Sideline, NRL Tonight — roving Make Up-only roles) were left out
// of the calendar and remain in showLibrary.ts for reference.
//
// Since the source sheet books at the whole-studio level without
// distinguishing Control Room vs Floor, Studio A/B bookings below are
// applied to both r-a-cr/r-a-fl or r-b-cr/r-b-fl as linked pairs
// (consistent with how CR/Floor linking already works elsewhere in this
// app) — that's an inference, not something the sheet states directly.
const satNightGroupId = 'grp-sat-super-saturday';
const sunOffTubeLink = 'link-a-sun';

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

export const initialFacilityEvents: FacilityEvent[] = [
  // --- Studio C: NRL 360, Mon/Tue/Wed 18:30–19:30 ---
  { id: id(), resourceId: 'r-c-cr', eventType: 'BOOKING', isBlocking: true, start: '2026-08-24T18:30:00', end: '2026-08-24T19:30:00', status: 'CONFIRMED', title: 'NRL 360 Mon', production: 'NRL 360', showKey: 'nrl-360-mon' },
  { id: id(), resourceId: 'r-c-cr', eventType: 'BOOKING', isBlocking: true, start: '2026-08-25T18:30:00', end: '2026-08-25T19:30:00', status: 'CONFIRMED', title: 'NRL 360 Tue', production: 'NRL 360', showKey: 'nrl-360-tue' },
  { id: id(), resourceId: 'r-c-cr', eventType: 'BOOKING', isBlocking: true, start: '2026-08-26T18:30:00', end: '2026-08-26T19:30:00', status: 'CONFIRMED', title: 'NRL 360 Wed', production: 'NRL 360', showKey: 'nrl-360-wed' },
  { id: id(), resourceId: 'r-c-cr', eventType: 'AVAILABILITY_WINDOW', isBlocking: false, start: '2026-08-24T00:00:00', end: '2026-08-24T18:30:00', status: 'CONFIRMED' },
  { id: id(), resourceId: 'r-c-cr', eventType: 'MAINTENANCE', isBlocking: true, start: '2026-08-25T10:00:00', end: '2026-08-25T12:00:00', status: 'CONFIRMED', title: 'Scheduled desk maintenance' },

  // --- Studio D: Matty Johns Podcast, Mon 09:00–10:00 (pre-record) ---
  { id: id(), resourceId: 'r-d-cr', eventType: 'BOOKING', isBlocking: true, start: '2026-08-24T09:00:00', end: '2026-08-24T10:00:00', status: 'CONFIRMED', title: 'Matty Johns Podcast', production: 'Matty Johns Podcast', showKey: 'matty-johns-podcast' },
  { id: id(), resourceId: 'r-d-cr', eventType: 'AVAILABILITY_WINDOW', isBlocking: false, start: '2026-08-24T10:00:00', end: '2026-08-28T00:00:00', status: 'CONFIRMED' },
  { id: id(), resourceId: 'r-d-cr', eventType: 'BLACKOUT', isBlocking: true, start: '2026-08-26T20:00:00', end: '2026-08-27T02:00:00', status: 'CONFIRMED', title: 'Power infrastructure works' },
  // Deliberate conflict for demo purposes: a hold that clashes with the blackout above
  { id: id(), resourceId: 'r-d-cr', eventType: 'HOLD', isBlocking: true, start: '2026-08-26T21:00:00', end: '2026-08-26T23:00:00', status: 'HELD', title: 'Tentative hold — future promo shoot' },

  // --- Studio A: Matty Johns Late Show Thu, NRL Off Tube Call + Sunday Matty Johns Show ---
  ...linkedPair('r-a-cr', 'r-a-fl', 'link-a-thu', {
    eventType: 'BOOKING', isBlocking: true, start: '2026-08-27T21:45:00', end: '2026-08-27T22:45:00', status: 'CONFIRMED',
    title: 'Matty Johns Late Show Thursday', production: 'Matty Johns Late Show', showKey: 'matty-johns-late-show-thursday',
  }),
  // Back-to-back on purpose: NRL Off Tube Call ends exactly as Sunday Matty
  // Johns Show begins — correctly NOT a conflict under the half-open
  // interval rule (10:00–11:00 / 11:00–12:00 style adjacency).
  ...linkedPair('r-a-cr', 'r-a-fl', sunOffTubeLink, {
    eventType: 'BOOKING', isBlocking: true, start: '2026-08-30T13:00:00', end: '2026-08-30T18:00:00', status: 'CONFIRMED',
    title: 'NRL Off Tube Call', production: 'NRL Off Tube Call', showKey: 'nrl-off-tube-call',
  }),
  ...linkedPair('r-a-cr', 'r-a-fl', 'link-a-sun-matty', {
    eventType: 'BOOKING', isBlocking: true, start: '2026-08-30T18:00:00', end: '2026-08-30T19:00:00', status: 'CONFIRMED',
    title: 'Sunday Matty Johns Show', production: 'Sunday Matty Johns Show', showKey: 'sunday-matty-johns-show',
  }),

  // --- Studio B: Sportsbet Wagering (Thu/Fri), Thurs Night League, NRL
  //     Friday Night Footy, NRL Super Saturday + OB Audio Mix (grouped —
  //     genuinely overlapping in the source sheet: same live broadcast,
  //     separate audio-mix production code, exactly the "allowed overlap"
  //     case this app's booking_group_id feature was built for), NRL Sunday ---
  ...linkedPair('r-b-cr', 'r-b-fl', 'link-b-thu-wager', {
    eventType: 'BOOKING', isBlocking: true, start: '2026-08-27T11:00:00', end: '2026-08-27T13:15:00', status: 'CONFIRMED',
    title: 'Sportsbet NRL Wagering Thurs', production: 'Sportsbet NRL Wagering', client: 'Ladbrokes', showKey: 'sportsbet-nrl-wagering-thurs',
  }),
  ...linkedPair('r-b-cr', 'r-b-fl', 'link-b-thu-league', {
    eventType: 'BOOKING', isBlocking: true, start: '2026-08-27T19:00:00', end: '2026-08-27T21:45:00', status: 'CONFIRMED',
    title: 'Thurs Night League', production: 'Thurs Night League', showKey: 'thurs-night-league',
  }),
  ...linkedPair('r-b-cr', 'r-b-fl', 'link-b-fri-wager', {
    eventType: 'BOOKING', isBlocking: true, start: '2026-08-28T11:00:00', end: '2026-08-28T13:15:00', status: 'CONFIRMED',
    title: 'Sportsbet NRL Wagering Fri', production: 'Sportsbet NRL Wagering', client: 'Ladbrokes', showKey: 'sportsbet-nrl-wagering-fri',
  }),
  ...linkedPair('r-b-cr', 'r-b-fl', 'link-b-fri-footy', {
    eventType: 'BOOKING', isBlocking: true, start: '2026-08-28T17:00:00', end: '2026-08-28T22:45:00', status: 'CONFIRMED',
    title: 'NRL Friday Night Footy', production: 'NRL Friday Night Footy', showKey: 'nrl-friday-night-footy',
  }),
  { id: id(), resourceId: 'r-b-cr', eventType: 'BOOKING', isBlocking: true, start: '2026-08-29T14:30:00', end: '2026-08-29T22:30:00', status: 'CONFIRMED', title: 'NRL Super Saturday', production: 'NRL Super Saturday', client: 'Main broadcast code', bookingGroupId: satNightGroupId, showKey: 'nrl-super-saturday' },
  { id: id(), resourceId: 'r-b-cr', eventType: 'BOOKING', isBlocking: true, start: '2026-08-29T11:00:00', end: '2026-08-29T18:00:00', status: 'CONFIRMED', title: 'NRL Round OB — Audio Mix', production: 'NRL Round OB', client: 'Audio mix code', bookingGroupId: satNightGroupId, showKey: 'nrl-round-ob-audio-mix' },
  ...linkedPair('r-b-cr', 'r-b-fl', 'link-b-sun', {
    eventType: 'BOOKING', isBlocking: true, start: '2026-08-30T13:00:00', end: '2026-08-30T18:00:00', status: 'CONFIRMED',
    title: 'NRL Sunday', production: 'NRL Sunday', showKey: 'nrl-sunday',
  }),
  { id: id(), resourceId: 'r-b-cr', eventType: 'AVAILABILITY_WINDOW', isBlocking: false, start: '2026-08-24T00:00:00', end: '2026-08-27T11:00:00', status: 'CONFIRMED' },
];
