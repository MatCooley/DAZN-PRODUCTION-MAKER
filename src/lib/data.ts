import type { Employee, Shift } from './types';

export const employees: Employee[] = [
  { id: 'e1', name: 'Priya Nair', initials: 'PN', grade: 'BREA-5', agreement: 'BREA', skills: ['TX', 'MCR'], primarySkill: 'TX' },
  { id: 'e2', name: 'Josh Kelleher', initials: 'JK', grade: 'BREA-4', agreement: 'BREA', skills: ['TX'], primarySkill: 'TX' },
  { id: 'e3', name: 'Mia Chen', initials: 'MC', grade: 'BREA-6', agreement: 'BREA', skills: ['VISION', 'TX'], primarySkill: 'VISION' },
  { id: 'e4', name: 'Dave Okafor', initials: 'DO', grade: 'BREA-4', agreement: 'BREA', skills: ['VISION'], primarySkill: 'VISION' },
  { id: 'e5', name: 'Lena Kovac', initials: 'LK', grade: 'BARE-3', agreement: 'BARE', skills: ['AUDIO'], primarySkill: 'AUDIO' },
  { id: 'e6', name: 'Sam Ahtiainen', initials: 'SA', grade: 'BARE-4', agreement: 'BARE', skills: ['AUDIO', 'MCR'], primarySkill: 'AUDIO' },
  { id: 'e7', name: 'Toa Faleolo', initials: 'TF', grade: 'BREA-5', agreement: 'BREA', skills: ['EVS'], primarySkill: 'EVS' },
  { id: 'e8', name: 'Grace Whitfield', initials: 'GW', grade: 'BREA-3', agreement: 'BREA', skills: ['EVS'], primarySkill: 'EVS' },
  { id: 'e9', name: 'Ravi Subramaniam', initials: 'RS', grade: 'BREA-6', agreement: 'BREA', skills: ['EVS', 'VISION'], primarySkill: 'EVS' },
  { id: 'e10', name: 'Anika Petrov', initials: 'AP', grade: 'BARE-3', agreement: 'BARE', skills: ['GFX'], primarySkill: 'GFX' },
  { id: 'e11', name: 'Noah Fitzgerald', initials: 'NF', grade: 'BARE-4', agreement: 'BARE', skills: ['GFX', 'MCR'], primarySkill: 'GFX' },
  { id: 'e12', name: 'Isabel Trần', initials: 'IT', grade: 'BREA-4', agreement: 'BREA', skills: ['MCR', 'TX'], primarySkill: 'MCR' },
  { id: 'e13', name: 'Beau Ngatai', initials: 'BN', grade: 'BREA-3', agreement: 'BREA', skills: ['MCR'], primarySkill: 'MCR' },
  { id: 'e14', name: 'Farrah Hassan', initials: 'FH', grade: 'BARE-2', agreement: 'BARE', skills: ['AUDIO'], primarySkill: 'AUDIO' },
];

export const days = [
  { date: '2026-08-24', label: 'Mon' },
  { date: '2026-08-25', label: 'Tue' },
  { date: '2026-08-26', label: 'Wed' },
  { date: '2026-08-27', label: 'Thu' },
  { date: '2026-08-28', label: 'Fri' },
  { date: '2026-08-29', label: 'Sat' },
  { date: '2026-08-30', label: 'Sun' },
];

const req = (skill: Shift['requirements'][number]['skill'], minGrade: number, count = 1) => ({ skill, minGrade, count });
void req; // kept for reuse when shifts are added back — see comment below

// Clean slate — no seeded shifts. There's currently no "add shift" UI on
// the roster side (unlike Studios' booking wizard), so ask Claude to add
// specific shift slots back, or to build an equivalent creation flow,
// once you're ready to populate a real week.
export const shifts: Shift[] = [];

export function gradeNumber(grade: string): number {
  const n = parseInt(grade.split('-')[1] ?? '0', 10);
  return Number.isNaN(n) ? 0 : n;
}

export const slotOrder: Record<Shift['slot'], number> = { EARLY: 0, DAY: 1, LATE: 2, NIGHT: 3 };
