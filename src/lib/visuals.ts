import type { ShiftSlot, SkillCode } from './types';

export const allSkillCodes: SkillCode[] = [
  'DA',
  'VIZ',
  'PA',
  'SW',
  'DIR',
  'TD',
  'FM',
  'CAM',
  'STEADI',
  'AUD',
  'AUDA',
  'EVS',
  'JIB',
  'LD',
  'MU',
  'STG',
  'WARD',
];

// Labels match showLibrary.ts's crew role names exactly (parsed from
// Studio_Staff_cost.xlsx), so a booking's crew list maps straight onto
// these codes without a lossy name translation.
export const skillLabel: Record<SkillCode, string> = {
  DA: 'DA',
  VIZ: 'VIZ Op',
  PA: 'PA',
  SW: 'Switcher',
  FM: 'Floor Manager',
  TD: 'Technical Director',
  STEADI: 'Stedicam Op',
  DIR: 'Director',
  LD: 'Lighting Director',
  MU: 'Make Up',
  STG: 'Staging',
  WARD: 'Wardrobe',
  CAM: 'Camera Operator',
  AUD: 'Audio Director',
  AUDA: 'Audio Assistant',
  EVS: 'EVS Operator',
  JIB: 'JIB Operator',
};

export const skillColor: Record<SkillCode, string> = {
  DA: '#e1543d',
  VIZ: '#35c1d6',
  PA: '#e8a93c',
  SW: '#8b7ce8',
  FM: '#84cc16',
  TD: '#0ea5e9',
  STEADI: '#b45309',
  DIR: '#c084fc',
  LD: '#fbbf24',
  MU: '#f472b6',
  STG: '#94a3b8',
  WARD: '#fb7185',
  CAM: '#4dd68c',
  AUD: '#f97316',
  AUDA: '#fdba74',
  EVS: '#4f9de0',
  JIB: '#22d3ee',
};

export const slotLabel: Record<ShiftSlot, string> = {
  EARLY: 'Early',
  DAY: 'Day',
  LATE: 'Late',
  NIGHT: 'Night',
};

export const statusColor = {
  empty: '#3a4650',
  partial: '#3a4650',
  ok: '#3fbf7f',
  warning: '#e8a93c',
  breach: '#e1543d',
} as const;

export const statusLabel = {
  empty: 'Unstaffed',
  partial: 'Understaffed',
  ok: 'Compliant',
  warning: 'Fatigue warning',
  breach: 'Breach',
} as const;
