import type { Assignments, ComplianceFlag, DayOff, Employee, Shift, FlagSeverity } from './types';
import { gradeNumber } from './data';

const MIN_TURNAROUND_HOURS = 10; // HARD — industrial minimum
const PREFERRED_TURNAROUND_HOURS = 11; // company fatigue standard
const MAX_CONSECUTIVE_NIGHTS_WARNING = 3;
const MAX_SHIFT_HOURS = 12; // universal fatigue/safety limit, all employment types
const MAX_WEEK_HOURS = 50; // universal weekly cap, all employment types
export const FULLTIME_WEEK_STD_HOURS = 38; // standard week for Permanent staff
const FULLTIME_WEEK_REASONABLE_HOURS = 40; // reasonable additional before it's overtime, Permanent staff only

export function mondayOf(day: string): string {
  const d = new Date(`${day}T00:00:00`);
  const diffFromMonday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diffFromMonday);
  return d.toISOString().slice(0, 10);
}

function durationHours(shift: Shift): number {
  return (shiftEnd(shift).getTime() - shiftStart(shift).getTime()) / 3_600_000;
}

function toDate(day: string, time: string, rollFrom?: Date): Date {
  const d = new Date(`${day}T${time}:00`);
  if (rollFrom && d.getTime() <= rollFrom.getTime()) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

export function shiftStart(shift: Shift): Date {
  return new Date(`${shift.day}T${shift.start}:00`);
}

export function shiftEnd(shift: Shift): Date {
  const start = shiftStart(shift);
  return toDate(shift.day, shift.end, start);
}

export interface AssignmentFlags {
  [shiftId: string]: {
    [employeeId: string]: ComplianceFlag[];
  };
}

export type ShiftStatus = 'empty' | 'partial' | 'ok' | 'warning' | 'breach';

export interface ComplianceResult {
  shiftStatus: Record<string, ShiftStatus>;
  assignmentFlags: AssignmentFlags;
  shiftFillSummary: Record<string, { filled: number; required: number }>;
}

function worst(a: FlagSeverity, b: FlagSeverity): FlagSeverity {
  const rank: Record<FlagSeverity, number> = { ok: 0, warning: 1, breach: 2 };
  return rank[a] >= rank[b] ? a : b;
}

export function computeCompliance(
  shifts: Shift[],
  assignments: Assignments,
  employees: Employee[]
): ComplianceResult {
  const empById = new Map(employees.map((e) => [e.id, e]));
  const assignmentFlags: AssignmentFlags = {};
  const addFlag = (shiftId: string, employeeId: string, flag: ComplianceFlag) => {
    assignmentFlags[shiftId] ??= {};
    assignmentFlags[shiftId][employeeId] ??= [];
    assignmentFlags[shiftId][employeeId].push(flag);
  };

  // --- 1. Per-employee chronological checks: turnaround + consecutive nights ---
  const shiftsById = new Map(shifts.map((s) => [s.id, s]));

  for (const emp of employees) {
    const empShiftIds: string[] = [];
    for (const [shiftId, bySkill] of Object.entries(assignments)) {
      for (const ids of Object.values(bySkill)) {
        if (ids.includes(emp.id)) empShiftIds.push(shiftId);
      }
    }
    const empShifts = empShiftIds
      .map((id) => shiftsById.get(id))
      .filter((s): s is Shift => !!s)
      .sort((a, b) => shiftStart(a).getTime() - shiftStart(b).getTime());

    // Turnaround between consecutive shifts
    for (let i = 1; i < empShifts.length; i++) {
      const prev = empShifts[i - 1];
      const next = empShifts[i];
      const gapHours = (shiftStart(next).getTime() - shiftEnd(prev).getTime()) / 3_600_000;
      if (gapHours < MIN_TURNAROUND_HOURS) {
        addFlag(next.id, emp.id, {
          severity: 'breach',
          label: `Only ${gapHours.toFixed(1)}h turnaround (min ${MIN_TURNAROUND_HOURS}h)`,
        });
      } else if (gapHours < PREFERRED_TURNAROUND_HOURS) {
        addFlag(next.id, emp.id, {
          severity: 'warning',
          label: `${gapHours.toFixed(1)}h turnaround — below ${PREFERRED_TURNAROUND_HOURS}h fatigue standard`,
        });
      }
    }

    // Consecutive NIGHT shifts (on consecutive calendar days)
    let run = 0;
    for (let i = 0; i < empShifts.length; i++) {
      const s = empShifts[i];
      const prev = empShifts[i - 1];
      const consecutiveDay =
        prev &&
        prev.slot === 'NIGHT' &&
        s.slot === 'NIGHT' &&
        (shiftStart(s).getTime() - shiftStart(prev).getTime()) / 3_600_000 <= 36;
      run = s.slot === 'NIGHT' ? (consecutiveDay ? run + 1 : 1) : 0;
      if (s.slot === 'NIGHT' && run >= MAX_CONSECUTIVE_NIGHTS_WARNING) {
        addFlag(s.id, emp.id, {
          severity: 'warning',
          label: `${run}rd/th consecutive night shift`,
        });
      }
    }

    // Max shift length — universal fatigue/safety limit
    for (const s of empShifts) {
      const dur = durationHours(s);
      if (dur > MAX_SHIFT_HOURS) {
        addFlag(s.id, emp.id, {
          severity: 'warning',
          label: `${dur.toFixed(1)}h shift — over the ${MAX_SHIFT_HOURS}h limit`,
        });
      }
    }

    // Weekly hours — universal cap, plus a tighter standard/reasonable band for Permanent staff
    const hoursByWeek = new Map<string, { hours: number; shiftIds: string[] }>();
    for (const s of empShifts) {
      const week = mondayOf(s.day);
      const entry = hoursByWeek.get(week) ?? { hours: 0, shiftIds: [] };
      entry.hours += durationHours(s);
      entry.shiftIds.push(s.id);
      hoursByWeek.set(week, entry);
    }
    const isFullTime = emp.grade === 'Permanent';
    for (const { hours, shiftIds } of hoursByWeek.values()) {
      if (hours > MAX_WEEK_HOURS) {
        for (const id of shiftIds) {
          addFlag(id, emp.id, {
            severity: 'warning',
            label: `${Math.round(hours)}h this week — over the ${MAX_WEEK_HOURS}h week`,
          });
        }
      }
      if (isFullTime && hours > FULLTIME_WEEK_REASONABLE_HOURS) {
        for (const id of shiftIds) {
          addFlag(id, emp.id, {
            severity: 'warning',
            label: `${Math.round(hours)}h this week — overtime (over ${FULLTIME_WEEK_REASONABLE_HOURS}h reasonable additional)`,
          });
        }
      } else if (isFullTime && hours > FULLTIME_WEEK_STD_HOURS) {
        for (const id of shiftIds) {
          addFlag(id, emp.id, {
            severity: 'warning',
            label: `${Math.round(hours)}h this week — reasonable additional hours (over ${FULLTIME_WEEK_STD_HOURS}h standard)`,
          });
        }
      }
    }
  }

  // --- 2. Coverage + grade checks per shift ---
  const shiftStatus: Record<string, ShiftStatus> = {};
  const shiftFillSummary: Record<string, { filled: number; required: number }> = {};

  for (const shift of shifts) {
    let required = 0;
    let filled = 0;
    let coverageBreach = false;

    for (const r of shift.requirements) {
      required += r.count;
      const assignedIds = assignments[shift.id]?.[r.skill] ?? [];
      filled += assignedIds.length;
      if (assignedIds.length < r.count) coverageBreach = true;

      for (const empId of assignedIds) {
        const emp = empById.get(empId);
        if (emp && gradeNumber(emp.grade) < r.minGrade) {
          addFlag(shift.id, empId, {
            severity: 'breach',
            label: `Below minimum grade (needs ${r.minGrade}, has ${gradeNumber(emp.grade)})`,
          });
        }
      }
    }

    shiftFillSummary[shift.id] = { filled, required };

    let worstFlagSeverity: FlagSeverity = 'ok';
    for (const flags of Object.values(assignmentFlags[shift.id] ?? {})) {
      for (const f of flags) worstFlagSeverity = worst(worstFlagSeverity, f.severity);
    }

    if (coverageBreach && filled === 0) {
      shiftStatus[shift.id] = 'empty';
    } else if (coverageBreach) {
      shiftStatus[shift.id] = worst(worstFlagSeverity, 'breach');
    } else {
      shiftStatus[shift.id] = worstFlagSeverity === 'ok' ? 'ok' : worstFlagSeverity;
    }
  }

  return { shiftStatus, assignmentFlags, shiftFillSummary };
}

// Same three questions asked live while a chip is dragged over a slot that
// the compliance pass answers after the drop: is this person signed off for
// the role, are they already on this shift, is the slot full, and would
// this land them on something that overlaps or leaves too little turnaround.
export type DropVerdict = 'ok' | 'tight' | 'busy' | 'invalid' | 'full' | 'duplicate';

export function computeDropVerdict(
  shiftsById: Map<string, Shift>,
  assignments: Assignments,
  employeesById: Map<string, Employee>,
  shiftId: string,
  skill: string,
  employeeId: string
): DropVerdict | null {
  const shift = shiftsById.get(shiftId);
  const employee = employeesById.get(employeeId);
  if (!shift || !employee) return null;

  const requirement = shift.requirements.find((r) => r.skill === skill);
  if (!requirement) return null;
  if (!employee.skills.includes(requirement.skill)) return 'invalid';

  const shiftAssignments = assignments[shiftId] ?? {};
  const alreadyOnShift = Object.values(shiftAssignments).some((ids) => ids.includes(employeeId));
  if (alreadyOnShift) return 'duplicate';

  const currentForSkill = shiftAssignments[skill] ?? [];
  if (currentForSkill.length >= requirement.count) return 'full';

  const meStart = shiftStart(shift).getTime();
  const meEnd = shiftEnd(shift).getTime();
  let tight = false;
  for (const [otherShiftId, bySkill] of Object.entries(assignments)) {
    if (otherShiftId === shiftId) continue;
    if (!Object.values(bySkill).some((ids) => ids.includes(employeeId))) continue;
    const other = shiftsById.get(otherShiftId);
    if (!other) continue;
    const otherStart = shiftStart(other).getTime();
    const otherEnd = shiftEnd(other).getTime();
    if (meStart < otherEnd && otherStart < meEnd) return 'busy';
    const gapHours = (meStart >= otherEnd ? meStart - otherEnd : otherStart - meEnd) / 3_600_000;
    if (gapHours < MIN_TURNAROUND_HOURS) tight = true;
  }
  return tight ? 'tight' : 'ok';
}

// ---------- Crew panel stats ----------
// Per-employee hours/RDO picture, mirroring the same weekly bands used by
// the compliance pass above so the two never disagree about what "over
// standard" means.
export interface CrewStat {
  employeeId: string;
  isFullTime: boolean;
  hoursThisWeek: number;
  daysWorkedThisWeek: number;
  rdoOwed: number; // days off owed this week, full-time only
  rdoWorkedThisWeek: number; // shifts this week landing on a marked day off
  otSeasonHours: number; // cumulative hours past the 38h standard, full-time only, since the earliest known shift
  weekBand: 'std' | 'extra' | 'over'; // this week's hours against the same 38h/40h marks the compliance pass uses, full-time only
}

export function computeCrewStats(
  shifts: Shift[],
  assignments: Assignments,
  employees: Employee[],
  daysOff: DayOff[],
  weekStart: string
): Record<string, CrewStat> {
  const shiftsById = new Map(shifts.map((s) => [s.id, s]));
  const shiftIdsByEmployee = new Map<string, string[]>();
  for (const [shiftId, bySkill] of Object.entries(assignments)) {
    for (const ids of Object.values(bySkill)) {
      for (const empId of ids) {
        const list = shiftIdsByEmployee.get(empId) ?? [];
        list.push(shiftId);
        shiftIdsByEmployee.set(empId, list);
      }
    }
  }

  const daysOffByEmployee = new Map<string, Set<string>>();
  for (const off of daysOff) {
    const set = daysOffByEmployee.get(off.employeeId) ?? new Set<string>();
    set.add(off.date);
    daysOffByEmployee.set(off.employeeId, set);
  }

  const weekEnd = (() => {
    const d = new Date(`${weekStart}T00:00:00`);
    d.setDate(d.getDate() + 6);
    return d.toISOString().slice(0, 10);
  })();

  const result: Record<string, CrewStat> = {};
  for (const emp of employees) {
    const empShiftIds = shiftIdsByEmployee.get(emp.id) ?? [];
    const empShifts = empShiftIds.map((id) => shiftsById.get(id)).filter((s): s is Shift => !!s);
    const isFullTime = emp.grade === 'Permanent';
    const markedOff = daysOffByEmployee.get(emp.id) ?? new Set<string>();

    const datesThisWeek = new Set<string>();
    let hoursThisWeek = 0;
    let rdoWorkedThisWeek = 0;
    for (const s of empShifts) {
      if (s.day < weekStart || s.day > weekEnd) continue;
      datesThisWeek.add(s.day);
      hoursThisWeek += durationHours(s);
      if (markedOff.has(s.day)) rdoWorkedThisWeek++;
    }
    const daysWorkedThisWeek = datesThisWeek.size;
    const rdoOwed = isFullTime ? Math.max(0, daysWorkedThisWeek - 5) : 0;

    let otSeasonHours = 0;
    if (isFullTime) {
      const hoursByWeek = new Map<string, number>();
      for (const s of empShifts) {
        const wk = mondayOf(s.day);
        hoursByWeek.set(wk, (hoursByWeek.get(wk) ?? 0) + durationHours(s));
      }
      for (const hours of hoursByWeek.values()) {
        otSeasonHours += Math.max(0, hours - FULLTIME_WEEK_STD_HOURS);
      }
    }

    const weekBand: CrewStat['weekBand'] = !isFullTime
      ? 'std'
      : hoursThisWeek > FULLTIME_WEEK_REASONABLE_HOURS
        ? 'over'
        : hoursThisWeek > FULLTIME_WEEK_STD_HOURS
          ? 'extra'
          : 'std';

    result[emp.id] = { employeeId: emp.id, isFullTime, hoursThisWeek, daysWorkedThisWeek, rdoOwed, rdoWorkedThisWeek, otSeasonHours, weekBand };
  }
  return result;
}

// ---------- Crew member detail ----------
const DAILY_STD_HOURS = 8;
export const FULLTIME_MONTH_STD_HOURS = FULLTIME_WEEK_STD_HOURS * 4;

function shiftsForEmployee(shifts: Shift[], assignments: Assignments, employeeId: string): Shift[] {
  const shiftsById = new Map(shifts.map((s) => [s.id, s]));
  const out: Shift[] = [];
  for (const [shiftId, bySkill] of Object.entries(assignments)) {
    if (!Object.values(bySkill).some((ids) => ids.includes(employeeId))) continue;
    const shift = shiftsById.get(shiftId);
    if (shift) out.push(shift);
  }
  return out;
}

export interface DailyOvertime {
  date: string;
  worked: number;
  overtime: number;
  production: string;
}

// Any day this person worked past the 8h daily standard, with what they
// were on — the list a coordinator is asked to justify.
export function computeDailyOvertime(
  shifts: Shift[],
  assignments: Assignments,
  employeeId: string,
  days: string[]
): DailyOvertime[] {
  const daySet = new Set(days);
  const byDate = new Map<string, { worked: number; productions: string[] }>();
  for (const s of shiftsForEmployee(shifts, assignments, employeeId)) {
    if (!daySet.has(s.day)) continue;
    const entry = byDate.get(s.day) ?? { worked: 0, productions: [] };
    entry.worked += durationHours(s);
    entry.productions.push(s.production);
    byDate.set(s.day, entry);
  }
  const out: DailyOvertime[] = [];
  for (const [date, { worked, productions }] of byDate) {
    if (worked > DAILY_STD_HOURS) {
      out.push({ date, worked, overtime: worked - DAILY_STD_HOURS, production: productions.join(', ') });
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

// The trailing 30 days ending on the last day of the displayed week, same
// window shape as the season figure above and for the same reason: it
// always fully contains the visible week, so it can never read lower.
export function computeRolling30DayHours(shifts: Shift[], assignments: Assignments, employeeId: string, weekEnd: string): number {
  const end = new Date(`${weekEnd}T00:00:00`);
  const start = new Date(end);
  start.setDate(start.getDate() - 29);
  const startIso = start.toISOString().slice(0, 10);
  let hours = 0;
  for (const s of shiftsForEmployee(shifts, assignments, employeeId)) {
    if (s.day >= startIso && s.day <= weekEnd) hours += durationHours(s);
  }
  return hours;
}

export interface MonthSummary {
  calls: number;
  hours: number;
  days: number;
  shifts: Shift[];
}

export function computeMonthSummary(
  shifts: Shift[],
  assignments: Assignments,
  employeeId: string,
  monthStart: string,
  monthEnd: string
): MonthSummary {
  const inMonth = shiftsForEmployee(shifts, assignments, employeeId)
    .filter((s) => s.day >= monthStart && s.day <= monthEnd)
    .sort((a, b) => (a.day === b.day ? a.start.localeCompare(b.start) : a.day.localeCompare(b.day)));
  const days = new Set(inMonth.map((s) => s.day));
  const hours = inMonth.reduce((t, s) => t + durationHours(s), 0);
  return { calls: inMonth.length, hours, days: days.size, shifts: inMonth };
}
