import { slotOrder } from '../lib/data';
import type { Assignments, ComplianceFlag, Employee, Shift } from '../lib/types';
import type { ComplianceResult } from '../lib/compliance';
import { ShiftCard } from './ShiftCard';

export function Board({
  days,
  shifts,
  assignments,
  employeesById,
  compliance,
  onRemove,
}: {
  days: { date: string; label: string }[];
  shifts: Shift[];
  assignments: Assignments;
  employeesById: Map<string, Employee>;
  compliance: ComplianceResult;
  onRemove: (shiftId: string, skill: string, employeeId: string) => void;
}) {
  return (
    <div className="grid flex-1 grid-cols-7 gap-2.5 p-3">
      {days.map((day) => {
        const dayShifts = shifts
          .filter((s) => s.day === day.date)
          .sort((a, b) => slotOrder[a.slot] - slotOrder[b.slot]);

        return (
          <div key={day.date} className="flex min-w-[190px] flex-col gap-2.5">
            <div className="sticky top-0 z-10 flex items-baseline justify-between bg-[var(--ink)] px-0.5 py-1.5">
              <span className="font-display text-[13px] font-semibold uppercase tracking-wide text-[var(--text-primary)]">
                {day.label}
              </span>
              <span className="font-mono text-[10px] text-[var(--text-muted)]">{day.date.slice(8)}</span>
            </div>
            {dayShifts.map((shift) => (
              <ShiftCard
                key={shift.id}
                shift={shift}
                status={compliance.shiftStatus[shift.id] ?? 'empty'}
                fill={compliance.shiftFillSummary[shift.id] ?? { filled: 0, required: 0 }}
                assignments={assignments}
                employeesById={employeesById}
                flagsForShift={compliance.assignmentFlags[shift.id] ?? {}}
                onRemove={(skill: string, empId: string) => onRemove(shift.id, skill, empId)}
              />
            ))}
            {dayShifts.length === 0 && (
              <div className="rounded-lg border border-dashed border-[var(--line)] p-3 text-center font-mono text-[10px] text-[var(--text-muted)]">
                no shifts
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// re-export for flag typing convenience
export type { ComplianceFlag };
