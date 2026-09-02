import type { Assignments, Employee, Shift } from './types';

export interface RosterTableEntry {
  shiftId: string;
  skill: Shift['requirements'][number]['skill'];
  production: string;
  start: string;
  end: string;
}

function to12Hour(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour12} ${period}` : `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatShiftTime(start: string, end: string): string {
  return `${to12Hour(start)} – ${to12Hour(end)}`;
}

// employeeId -> day (ISO date) -> shifts that person is assigned to that day
export function buildRosterTable(
  employees: Employee[],
  shifts: Shift[],
  assignments: Assignments,
): Map<string, Map<string, RosterTableEntry[]>> {
  const table = new Map<string, Map<string, RosterTableEntry[]>>();
  for (const emp of employees) table.set(emp.id, new Map());

  for (const shift of shifts) {
    const bySkill = assignments[shift.id] ?? {};
    for (const [skill, employeeIds] of Object.entries(bySkill)) {
      for (const employeeId of employeeIds) {
        const byDay = table.get(employeeId);
        if (!byDay) continue; // assigned employee isn't in this filtered view
        const list = byDay.get(shift.day) ?? [];
        list.push({ shiftId: shift.id, skill: skill as Shift['requirements'][number]['skill'], production: shift.production, start: shift.start, end: shift.end });
        byDay.set(shift.day, list);
      }
    }
  }

  return table;
}
