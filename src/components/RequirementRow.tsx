import { useDroppable } from '@dnd-kit/core';
import type { ComplianceFlag, Employee, ShiftRequirement } from '../lib/types';
import { skillColor, skillLabel } from '../lib/visuals';
import { AssignedChip } from './AssignedChip';

export function RequirementRow({
  shiftId,
  requirement,
  assignedEmployees,
  flagsByEmployee,
  onRemove,
}: {
  shiftId: string;
  requirement: ShiftRequirement;
  assignedEmployees: Employee[];
  flagsByEmployee: Record<string, ComplianceFlag[]>;
  onRemove: (employeeId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot:${shiftId}:${requirement.skill}`,
    data: { shiftId, skill: requirement.skill },
  });

  const openSlots = Math.max(0, requirement.count - assignedEmployees.length);
  const color = skillColor[requirement.skill];

  return (
    <div
      ref={setNodeRef}
      className={`rounded-md border p-1.5 transition ${
        isOver ? 'border-[var(--tally)] bg-[var(--tally)]/5' : 'border-transparent'
      }`}
    >
      <div className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-[var(--text-muted)] md:text-[9.5px]">
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
        {skillLabel[requirement.skill]}
        <span className="text-[var(--text-muted)]/70">G{requirement.minGrade}+</span>
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
