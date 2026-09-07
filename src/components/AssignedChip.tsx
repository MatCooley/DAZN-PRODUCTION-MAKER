import { useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { ComplianceFlag, Employee, Shift, SkillCode } from '../lib/types';
import type { CrewStat } from '../lib/compliance';
import { formatHM } from '../lib/format';
import { skillColor, skillLabel, statusColor } from '../lib/visuals';
import { Hovercard, type HovercardRow } from './Hovercard';

const HOVER_DELAY_MS = 140;
const BAND_WORD: Record<CrewStat['weekBand'], string> = { std: 'on target', extra: 'running long', over: 'over cap' };

export function AssignedChip({
  employee,
  flags,
  skill,
  shift,
  stat,
  onRemove,
}: {
  employee: Employee;
  flags: ComplianceFlag[];
  skill: SkillCode;
  shift: Shift;
  stat?: CrewStat;
  onRemove: () => void;
}) {
  const worst = flags.reduce<ComplianceFlag['severity']>((acc, f) => {
    if (f.severity === 'breach') return 'breach';
    if (f.severity === 'warning' && acc !== 'breach') return 'warning';
    return acc;
  }, 'ok');

  const color = skillColor[employee.primarySkill];
  const ring = worst === 'ok' ? 'transparent' : statusColor[worst];

  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleMouseEnter(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setHoverRect(rect), HOVER_DELAY_MS);
  }
  function handleMouseLeave() {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
    setHoverRect(null);
  }

  const hoverRows: HovercardRow[] = [
    { key: 'Role', value: `${skillLabel[skill]} · ${employee.team}` },
    { key: 'Call', value: `${shift.day} ${shift.start}` },
    { key: 'On air', value: `${shift.production} · ${shift.start}–${shift.end}` },
    ...(stat
      ? [
          {
            key: 'This week',
            value: `${formatHM(stat.hoursThisWeek)}${stat.isFullTime ? ' of 38h' : ''} · ${BAND_WORD[stat.weekBand]}`,
          },
        ]
      : []),
    ...(employee.phone ? [{ key: 'Phone', value: employee.phone }] : []),
    ...(employee.email ? [{ key: 'Email', value: employee.email }] : []),
  ];

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-hovercard-chip
      className="group relative flex items-center gap-1.5 rounded-md py-[5px] pl-[5px] pr-2 md:py-1 md:pl-1 md:pr-1.5"
      style={{
        backgroundColor: 'var(--panel-raised)',
        boxShadow: worst === 'ok' ? 'none' : `0 0 0 1.5px ${ring}`,
      }}
    >
      {hoverRect && (
        <Hovercard
          anchorRect={hoverRect}
          accentColor={color}
          title={employee.name}
          subtitle={employee.grade}
          rows={hoverRows}
          warning={flags.length > 0 ? flags.map((f) => f.label).join(' · ') : undefined}
        />
      )}
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
