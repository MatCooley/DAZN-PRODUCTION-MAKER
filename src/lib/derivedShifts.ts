import type { FacilityEvent } from './facilityTypes';
import type { Shift, ShiftRequirement, ShiftSlot, SkillCode } from './types';
import { showTemplateByKey, skillCodeForRole } from './showLibrary';
import { toLocalDateString } from './dateUtils';

function slotForHour(hour: number): ShiftSlot {
  if (hour < 10) return 'EARLY';
  if (hour < 14) return 'DAY';
  if (hour < 21) return 'LATE';
  return 'NIGHT';
}

function toHHmm(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// Turns confirmed studio bookings into roster shifts. A booking linked to
// a real show template (via showKey) gets its crew from that show's real
// crew list (Studio_Staff_cost.xlsx), minus anything unchecked in the
// wizard; a custom booking with no template instead uses whatever crew
// was hand-picked for it. A booking's linked Control-Room + Floor rows
// share one crew list, so they collapse into a single derived shift.
export function buildDerivedShifts(events: FacilityEvent[]): Shift[] {
  const seenBookingGroups = new Set<string>();
  const result: Shift[] = [];

  for (const event of events) {
    if (event.eventType !== 'BOOKING' || event.status === 'CANCELLED') continue;

    const dedupeKey = event.linkedBookingSetId ?? event.id;
    if (seenBookingGroups.has(dedupeKey)) continue;

    const template = event.showKey ? showTemplateByKey(event.showKey) : undefined;
    if (!template && !event.customCrew?.length) continue; // nothing to build requirements from

    const countBySkill = new Map<SkillCode, number>();
    if (template) {
      const excluded = new Set(event.excludedCrewRoles ?? []);
      for (const line of template.crew) {
        if (excluded.has(line.role)) continue; // unchecked in the booking wizard's crew list
        const skill = skillCodeForRole(line.role);
        if (!skill) continue; // unmapped role — skip rather than guess
        countBySkill.set(skill, (countBySkill.get(skill) ?? 0) + line.count);
      }
    } else {
      for (const line of event.customCrew ?? []) {
        countBySkill.set(line.skill, (countBySkill.get(line.skill) ?? 0) + line.count);
      }
    }
    if (countBySkill.size === 0) continue;

    seenBookingGroups.add(dedupeKey);

    const requirements: ShiftRequirement[] = Array.from(countBySkill, ([skill, count]) => ({
      skill,
      minGrade: 0,
      count,
    }));

    result.push({
      id: `derived-${dedupeKey}`,
      day: toLocalDateString(new Date(event.start)),
      slot: slotForHour(new Date(event.start).getHours()),
      start: toHHmm(event.start),
      end: toHHmm(event.end),
      production: event.title ?? event.production ?? template?.name ?? 'Booking',
      requirements,
    });
  }

  return result;
}
