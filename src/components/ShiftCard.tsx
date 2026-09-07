import { useRef, useState } from 'react';
import type { Assignments, ComplianceFlag, Employee, Shift } from '../lib/types';
import type { CrewStat, DropVerdict, ShiftStatus } from '../lib/compliance';
import { formatHM } from '../lib/format';
import { skillLabel, slotLabel, statusColor, statusLabel } from '../lib/visuals';
import { Hovercard, type HovercardRow } from './Hovercard';
import { RequirementRow } from './RequirementRow';

const HOVER_DELAY_MS = 140;

export function ShiftCard({
  shift,
  status,
  fill,
  assignments,
  employeesById,
  flagsForShift,
  crewStats,
  onRemove,
  getDropVerdict,
}: {
  shift: Shift;
  status: ShiftStatus;
  fill: { filled: number; required: number };
  assignments: Assignments;
  employeesById: Map<string, Employee>;
  flagsForShift: Record<string, ComplianceFlag[]>;
  crewStats: Record<string, CrewStat>;
  onRemove: (skill: string, employeeId: string) => void;
  getDropVerdict: (skill: string) => DropVerdict | null;
}) {
  const edgeColor = statusColor[status];
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleMouseEnter(e: React.MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('[data-hovercard-chip]')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setHoverRect(rect), HOVER_DELAY_MS);
  }
  function handleMouseLeave() {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
    setHoverRect(null);
  }
  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('[data-hovercard-chip]')) {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
      setHoverRect(null);
    }
  }

  const durationHours = (() => {
    const [sh, sm] = shift.start.split(':').map(Number);
    const [eh, em] = shift.end.split(':').map(Number);
    let h = eh + em / 60 - (sh + sm / 60);
    if (h <= 0) h += 24;
    return h;
  })();

  const hoverRows: HovercardRow[] = [
    { key: 'When', value: `${shift.day} · ${shift.start}–${shift.end} · ${formatHM(durationHours)}` },
    { key: 'Fill', value: `${fill.filled} of ${fill.required} filled${fill.filled < fill.required ? ` · ${fill.required - fill.filled} open` : ''}` },
    {
      key: 'Roles',
      value: shift.requirements
        .map((r) => `${skillLabel[r.skill]} ${(assignments[shift.id]?.[r.skill] ?? []).length}/${r.count}`)
        .join(', '),
    },
  ];

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative flex overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--panel)]"
    >
      {hoverRect && (
        <Hovercard
          anchorRect={hoverRect}
          accentColor={edgeColor}
          title={shift.production}
          subtitle={statusLabel[status]}
          rows={hoverRows}
        />
      )}
      <div className="w-[3px] shrink-0" style={{ backgroundColor: edgeColor }} />
      <div className="flex-1 p-3 md:p-2.5">
        <div className="mb-1.5 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-display text-[14px] font-semibold uppercase tracking-wide text-[var(--text-primary)] md:text-[13px]">
                {slotLabel[shift.slot]}
              </span>
              <span
                className="whitespace-nowrap font-mono text-[12px] font-bold md:text-[10.5px]"
                style={{ color: shift.slot === 'EARLY' ? 'var(--signal-amber)' : 'var(--text-primary)' }}
              >
                {shift.start}–{shift.end}
              </span>
            </div>
            <div className="truncate text-[12px] text-[var(--text-muted)] md:text-[11px]">{shift.production}</div>
          </div>
          <div
            className="shrink-0 rounded-full px-2 py-1 font-mono text-[10px] font-medium md:px-1.5 md:py-0.5 md:text-[9.5px]"
            style={{ color: edgeColor, backgroundColor: `${edgeColor}1a` }}
          >
            {fill.filled}/{fill.required}
          </div>
        </div>

        <div className="space-y-1">
          {shift.requirements.map((req) => (
            <RequirementRow
              key={req.skill}
              shiftId={shift.id}
              requirement={req}
              shift={shift}
              crewStats={crewStats}
              assignedEmployees={(assignments[shift.id]?.[req.skill] ?? [])
                .map((id) => employeesById.get(id))
                .filter((e): e is Employee => !!e)}
              flagsByEmployee={flagsForShift}
              onRemove={(empId) => onRemove(req.skill, empId)}
              getDropVerdict={() => getDropVerdict(req.skill)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
