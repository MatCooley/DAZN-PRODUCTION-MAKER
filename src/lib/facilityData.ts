import type { FacilityEvent, Resource, ResourceDependency } from './facilityTypes';

export const weekStartISO = '2026-08-24T00:00:00'; // Monday
export const weekDays = [
  { date: '2026-08-24', label: 'Mon' },
  { date: '2026-08-25', label: 'Tue' },
  { date: '2026-08-26', label: 'Wed' },
  { date: '2026-08-27', label: 'Thu' },
  { date: '2026-08-28', label: 'Fri' },
  { date: '2026-08-29', label: 'Sat' },
  { date: '2026-08-30', label: 'Sun' },
];

export const resources: Resource[] = [
  { id: 'r-a-cr', code: 'ST_A_CR', name: 'Studio A — Control Room', group: 'Studios', order: 1, isBookable: true },
  { id: 'r-a-fl', code: 'ST_A_FL', name: 'Studio A — Floor', group: 'Studios', order: 2, isBookable: true },
  { id: 'r-b-cr', code: 'ST_B_CR', name: 'Studio B — Control Room', group: 'Studios', order: 3, isBookable: true },
  { id: 'r-b-fl', code: 'ST_B_FL', name: 'Studio B — Floor', group: 'Studios', order: 4, isBookable: true },
  { id: 'r-c-cr', code: 'ST_C_CR', name: 'Studio C — Control Room', group: 'Studios', order: 5, isBookable: true },
];

export const resourceDependencies: ResourceDependency[] = [
  { primaryResourceId: 'r-a-fl', dependentResourceId: 'r-a-cr', type: 'REQUIRES' },
  { primaryResourceId: 'r-b-fl', dependentResourceId: 'r-b-cr', type: 'REQUIRES' },
];

let seq = 0;
const id = () => `fe-${++seq}`;

