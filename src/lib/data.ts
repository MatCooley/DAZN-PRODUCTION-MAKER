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

export const shifts: Shift[] = [
  // Monday
  { id: 's-mon-early', day: '2026-08-24', slot: 'EARLY', start: '05:30', end: '13:30', production: 'Studio A — Breakfast Sport', requirements: [req('TX', 3), req('MCR', 2)] },
  { id: 's-mon-day', day: '2026-08-24', slot: 'DAY', start: '09:00', end: '17:00', production: 'Studio B — Highlights Desk', requirements: [req('VISION', 3), req('GFX', 2)] },
  { id: 's-mon-late', day: '2026-08-24', slot: 'LATE', start: '14:00', end: '22:30', production: 'NRL Thursday Prep', requirements: [req('EVS', 3, 2), req('AUDIO', 2)] },

  // Tuesday
  { id: 's-tue-early', day: '2026-08-25', slot: 'EARLY', start: '05:30', end: '13:30', production: 'Studio A — Breakfast Sport', requirements: [req('TX', 3), req('MCR', 2)] },
  { id: 's-tue-day', day: '2026-08-25', slot: 'DAY', start: '09:00', end: '17:00', production: 'Studio B — Highlights Desk', requirements: [req('VISION', 3), req('GFX', 2)] },
  { id: 's-tue-night', day: '2026-08-25', slot: 'NIGHT', start: '22:00', end: '06:00', production: 'Boxing — Sydney Undercard', requirements: [req('TX', 4), req('VISION', 4), req('EVS', 3, 2), req('AUDIO', 3)] },

  // Wednesday
  { id: 's-wed-early', day: '2026-08-26', slot: 'EARLY', start: '06:00', end: '14:00', production: 'Studio A — Breakfast Sport', requirements: [req('TX', 3), req('MCR', 2)] },
  { id: 's-wed-late', day: '2026-08-26', slot: 'LATE', start: '14:00', end: '22:30', production: 'NRL Thursday Prep', requirements: [req('EVS', 3, 2), req('AUDIO', 2)] },

  // Thursday — big live night
  { id: 's-thu-day', day: '2026-08-27', slot: 'DAY', start: '10:00', end: '18:00', production: 'NRL Studio — Bump-in', requirements: [req('VISION', 3), req('GFX', 2), req('MCR', 3)] },
  { id: 's-thu-night', day: '2026-08-27', slot: 'NIGHT', start: '17:00', end: '01:00', production: 'NRL — Thu Night Live', requirements: [req('TX', 5), req('VISION', 4), req('EVS', 3, 2), req('AUDIO', 3), req('GFX', 2)] },

  // Friday
  { id: 's-fri-early', day: '2026-08-28', slot: 'EARLY', start: '06:00', end: '14:00', production: 'Studio A — Breakfast Sport', requirements: [req('TX', 3), req('MCR', 2)] },
  { id: 's-fri-late', day: '2026-08-28', slot: 'LATE', start: '15:00', end: '23:30', production: 'Studio B — Friday Wrap', requirements: [req('VISION', 3), req('GFX', 2)] },

  // Saturday — boxing main card
  { id: 's-sat-day', day: '2026-08-29', slot: 'DAY', start: '11:00', end: '19:00', production: 'Boxing — Fight Week Build', requirements: [req('EVS', 3), req('GFX', 2)] },
  { id: 's-sat-night', day: '2026-08-29', slot: 'NIGHT', start: '19:00', end: '03:00', production: 'Boxing — Main Card Live', requirements: [req('TX', 5), req('VISION', 4), req('EVS', 4, 2), req('AUDIO', 3), req('MCR', 3)] },

  // Sunday
  { id: 's-sun-early', day: '2026-08-30', slot: 'EARLY', start: '06:00', end: '14:00', production: 'Studio A — Sunday Sport', requirements: [req('TX', 3), req('MCR', 2)] },
  { id: 's-sun-day', day: '2026-08-30', slot: 'DAY', start: '09:30', end: '17:30', production: 'NRL — Sun Afternoon Live', requirements: [req('TX', 4), req('VISION', 3), req('EVS', 3, 2), req('AUDIO', 2)] },
];

export function gradeNumber(grade: string): number {
  const n = parseInt(grade.split('-')[1] ?? '0', 10);
  return Number.isNaN(n) ? 0 : n;
}

export const slotOrder: Record<Shift['slot'], number> = { EARLY: 0, DAY: 1, LATE: 2, NIGHT: 3 };
