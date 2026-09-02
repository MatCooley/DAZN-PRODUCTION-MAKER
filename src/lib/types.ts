// Role codes as used on the real FoxSports DA/PA/VIZ roster:
// DA = Data/Duty Assistant, VIZ = Vision graphics operator, PA = Production
// Assistant, SW = Switcher (the DA/PA/VIZ roster often lists this combined
// with Director as "dir/swi"). The remaining codes are the broadcast crew
// roles used by showLibrary.ts's real per-show crew list (parsed from
// Studio_Staff_cost.xlsx) — matched 1:1 against that sheet's role names so
// a booking's crew list can be turned directly into roster requirements.
export type SkillCode =
  | 'DA'
  | 'VIZ'
  | 'PA'
  | 'SW'
  | 'FM'
  | 'TD'
  | 'STEADI'
  | 'DIR'
  | 'LD'
  | 'MU'
  | 'STG'
  | 'WARD'
  | 'CAM'
  | 'AUD'
  | 'AUDA'
  | 'EVS'
  | 'JIB';

export interface Employee {
  id: string;
  name: string;
  initials: string;
  grade: string; // e.g. 'BREA-4'
  agreement: 'BREA' | 'BARE';
  skills: SkillCode[];
  primarySkill: SkillCode;
  photo?: string;
  team: string; // the manager-led team this person reports into, e.g. "Rach's Team"
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