export const initialFacilityEvents: FacilityEvent[] = [
  // Studio A — Control Room
  { id: id(), resourceId: 'r-a-cr', eventType: 'BOOKING', isBlocking: true, start: '2026-08-24T05:30:00', end: '2026-08-24T13:30:00', status: 'CONFIRMED', title: 'Breakfast Sport', production: 'Studio A Breakfast' },
  { id: id(), resourceId: 'r-a-cr', eventType: 'AVAILABILITY_WINDOW', isBlocking: false, start: '2026-08-24T13:30:00', end: '2026-08-24T20:00:00', status: 'CONFIRMED' },
  { id: id(), resourceId: 'r-a-cr', eventType: 'BOOKING', isBlocking: true, start: '2026-08-25T05:30:00', end: '2026-08-25T13:30:00', status: 'CONFIRMED', title: 'Breakfast Sport', production: 'Studio A Breakfast' },
  { id: id(), resourceId: 'r-a-cr', eventType: 'MAINTENANCE', isBlocking: true, start: '2026-08-25T14:00:00', end: '2026-08-25T16:00:00', status: 'CONFIRMED', title: 'Vision desk firmware update' },
  { id: id(), resourceId: 'r-a-cr', eventType: 'BOOKING', isBlocking: true, start: '2026-08-26T06:00:00', end: '2026-08-26T14:00:00', status: 'CONFIRMED', title: 'Breakfast Sport', production: 'Studio A Breakfast' },
  { id: id(), resourceId: 'r-a-cr', eventType: 'BOOKING', isBlocking: true, start: '2026-08-27T06:00:00', end: '2026-08-27T14:00:00', status: 'CONFIRMED', title: 'Breakfast Sport', production: 'Studio A Breakfast' },
  { id: id(), resourceId: 'r-a-cr', eventType: 'BOOKING', isBlocking: true, start: '2026-08-28T06:00:00', end: '2026-08-28T14:00:00', status: 'CONFIRMED', title: 'Breakfast Sport', production: 'Studio A Breakfast' },
  { id: id(), resourceId: 'r-a-cr', eventType: 'AVAILABILITY_WINDOW', isBlocking: false, start: '2026-08-29T00:00:00', end: '2026-08-31T00:00:00', status: 'CONFIRMED' },

  // Studio A — Floor (coupled to CR)
  { id: id(), resourceId: 'r-a-fl', eventType: 'BOOKING', isBlocking: true, start: '2026-08-24T05:30:00', end: '2026-08-24T13:30:00', status: 'CONFIRMED', title: 'Breakfast Sport', production: 'Studio A Breakfast' },
  { id: id(), resourceId: 'r-a-fl', eventType: 'BOOKING', isBlocking: true, start: '2026-08-25T05:30:00', end: '2026-08-25T13:30:00', status: 'CONFIRMED', title: 'Breakfast Sport', production: 'Studio A Breakfast' },
  { id: id(), resourceId: 'r-a-fl', eventType: 'BOOKING', isBlocking: true, start: '2026-08-26T06:00:00', end: '2026-08-26T14:00:00', status: 'CONFIRMED', title: 'Breakfast Sport', production: 'Studio A Breakfast' },

  // Studio B — Control Room (Thursday night live + Sunday live)
  { id: id(), resourceId: 'r-b-cr', eventType: 'BOOKING', isBlocking: true, start: '2026-08-24T09:00:00', end: '2026-08-24T17:00:00', status: 'CONFIRMED', title: 'Highlights Desk', production: 'Studio B Desk' },
  { id: id(), resourceId: 'r-b-cr', eventType: 'BOOKING', isBlocking: true, start: '2026-08-25T09:00:00', end: '2026-08-25T17:00:00', status: 'CONFIRMED', title: 'Highlights Desk', production: 'Studio B Desk' },
  { id: id(), resourceId: 'r-b-cr', eventType: 'HOLD', isBlocking: true, start: '2026-08-27T10:00:00', end: '2026-08-27T17:00:00', status: 'HELD', title: 'NRL bump-in (tentative)' },
  { id: id(), resourceId: 'r-b-cr', eventType: 'BOOKING', isBlocking: true, start: '2026-08-27T17:00:00', end: '2026-08-28T01:00:00', status: 'CONFIRMED', title: 'NRL — Thu Night Live', production: 'NRL Thursday' },
  { id: id(), resourceId: 'r-b-cr', eventType: 'BOOKING', isBlocking: true, start: '2026-08-30T09:30:00', end: '2026-08-30T17:30:00', status: 'CONFIRMED', title: 'NRL — Sun Afternoon Live', production: 'NRL Sunday' },
  { id: id(), resourceId: 'r-b-cr', eventType: 'AVAILABILITY_WINDOW', isBlocking: false, start: '2026-08-24T17:00:00', end: '2026-08-25T09:00:00', status: 'CONFIRMED' },

  // Studio B — Floor
  { id: id(), resourceId: 'r-b-fl', eventType: 'BOOKING', isBlocking: true, start: '2026-08-24T09:00:00', end: '2026-08-24T17:00:00', status: 'CONFIRMED', title: 'Highlights Desk', production: 'Studio B Desk' },
  { id: id(), resourceId: 'r-b-fl', eventType: 'BOOKING', isBlocking: true, start: '2026-08-27T17:00:00', end: '2026-08-28T01:00:00', status: 'CONFIRMED', title: 'NRL — Thu Night Live', production: 'NRL Thursday' },

  // Studio C — Control Room (boxing main card + a deliberate overlap to show a conflict)
  { id: id(), resourceId: 'r-c-cr', eventType: 'BOOKING', isBlocking: true, start: '2026-08-29T11:00:00', end: '2026-08-29T19:00:00', status: 'CONFIRMED', title: 'Boxing — Fight Week Build', production: 'Boxing Sydney' },
  { id: id(), resourceId: 'r-c-cr', eventType: 'BOOKING', isBlocking: true, start: '2026-08-29T19:00:00', end: '2026-08-30T03:00:00', status: 'CONFIRMED', title: 'Boxing — Main Card Live', production: 'Boxing Sydney' },
  { id: id(), resourceId: 'r-c-cr', eventType: 'BLACKOUT', isBlocking: true, start: '2026-08-26T00:00:00', end: '2026-08-26T08:00:00', status: 'CONFIRMED', title: 'Power infrastructure works' },
  // Deliberate overlap for demo purposes: a booking that clashes with the blackout above
  { id: id(), resourceId: 'r-c-cr', eventType: 'BOOKING', isBlocking: true, start: '2026-08-26T06:00:00', end: '2026-08-26T10:00:00', status: 'CONFIRMED', title: 'Early promo shoot', production: 'Boxing Promo' },
];
