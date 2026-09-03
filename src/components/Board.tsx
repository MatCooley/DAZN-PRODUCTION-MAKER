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
    // No gap/padding between columns — borders do the separating instead —
    // so the columns divide the width identically to the Studio board's
    // own day columns directly above it in Half/Half view. Tracks are
    // minmax(190px, 1fr): they grow to fill available space like the
    // Studio board's, but never shrink below 190px — below that the grid
    // overflows its container and the outer wrapper scrolls horizontally,
    // instead of a plain 1fr track shrinking a min-w'd child until it
    // overflows into the next column and the two headers overlap.
    <div className="grid flex-1 grid-cols-[repeat(7,minmax(190px,1fr))]">
      {days.map((day) => {
        const dayShifts = shifts
          .filter((s) => s.day === day.date)
          .sort((a, b) => slotOrder[a.slot] - slotOrder[b.slot]);

        return (
          <div key={day.date} className="flex flex-col gap-2.5 border-r border-[var(--line)] p-3">
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
