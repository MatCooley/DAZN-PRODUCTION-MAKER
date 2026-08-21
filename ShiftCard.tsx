import type { Assignments, ComplianceFlag, Employee, Shift } from '../lib/types';
import type { ShiftStatus } from '../lib/compliance';
import { slotLabel, statusColor, statusLabel } from '../lib/visuals';
import { RequirementRow } from './RequirementRow';

export function ShiftCard({
  shift,
  status,
  fill,
  assignments,
  employeesById,
  flagsForShift,
  onRemove,
}: {
  shift: Shift;
  status: ShiftStatus;
  fill: { filled: number; required: number };
  assignments: Assignments;
  employeesById: Map<string, Employee>;
  flagsForShift: Record<string, ComplianceFlag[]>;
  onRemove: (skill: string, employeeId: string) => void;
}) {
  const edgeColor = statusColor[status];

  return (
    <div
      className="flex overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--panel)]"
      title={statusLabel[status]}
    >
      <div className="w-[3px] shrink-0" style={{ backgroundColor: edgeColor }} />
      <div className="flex-1 p-2.5">
        <div className="mb-1.5 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-display text-[13px] font-semibold uppercase tracking-wide text-[var(--text-primary)]">
                {slotLabel[shift.slot]}
              </span>
              <span className="font-mono text-[10px] text-[var(--text-muted)]">
                {shift.start}–{shift.end}
              </span>
            </div>
            <div className="truncate text-[11px] text-[var(--text-muted)]">{shift.production}</div>
          </div>
          <div
            className="shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[9.5px] font-medium"
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
              assignedEmployees={(assignments[shift.id]?.[req.skill] ?? [])
                .map((id) => employeesById.get(id))
                .filter((e): e is Employee => !!e)}
              flagsByEmployee={flagsForShift}
              onRemove={(empId) => onRemove(req.skill, empId)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
