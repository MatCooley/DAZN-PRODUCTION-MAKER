import type { ShiftSlot, SkillCode } from './types';

export const skillLabel: Record<SkillCode, string> = {
  TX: 'TX Operator',
  VISION: 'Vision',
  AUDIO: 'Audio',
  EVS: 'EVS / Replay',
  GFX: 'Graphics',
  MCR: 'MCR',
};

export const skillColor: Record<SkillCode, string> = {
  TX: '#35c1d6',
  VISION: '#8b7ce8',
  AUDIO: '#e8a93c',
  EVS: '#3fbf7f',
  GFX: '#e1543d',
  MCR: '#7fa8e0',
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
