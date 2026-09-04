import { useDroppable } from '@dnd-kit/core';
import type { ComplianceFlag, Employee, ShiftRequirement } from '../lib/types';
import type { DropVerdict } from '../lib/compliance';
import { skillColor, skillLabel } from '../lib/visuals';
import { AssignedChip } from './AssignedChip';

const VERDICT_STYLE: Record<DropVerdict, string> = {
  ok: 'border-[var(--tally)] bg-[var(--tally)]/5',
  tight: 'border-[var(--signal-amber)] bg-[var(--signal-amber)]/10',
  busy: 'border-[var(--signal-red)] bg-[var(--signal-red)]/10',
  invalid: 'border-[var(--signal-red)] bg-[var(--signal-red)]/10 opacity-60',
  full: 'border-[var(--text-muted)] bg-[var(--text-muted)]/10',
  duplicate: 'border-[var(--text-muted)] bg-[var(--text-muted)]/10',
};

const VERDICT_LABEL: Record<DropVerdict, string> = {
  ok: 'Drop to assign',
  tight: 'Under turnaround minimum',
  busy: 'Double-booked at this time',
  invalid: 'Not signed off on this role',
  full: 'Slot already full',
  duplicate: 'Already on this shift',
};

export function RequirementRow({
  shiftId,
  requirement,
  assignedEmployees,
  flagsByEmployee,
  onRemove,
  getDropVerdict,
}: {
  shiftId: string;
  requirement: ShiftRequirement;
  assignedEmployees: Employee[];
  flagsByEmployee: Record<string, ComplianceFlag[]>;
  onRemove: (employeeId: string) => void;
  getDropVerdict: () => DropVerdict | null;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot:${shiftId}:${requirement.skill}`,
    data: { shiftId, skill: requirement.skill },
  });

  const verdict = isOver ? getDropVerdict() : null;
  const openSlots = Math.max(0, requirement.count - assignedEmployees.length);
  const color = skillColor[requirement.skill];

  return (
    <div
      ref={setNodeRef}
      className={`rounded-md border p-1.5 transition ${
        verdict ? VERDICT_STYLE[verdict] : isOver ? 'border-[var(--tally)] bg-[var(--tally)]/5' : 'border-transparent'
      }`}
    >
      <div className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-[var(--text-muted)] md:text-[9.5px]">
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
        {skillLabel[requirement.skill]}
        <span className="text-[var(--text-muted)]/70">G{requirement.minGrade}+</span>
        {verdict && <span className="ml-auto normal-case tracking-normal text-[var(--text-primary)]">{VERDICT_LABEL[verdict]}</span>}
      </div>
      <div className="flex flex-wrap gap-1">
        {assignedEmployees.map((emp) => (
          <AssignedChip
            key={emp.id}
            employee={emp}
            flags={flagsByEmployee[emp.id] ?? []}
            onRemove={() => onRemove(emp.id)}
          />
        ))}
        {Array.from({ length: openSlots }).map((_, i) => (
          <div
            key={i}
            className="flex h-[28px] min-w-[64px] items-center justify-center rounded-md border border-dashed border-[var(--line)] px-2 font-mono text-[10px] text-[var(--text-muted)] md:h-[26px] md:text-[9px]"
          >
            open
          </div>
        ))}
      </div>
    </div>
  );
}
