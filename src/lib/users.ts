import type { SimUser } from './facilityTypes';

export const simUsers: SimUser[] = [
  { id: 'u-sam', name: 'Sam Supervisor', accessLevel: 'EDIT' },
  { id: 'u-ned', name: 'Ned NoteOnly', accessLevel: 'NOTE_ONLY' },
  { id: 'u-sue', name: 'Sue Superuser', accessLevel: 'SUPERUSER' },
];

export const accessLevelLabel: Record<string, string> = {
  READ_ONLY: 'Read only',
  NOTE_ONLY: 'Note only',
  EDIT: 'Edit',
  SUPERUSER: 'Superuser',
};

export function canEditDirectly(accessLevel: string): boolean {
  return accessLevel === 'EDIT' || accessLevel === 'SUPERUSER';
}
