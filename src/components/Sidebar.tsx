import { useMemo, useState } from 'react';
import type { Employee, SkillCode } from '../lib/types';
import { skillColor, skillLabel } from '../lib/visuals';
import { EmployeeChip } from './EmployeeChip';

export function Sidebar({ employees, assignedCounts }: { employees: Employee[]; assignedCounts: Record<string, number> }) {
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const bySkill = new Map<SkillCode, Employee[]>();
    for (const emp of employees) {
      if (query && !emp.name.toLowerCase().includes(query.toLowerCase())) continue;
      const list = bySkill.get(emp.primarySkill) ?? [];
      list.push(emp);
      bySkill.set(emp.primarySkill, list);
    }
    return Array.from(bySkill.entries());
  }, [employees, query]);

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
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        {groups.map(([skill, list]) => (
          <div key={skill}>
            <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: skillColor[skill] }} />
              {skillLabel[skill]}
            </div>
            <div className="space-y-1.5">
              {list.map((emp) => (
                <EmployeeChip key={emp.id} employee={emp} dimmed={(assignedCounts[emp.id] ?? 0) > 0 && false} />
              ))}
            </div>
          </div>
        ))}
        {groups.length === 0 && (
          <p className="text-[12px] text-[var(--text-muted)]">No operators match "{query}".</p>
        )}
      </div>
      <div className="border-t border-[var(--line)] p-3 text-[10.5px] leading-snug text-[var(--text-muted)]">
        Drag an operator onto an open slot in the roster. Click the{' '}
        <span className="font-mono text-[var(--text-primary)]">×</span> on an assigned chip to remove them.
      </div>
    </aside>
  );
}
