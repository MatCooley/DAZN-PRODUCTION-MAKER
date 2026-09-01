import type { ShowTemplate } from './showLibrary';

export type FacilityEventType = 'BOOKING' | 'HOLD' | 'MAINTENANCE' | 'BLACKOUT' | 'AVAILABILITY_WINDOW';

export interface Resource {
  id: string;
  code: string;
  name: string;
  group: string;
  order: number;
  isBookable: boolean;
}

export interface ResourceDependency {
  primaryResourceId: string; // e.g. the Floor
  dependentResourceId: string; // e.g. the Control Room it requires
  type: 'REQUIRES' | 'SUGGESTS';
}

export interface FacilityEvent {
  id: string;
  resourceId: string;
  eventType: FacilityEventType;
  isBlocking: boolean;
  start: string; // ISO datetime, e.g. '2026-08-24T09:00:00'
  end: string;
  status: 'CONFIRMED' | 'HELD' | 'CANCELLED';
  title?: string;
  production?: string;
  client?: string;
  // Bookings sharing a bookingGroupId are an intentional, allowed
  // overlap (different client/production codes within one shift's
  // occupancy of the resource) — excluded from conflict detection
  // against each other, per the confirmed overlap policy.
  bookingGroupId?: string;
  // Bookings created together across different resources (e.g. a
  // Studio A Control Room + Floor pair) share a linkedBookingSetId —
  // dragging one moves the others together.
  linkedBookingSetId?: string;
  // Recurring roster/booking template linkage.
  seriesId?: string;
  isModifiedOccurrence?: boolean;
  // Links this instance to a real show template in showLibrary.ts, so
  // the detail panel can show actual crew/cost data for this booking.
  showKey?: string;
}

export type AccessLevel = 'READ_ONLY' | 'NOTE_ONLY' | 'EDIT' | 'SUPERUSER';

export interface SimUser {
  id: string;
  name: string;
  accessLevel: AccessLevel;
}

export interface BookingDraft {
  template: ShowTemplate | null;
  studio: string; // 'A' | 'B' | 'C' | 'D'
  resourceSelection: 'BOTH' | 'CR' | 'FL'; // which of Control Room/Floor to book — 'BOTH' when only one exists
  date: string; // YYYY-MM-DD — first occurrence's date
  startTime: string; // HH:mm
  durationHours: number;
  title: string;
  production: string;
  client: string;
  // Recurrence: which weekdays (0=Sun..6=Sat, matching Date.getDay()) this
  // booking repeats on, and for how many weeks. [] or length-1 arrays with
  // repeatWeeks=1 behave as a one-off booking on `date` only.
  repeatDays: number[];
  repeatWeeks: number;
}

export interface ChangeRequest {
  id: string;
  requestType: 'MOVE' | 'CREATE' | 'EDIT';
  targetEventId?: string; // set for MOVE
  requestedById: string;
  proposedStart: string;
  proposedEnd: string;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  wasValidAtRequestTime: boolean;
  createdAt: string;
  reviewedById?: string;
  // Populated for CREATE requests — the full draft + resolved resource
  // ids, so approval can regenerate every occurrence of a recurring
  // booking exactly as proposed, not just a single start/end.
  proposedDraft?: BookingDraft;
  proposedResourceIds?: string[];
}
