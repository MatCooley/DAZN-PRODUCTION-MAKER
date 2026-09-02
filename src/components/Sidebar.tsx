import { useMemo, useState } from 'react';
import type { Employee, SkillCode } from '../lib/types';
import { allSkillCodes, skillLabel } from '../lib/visuals';
import { EmployeeChip } from './EmployeeChip';

export function Sidebar({
  employees,
  assignedCounts,
  onEditEmployee,
}: {
  employees: Employee[];
  assignedCounts: Record<string, number>;
  onEditEmployee?: (employee: Employee) => void;
}) {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<SkillCode | 'ALL'>('ALL');
  // Managers only ever work their own team's roster (like the PDF Rach
  // sends her team), so default to the single team present rather than
  // an unscoped "All teams" view — "All teams" stays available for once
  // more than one manager's staff live in the same roster.
  const [managerTeamFilter, setManagerTeamFilter] = useState<string>(() => {
    const teams = Array.from(new Set(employees.map((e) => e.team)));
    return teams.length === 1 ? teams[0] : 'ALL';
  });

  const managerTeams = useMemo(
    () => Array.from(new Set(employees.map((e) => e.team))).sort(),
    [employees],
  );

  const gradeGroups = useMemo(() => {
    const byGrade = new Map<string, Employee[]>();
    for (const emp of employees) {
      if (query && !emp.name.toLowerCase().includes(query.toLowerCase())) continue;
      if (roleFilter !== 'ALL' && !emp.skills.includes(roleFilter)) continue;
      if (managerTeamFilter !== 'ALL' && emp.team !== managerTeamFilter) continue;
      const list = byGrade.get(emp.grade) ?? [];
      list.push(emp);
      byGrade.set(emp.grade, list);
    }
    const order = ['Permanent', 'Freelance'];
    return order.filter((grade) => byGrade.has(grade)).map((grade) => [grade, byGrade.get(grade)!] as const);
  }, [employees, query, roleFilter, managerTeamFilter]);

  return (
    <aside className="flex h-full w-[248px] shrink-0 flex-col border-r border-[var(--line)] bg-[var(--panel)]/60">
      <div className="border-b border-[var(--line)] p-3">
        <h2 className="font-display text-[15px] font-semibold uppercase tracking-wide text-[var(--text-primary)]">
          Operators
        </h2>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by name…"
          className="mt-2 w-full rounded-md border border-[var(--line)] bg-[var(--ink)] px-2.5 py-1.5 text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--tally)]"
        />
        <select
          value={managerTeamFilter}
          onChange={(e) => setManagerTeamFilter(e.target.value)}
          className="mt-1.5 w-full rounded-md border border-[var(--line)] bg-[var(--ink)] px-2.5 py-1.5 text-[12px] text-[var(--text-primary)] focus:border-[var(--tally)]"
        >
          <option value="ALL">All teams</option>
          {managerTeams.map((team) => (
            <option key={team} value={team}>
              {team}
            </option>
          ))}
        </select>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as SkillCode | 'ALL')}
          className="mt-1.5 w-full rounded-md border border-[var(--line)] bg-[var(--ink)] px-2.5 py-1.5 text-[12px] text-[var(--text-primary)] focus:border-[var(--tally)]"
        >
          <option value="ALL">All roles</option>
          {allSkillCodes.map((skill) => (
            <option key={skill} value={skill}>
              {skillLabel[skill]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto p-3">
        {gradeGroups.map(([grade, list]) => (
          <div key={grade}>
            <h3 className="mb-2 font-display text-[11px] font-semibold uppercase tracking-wide text-[var(--text-primary)]">
              {grade}
            </h3>
            <div className="space-y-1.5">
              {list.map((emp) => (
                <EmployeeChip
                  key={emp.id}
                  employee={emp}
                  dimmed={(assignedCounts[emp.id] ?? 0) > 0 && false}
                  onEdit={onEditEmployee}
                />
              ))}
            </div>
          </div>
        ))}
        {gradeGroups.length === 0 && (
          <p className="text-[12px] text-[var(--text-muted)]">No operators match the current filters.</p>
        )}
      </div>
      <div className="border-t border-[var(--line)] p-3 text-[10.5px] leading-snug text-[var(--text-muted)]">
        Drag an operator onto an open slot in the roster. Click the{' '}
        <span className="font-mono text-[var(--text-primary)]">×</span> on an assigned chip to remove them.
      </div>
    </aside>
  );
}
