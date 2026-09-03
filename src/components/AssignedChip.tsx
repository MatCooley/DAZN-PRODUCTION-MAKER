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
      className="group relative flex items-center gap-1.5 rounded-md py-[5px] pl-[5px] pr-2 md:py-1 md:pl-1 md:pr-1.5"
      style={{
        backgroundColor: 'var(--panel-raised)',
        boxShadow: worst === 'ok' ? 'none' : `0 0 0 1.5px ${ring}`,
      }}
      title={flags.map((f) => f.label).join(' • ')}
    >
      {employee.photo ? (
        <img src={employee.photo} alt={employee.name} className="h-[22px] w-[22px] shrink-0 rounded-full object-cover md:h-5 md:w-5" />
      ) : (
        <span
          className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full font-mono text-[9.5px] font-semibold text-[var(--ink)] md:h-5 md:w-5 md:text-[9px]"
          style={{ backgroundColor: color }}
        >
          {employee.initials}
        </span>
      )}
      <span className="truncate text-[12px] leading-none text-[var(--text-primary)] md:text-[11px]">
        {employee.name.split(' ')[0]}
      </span>
      <button
        onClick={onRemove}
        className="ml-0.5 shrink-0 rounded p-0.5 text-[var(--text-muted)] opacity-100 transition hover:bg-black/30 hover:text-[var(--signal-red)] md:opacity-0 md:group-hover:opacity-100"
        aria-label={`Remove ${employee.name}`}
      >
        <X size={10} />
      </button>
    </div>
  );
}
