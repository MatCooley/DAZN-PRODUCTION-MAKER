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
void linkedPair; // available for reuse when seeding real bookings again

// Clean slate — no seeded bookings. Add real bookings via the "+ New
// booking" wizard, or ask Claude to populate them from a data source.
export const initialFacilityEvents: FacilityEvent[] = [];
