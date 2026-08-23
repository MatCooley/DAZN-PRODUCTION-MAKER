import { ShieldCheck, Pencil, MessageSquare } from 'lucide-react';
import type { SimUser } from '../../lib/facilityTypes';
import { simUsers } from '../../lib/users';

const icon = {
  EDIT: Pencil,
  SUPERUSER: ShieldCheck,
  NOTE_ONLY: MessageSquare,
  READ_ONLY: MessageSquare,
} as const;

export function RoleSwitcher({ currentUser, onChange }: { currentUser: SimUser; onChange: (u: SimUser) => void }) {
  const Icon = icon[currentUser.accessLevel];
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={13} className="text-[var(--tally)]" />
      <select
        value={currentUser.id}
        onChange={(e) => {
          const u = simUsers.find((u) => u.id === e.target.value);
          if (u) onChange(u);
        }}
        className="cursor-pointer rounded-md border border-[var(--line)] bg-[var(--ink)] px-2 py-1 font-mono text-[10.5px] text-[var(--text-primary)] focus:border-[var(--tally)]"
      >
        {simUsers.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} · {u.accessLevel}
          </option>
        ))}
      </select>
    </div>
  );
}
