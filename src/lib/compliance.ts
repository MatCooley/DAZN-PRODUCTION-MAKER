import type { Assignments, ComplianceFlag, Employee, Shift, FlagSeverity } from './types';
import { gradeNumber } from './data';

const MIN_TURNAROUND_HOURS = 10; // HARD — industrial minimum
const PREFERRED_TURNAROUND_HOURS = 11; // company fatigue standard
const MAX_CONSECUTIVE_NIGHTS_WARNING = 3;

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
