import type { FacilityEventType } from './facilityTypes';

export const DEFAULT_PX_PER_HOUR = 34; // fallback before the container is measured
export const MIN_PX_PER_HOUR = 6; // below this, hour ticks/labels stop being legible — horizontal scroll takes over
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
