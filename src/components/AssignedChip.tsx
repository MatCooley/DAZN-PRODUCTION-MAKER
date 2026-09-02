import { X } from 'lucide-react';
import type { ComplianceFlag, Employee } from '../lib/types';
import { skillColor, statusColor } from '../lib/visuals';

export function AssignedChip({
  employee,
  flags,
  onRemove,
}: {
  employee: Employee;
  flags: ComplianceFlag[];
  onRemove: () => void;
}) {
  const worst = flags.reduce<ComplianceFlag['severity']>((acc, f) => {
    if (f.severity === 'breach') return 'breach';
    if (f.severity === 'warning' && acc !== 'breach') return 'warning';
    return acc;
  }, 'ok');

  const color = skillColor[employee.primarySkill];
  const ring = worst === 'ok' ? 'transparent' : statusColor[worst];

  return (
    <div
      className="group relative flex items-center gap-1.5 rounded-md py-1 pl-1 pr-1.5"
      style={{
        backgroundColor: 'var(--panel-raised)',
        boxShadow: worst === 'ok' ? 'none' : `0 0 0 1.5px ${ring}`,
      }}
      title={flags.map((f) => f.label).join(' • ')}
    >
      {employee.photo ? (
        <img src={employee.photo} alt={employee.name} className="h-5 w-5 shrink-0 rounded-full object-cover" />
      ) : (
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[9px] font-semibold text-[var(--ink)]"
          style={{ backgroundColor: color }}
        >
          {employee.initials}
        </span>
      )}
      <span className="truncate text-[11px] leading-none text-[var(--text-primary)]">
        {employee.name.split(' ')[0]}
      </span>
      <button
        onClick={onRemove}
        className="ml-0.5 shrink-0 rounded p-0.5 text-[var(--text-muted)] opacity-0 transition hover:bg-black/30 hover:text-[var(--signal-red)] group-hover:opacity-100"
        aria-label={`Remove ${employee.name}`}
      >
        <X size={10} />
      </button>
    </div>
  );
}
