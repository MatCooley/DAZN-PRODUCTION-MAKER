import { useDraggable } from '@dnd-kit/core';
import type { Employee } from '../lib/types';
import { skillColor } from '../lib/visuals';

export function EmployeeChip({ employee, dimmed }: { employee: Employee; dimmed?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `emp:${employee.id}`,
    data: { employeeId: employee.id },
  });

  const color = skillColor[employee.primarySkill];

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`group flex w-full items-center gap-2.5 rounded-md border px-2.5 py-2 text-left transition
        ${isDragging ? 'opacity-30' : 'opacity-100'}
        ${dimmed ? 'border-transparent opacity-40' : 'border-[var(--line)] hover:border-[var(--tally)]/60 hover:bg-[var(--panel-raised)]'}
        cursor-grab active:cursor-grabbing bg-[var(--panel)]`}
    >
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold text-[var(--ink)]"
        style={{ backgroundColor: color }}
      >
        {employee.initials}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium leading-tight text-[var(--text-primary)]">
          {employee.name}
        </span>
        <span className="block truncate font-mono text-[10px] leading-tight text-[var(--text-muted)]">
          {employee.grade}
        </span>
      </span>
    </button>
  );
}
