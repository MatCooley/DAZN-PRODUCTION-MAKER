import type { Assignments, Employee, Shift } from './types';
import rachelPhoto from '../assets/staff/rachel.jpg';

// Real DA/PA/VIZ staff, parsed from FoxSports roster export
// pmg_rosterdapaviz_r_we_sept_20.pdf (w/e 30 Aug – 20 Sep 2026). Skills
// reflect the role codes each person actually worked across that roster.
// No real grade/agreement data exists in the source, so `grade` just
// records employment basis rather than a fabricated skill grade.
// `team` is the manager-led team each person reports into — everyone
// currently loaded belongs to Rach's team; more teams get added as their
// rosters come in.
const RACH_TEAM = "Rach's Team";

export const employees: Employee[] = [
  { id: 'adriana', name: 'Adriana Nasato', initials: 'AN', grade: 'Permanent', agreement: 'BREA', skills: ['VIZ', 'DA'], primarySkill: 'VIZ', team: RACH_TEAM },
  { id: 'hannah', name: 'Hannah Bandi', initials: 'HB', grade: 'Permanent', agreement: 'BREA', skills: ['DA', 'PA', 'VIZ'], primarySkill: 'DA', team: RACH_TEAM },
  { id: 'mat', name: 'Mat Cooley', initials: 'MC', grade: 'Permanent', agreement: 'BREA', skills: ['PA', 'DA', 'VIZ'], primarySkill: 'PA', team: RACH_TEAM },
  { id: 'rachel', name: 'Rachel MacInnes', initials: 'RM', grade: 'Permanent', agreement: 'BREA', skills: ['VIZ', 'DA', 'SW', 'PA'], primarySkill: 'VIZ', photo: rachelPhoto, team: RACH_TEAM },
  { id: 'rodney', name: 'Rodney Geeves', initials: 'RG', grade: 'Permanent', agreement: 'BREA', skills: ['SW', 'VIZ', 'DA'], primarySkill: 'SW', team: RACH_TEAM },
  { id: 'claire', name: 'Claire Dwight', initials: 'CD', grade: 'Freelance', agreement: 'BARE', skills: ['DA'], primarySkill: 'DA', team: RACH_TEAM },
  { id: 'jessica', name: 'Jessica Fenton', initials: 'JF', grade: 'Freelance', agreement: 'BARE', skills: ['VIZ', 'DA'], primarySkill: 'VIZ', team: RACH_TEAM },
  { id: 'justine', name: 'Justine Nay-Potter', initials: 'JN', grade: 'Freelance', agreement: 'BARE', skills: ['DA'], primarySkill: 'DA', team: RACH_TEAM },
  { id: 'kylie', name: 'Kylie Warner', initials: 'KW', grade: 'Freelance', agreement: 'BARE', skills: ['DA'], primarySkill: 'DA', team: RACH_TEAM },
  { id: 'mel', name: 'Mel Macdonald', initials: 'MM', grade: 'Freelance', agreement: 'BARE', skills: ['VIZ', 'PA'], primarySkill: 'VIZ', team: RACH_TEAM },
  { id: 'melinda', name: 'Melinda Tran', initials: 'MT', grade: 'Freelance', agreement: 'BARE', skills: ['DA', 'VIZ'], primarySkill: 'DA', team: RACH_TEAM },
  { id: 'susan', name: 'Susan Fiori', initials: 'SF', grade: 'Freelance', agreement: 'BARE', skills: ['DA'], primarySkill: 'DA', team: RACH_TEAM },
  { id: 'elke', name: 'Elke Paynter', initials: 'EP', grade: 'Freelance', agreement: 'BARE', skills: ['DA'], primarySkill: 'DA', team: RACH_TEAM },
  { id: 'sharni', name: 'Sharni Pitman', initials: 'SP', grade: 'Freelance', agreement: 'BARE', skills: ['DA'], primarySkill: 'DA', team: RACH_TEAM },
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

// Real w/c 24 Aug 2026 shifts, parsed from the FoxSports roster PDF. No
// real grade data exists in the source, so every requirement's minGrade
// is 0 — grade-based compliance checks are effectively inert for this
// data set, they just don't trip false positives.
export const shifts: Shift[] = [
  { id: 's-mon-cricket', day: '2026-08-24', slot: 'EARLY', start: '07:00', end: '19:30', production: 'Cricket OB - Mackay', requirements: [req('DA', 0)] },
  { id: 's-mon-boxpresser-pa', day: '2026-08-24', slot: 'DAY', start: '10:00', end: '16:30', production: 'Boxing Presser - N Tszyu v Mahoney + PA Foxtel / Studio Records', requirements: [req('DA', 0)] },
  { id: 's-mon-boxpresser-sw', day: '2026-08-24', slot: 'DAY', start: '11:00', end: '13:00', production: 'Boxing Live-U Presser', requirements: [req('SW', 0)] },
  { id: 's-mon-nrl360', day: '2026-08-24', slot: 'DAY', start: '13:00', end: '20:30', production: 'NRL 360', requirements: [req('VIZ', 0), req('DA', 0)] },

  { id: 's-tue-cricket', day: '2026-08-25', slot: 'EARLY', start: '07:00', end: '19:30', production: 'Cricket OB - Mackay', requirements: [req('DA', 0)] },
  { id: 's-tue-weighin-sw', day: '2026-08-25', slot: 'DAY', start: '11:00', end: '13:00', production: 'Boxing Live-U Weigh-in', requirements: [req('SW', 0)] },
  { id: 's-tue-weighin-da', day: '2026-08-25', slot: 'DAY', start: '10:00', end: '20:30', production: 'Boxing Weigh-In + NRL 360 (Update Promos)', requirements: [req('DA', 0)] },
  { id: 's-tue-nrl360', day: '2026-08-25', slot: 'DAY', start: '13:00', end: '20:30', production: 'NRL 360', requirements: [req('VIZ', 0)] },

  { id: 's-wed-cricket', day: '2026-08-26', slot: 'EARLY', start: '07:00', end: '19:30', production: 'Cricket OB - Mackay', requirements: [req('DA', 0)] },
  { id: 's-wed-mracing', day: '2026-08-26', slot: 'DAY', start: '10:00', end: '18:30', production: 'Motor Racing 360', requirements: [req('VIZ', 0)] },
  { id: 's-wed-nrl360', day: '2026-08-26', slot: 'DAY', start: '13:00', end: '20:00', production: 'NRL 360', requirements: [req('VIZ', 0), req('DA', 0)] },

  { id: 's-thu-nrlw-lsmj', day: '2026-08-27', slot: 'LATE', start: '14:00', end: '23:30', production: 'NRLW Hosting + Matty Johns Late Show', requirements: [req('DA', 0), req('VIZ', 0)] },
  { id: 's-thu-tnl', day: '2026-08-27', slot: 'LATE', start: '17:00', end: '22:30', production: 'NRL Thursday (Thurs Night League)', requirements: [req('DA', 0)] },
  { id: 's-thu-fnf-prep', day: '2026-08-27', slot: 'LATE', start: '14:30', end: '22:30', production: 'Friday Night Footy (Prep)', requirements: [req('VIZ', 0)] },

  { id: 's-fri-ss-prep', day: '2026-08-28', slot: 'DAY', start: '10:00', end: '16:30', production: 'Super Saturday (Prep)', requirements: [req('VIZ', 0)] },
  { id: 's-fri-sportsbet', day: '2026-08-28', slot: 'EARLY', start: '08:30', end: '12:30', production: 'Sportsbet', requirements: [req('PA', 0), req('DA', 0)] },
  { id: 's-fri-fnf', day: '2026-08-28', slot: 'LATE', start: '14:00', end: '23:30', production: 'NRL Friday Night Footy', requirements: [req('VIZ', 0), req('DA', 0)] },

  { id: 's-sat-superSaturday', day: '2026-08-29', slot: 'LATE', start: '15:00', end: '23:30', production: 'NRL Super Saturday', requirements: [req('VIZ', 0), req('DA', 0)] },
  { id: 's-sat-boxingob', day: '2026-08-29', slot: 'DAY', start: '13:00', end: '23:30', production: 'Boxing OB Prep + Live - N Tszyu v Mahoney (GC)', requirements: [req('VIZ', 0)] },

  { id: 's-sun-nrlw-snmj', day: '2026-08-30', slot: 'DAY', start: '12:30', end: '20:30', production: 'NRLW (x1 game) + Sunday Matty Johns Show', requirements: [req('DA', 0), req('VIZ', 0)] },
  { id: 's-sun-sunticket', day: '2026-08-30', slot: 'DAY', start: '11:30', end: '20:30', production: 'NRL Sunday Ticket + NRLW', requirements: [req('DA', 0)] },
];

// Pre-seeded with the real staff who worked each real shift above, so the
// board opens showing an accurate picture of the w/c 24 Aug week instead
// of an empty grid. Still fully editable via drag-and-drop as normal.
export const initialAssignments: Assignments = {
  's-mon-cricket': { DA: ['hannah'] },
  's-mon-boxpresser-pa': { DA: ['rachel'] },
  's-mon-boxpresser-sw': { SW: ['rodney'] },
  's-mon-nrl360': { VIZ: ['rodney'], DA: ['kylie'] },

  's-tue-cricket': { DA: ['hannah'] },
  's-tue-weighin-sw': { SW: ['rodney'] },
  's-tue-weighin-da': { DA: ['adriana'] },
  's-tue-nrl360': { VIZ: ['jessica'] },

  's-wed-cricket': { DA: ['hannah'] },
  's-wed-mracing': { VIZ: ['rachel'] },
  's-wed-nrl360': { VIZ: ['jessica'], DA: ['justine'] },

  's-thu-nrlw-lsmj': { DA: ['claire'], VIZ: ['mel'] },
  's-thu-tnl': { DA: ['justine'] },
  's-thu-fnf-prep': { VIZ: ['rachel'] },

  's-fri-ss-prep': { VIZ: ['adriana'] },
  's-fri-sportsbet': { PA: ['mat'], DA: ['melinda'] },
  's-fri-fnf': { VIZ: ['rachel'], DA: ['justine'] },

  's-sat-superSaturday': { VIZ: ['adriana'], DA: ['claire'] },
  's-sat-boxingob': { VIZ: ['rodney'] },

  's-sun-nrlw-snmj': { DA: ['claire'], VIZ: ['mel'] },
  's-sun-sunticket': { DA: ['kylie'] },
};

export function gradeNumber(grade: string): number {
  const n = parseInt(grade.split('-')[1] ?? '0', 10);
  return Number.isNaN(n) ? 0 : n;
}

export const slotOrder: Record<Shift['slot'], number> = { EARLY: 0, DAY: 1, LATE: 2, NIGHT: 3 };
