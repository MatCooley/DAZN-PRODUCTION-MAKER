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
}
