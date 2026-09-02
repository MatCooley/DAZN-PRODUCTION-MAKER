import { useDraggable } from '@dnd-kit/core';
import { Pencil } from 'lucide-react';
import type { Employee } from '../lib/types';

export function EmployeeChip({
  employee,
  dimmed,
  onEdit,
}: {
  employee: Employee;
  dimmed?: boolean;
  onEdit?: (employee: Employee) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `emp:${employee.id}`,
    data: { employeeId: employee.id },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`group flex w-full items-center gap-2.5 rounded-md border px-2.5 py-2 text-left transition
        ${isDragging ? 'opacity-30' : 'opacity-100'}
        ${dimmed ? 'border-transparent opacity-40' : 'border-[var(--line)] hover:border-[var(--tally)]/60 hover:bg-[var(--panel-raised)]'}
        cursor-grab active:cursor-grabbing bg-[var(--panel)]`}
    >
      {employee.photo ? (
        <img
          src={employee.photo}
          alt={employee.name}
          className="h-7 w-7 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--tally)] font-mono text-[11px] font-semibold text-[var(--ink)]">
          {employee.initials}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium leading-tight text-[var(--text-primary)]">
          {employee.name}
        </span>
        <span className="block truncate font-mono text-[10px] leading-tight text-[var(--text-muted)]">
          {employee.grade}
        </span>
      </span>
      {onEdit && (
        <button
          type="button"
          aria-label={`Edit ${employee.name}`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onEdit(employee);
          }}
          className="shrink-0 rounded p-1 text-[var(--text-muted)] opacity-0 transition hover:text-[var(--text-primary)] group-hover:opacity-100"
        >
          <Pencil size={13} />
        </button>
      )}
    </div>
  );
}
