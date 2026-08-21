export type SkillCode =
  | 'TX'
  | 'VISION'
  | 'AUDIO'
  | 'EVS'
  | 'GFX'
  | 'MCR';

export interface Employee {
  id: string;
  name: string;
  initials: string;
  grade: string; // e.g. 'BREA-4'
  agreement: 'BREA' | 'BARE';
  skills: SkillCode[];
  primarySkill: SkillCode;
}

export type ShiftSlot = 'EARLY' | 'DAY' | 'LATE' | 'NIGHT';

export interface ShiftRequirement {
  skill: SkillCode;
  minGrade: number; // 1-6, compared against grade number parsed from employee.grade
  count: number;
}

export interface Shift {
  id: string;
  day: string; // ISO date, e.g. '2026-08-24'
  slot: ShiftSlot;
  start: string; // 'HH:mm'
  end: string; // 'HH:mm'
  production: string;
  requirements: ShiftRequirement[];
}

// assignments[shiftId][skill] = employeeId[]
export type Assignments = Record<string, Record<string, string[]>>;

export type FlagSeverity = 'ok' | 'warning' | 'breach';

export interface ComplianceFlag {
  severity: FlagSeverity;
  label: string;
}
