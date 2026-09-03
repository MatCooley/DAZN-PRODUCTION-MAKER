import { buildRosterTable, formatShiftTime } from '../lib/rosterTable';
import { skillColor, skillLabel } from '../lib/visuals';
import type { Assignments, Employee, Shift } from '../lib/types';

export function RosterTable({
  days,
  employees,
  shifts,
  assignments,
}: {
  days: { date: string; label: string }[];
  employees: Employee[];
  shifts: Shift[];
  assignments: Assignments;
}) {
  const table = buildRosterTable(employees, shifts, assignments);

  return (
    <div className="h-full overflow-auto py-3">
      {/* No horizontal padding — the Studio board's scroll container above
          has none either, so the 200px label column and day columns line
          up between the two panels in Half/Half view. */}
      <table className="w-full min-w-[900px] table-fixed border-separate border-spacing-0">
        <thead>
          <tr>
            {/* Fixed at 200px to line up with the Studio board's own
                sticky label column directly above it in Half/Half view. */}
            <th className="sticky left-0 top-0 z-10 w-[200px] border-b border-r border-[var(--line)] bg-[var(--panel)] p-2 text-left font-display text-[11px] font-semibold uppercase tracking-wide text-[var(--text-primary)]">
              Staff
            </th>
            {days.map((day) => (
              <th
                key={day.date}
                className="sticky top-0 z-0 border-b border-r border-[var(--line)] bg-[var(--panel)] p-2 text-left font-display text-[11px] font-semibold uppercase tracking-wide text-[var(--text-primary)]"
              >
                {day.label} <span className="font-mono text-[10px] font-normal text-[var(--text-muted)]">{day.date.slice(8)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => {
            const byDay = table.get(emp.id);
            return (
              <tr key={emp.id}>
                <td className="sticky left-0 z-10 border-b border-r border-[var(--line)] bg-[var(--panel)]/95 p-2 align-top">
                  <div className="flex items-center gap-2">
                    {emp.photo ? (
                      <img src={emp.photo} alt={emp.name} className="h-6 w-6 shrink-0 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--tally)] font-mono text-[9.5px] font-semibold text-[var(--ink)]">
                        {emp.initials}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-medium leading-tight text-[var(--text-primary)]">
                        {emp.name}
                      </span>
                      <span className="block truncate font-mono text-[9.5px] leading-tight text-[var(--text-muted)]">
                        {emp.grade}
                      </span>
                    </span>
                  </div>
                </td>
                {days.map((day) => {
                  const entries = byDay?.get(day.date) ?? [];
                  return (
                    <td key={day.date} className="border-b border-r border-[var(--line)] p-1.5 align-top">
                      {entries.length === 0 ? (
                        <div className="h-full min-h-[28px]" />
                      ) : (
                        <div className="space-y-1">
                          {entries.map((entry, i) => (
                            <div
                              key={`${entry.shiftId}-${entry.skill}-${i}`}
                              className="rounded border-l-2 bg-[var(--panel-raised)]/60 px-1.5 py-1"
                              style={{ borderColor: skillColor[entry.skill] }}
                            >
                              <div className="font-mono text-[12px] font-bold leading-tight text-[var(--text-primary)]">
                                {formatShiftTime(entry.start, entry.end)}
                              </div>
                              <div className="text-[10.5px] font-medium leading-tight text-[var(--text-muted)]">
                                Shift-{skillLabel[entry.skill]} {entry.production}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {employees.length === 0 && (
            <tr>
              <td colSpan={days.length + 1} className="p-4 text-center text-[12px] text-[var(--text-muted)]">
                No staff match the current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
