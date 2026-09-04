import { useMemo, useState } from 'react';
import { AlertTriangle, Pencil, Plus, X } from 'lucide-react';
import type { Assignments, DayOff, Employee, Shift, SkillCode } from '../lib/types';
import { FULLTIME_WEEK_STD_HOURS, type CrewStat } from '../lib/compliance';
import { skillColor, skillLabel, statusColor } from '../lib/visuals';
import { CrewTimeline } from './CrewTimeline';
import { CrewMemberDetail } from './CrewMemberDetail';

export function CrewPanel({
  employees,
  shifts,
  assignments,
  crewStats,
  rosterDays,
  daysOff,
  onToggleDayOff,
  onClose,
  onEditEmployee,
  onAddEmployee,
  onUpdateEmployee,
  onRemoveEmployee,
}: {
  employees: Employee[];
  shifts: Shift[];
  assignments: Assignments;
  crewStats: Record<string, CrewStat>;
  rosterDays: { date: string; label: string }[];
  daysOff: DayOff[];
  onToggleDayOff: (employeeId: string, date: string) => void;
  onClose: () => void;
  onEditEmployee: (employee: Employee) => void;
  onAddEmployee: () => void;
  onUpdateEmployee: (updated: Employee) => void;
  onRemoveEmployee: (employeeId: string) => void;
}) {
  const [tab, setTab] = useState<'directory' | 'timeline'>('directory');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'Permanent' | 'Freelance'>('ALL');

  const teams = useMemo(() => Array.from(new Set(employees.map((e) => e.team))).filter(Boolean).sort(), [employees]);

  const daysOffByEmployee = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const off of daysOff) {
      const set = map.get(off.employeeId) ?? new Set<string>();
      set.add(off.date);
      map.set(off.employeeId, set);
    }
    return map;
  }, [daysOff]);

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      if (query && !e.name.toLowerCase().includes(query.toLowerCase())) return false;
      if (teamFilter !== 'ALL' && e.team !== teamFilter) return false;
      if (typeFilter !== 'ALL' && e.grade !== typeFilter) return false;
      return true;
    });
  }, [employees, query, teamFilter, typeFilter]);

  const fullTimeCount = employees.filter((e) => e.grade === 'Permanent').length;
  const freelanceCount = employees.filter((e) => e.grade === 'Freelance').length;
  const hoursRosteredThisWeek = Object.values(crewStats).reduce((t, s) => t + s.hoursThisWeek, 0);
  const overStandardCount = Object.values(crewStats).filter((s) => s.isFullTime && s.hoursThisWeek > FULLTIME_WEEK_STD_HOURS).length;
  const selectedEmployee = selectedEmployeeId ? employees.find((e) => e.id === selectedEmployeeId) : undefined;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--ink)]">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
        <div className="flex items-baseline gap-3">
          <div className="flex items-baseline gap-2">
            <h2 className="font-display text-[20px] font-semibold uppercase tracking-wide text-[var(--text-primary)]">Crew</h2>
            <span className="font-mono text-[12px] text-[var(--text-muted)]">{employees.length} people</span>
          </div>
          {!selectedEmployee && (
            <div className="flex items-center gap-0.5 rounded-md border border-[var(--line)] bg-[var(--ink)] p-0.5">
              <TabButton label="Directory" active={tab === 'directory'} onClick={() => setTab('directory')} />
              <TabButton label="Timeline" active={tab === 'timeline'} onClick={() => setTab('timeline')} />
            </div>
          )}
        </div>
        <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]" aria-label="Close crew panel">
          <X size={20} />
        </button>
      </div>

      {selectedEmployee ? (
        <CrewMemberDetail
          employee={selectedEmployee}
          shifts={shifts}
          assignments={assignments}
          crewStat={crewStats[selectedEmployee.id]}
          rosterDays={rosterDays}
          onBack={() => setSelectedEmployeeId(null)}
          onUpdate={onUpdateEmployee}
          onRemove={onRemoveEmployee}
        />
      ) : tab === 'timeline' ? (
        <CrewTimeline employees={employees} shifts={shifts} assignments={assignments} crewStats={crewStats} rosterDays={rosterDays} />
      ) : (
        <>
      <div className="flex items-center gap-2 border-b border-[var(--line)] px-5 py-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find crew…"
          className="w-56 rounded-md border border-[var(--line)] bg-[var(--panel)] px-2.5 py-1.5 text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--tally)]"
        />
        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="rounded-md border border-[var(--line)] bg-[var(--panel)] px-2.5 py-1.5 text-[12px] text-[var(--text-primary)] focus:border-[var(--tally)]"
        >
          <option value="ALL">All teams</option>
          {teams.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
          className="rounded-md border border-[var(--line)] bg-[var(--panel)] px-2.5 py-1.5 text-[12px] text-[var(--text-primary)] focus:border-[var(--tally)]"
        >
          <option value="ALL">All employment types</option>
          <option value="Permanent">Permanent</option>
          <option value="Freelance">Freelance</option>
        </select>
        <button
          onClick={onAddEmployee}
          className="ml-auto flex items-center gap-1.5 rounded-md bg-[var(--tally)] px-3 py-1.5 font-mono text-[10.5px] font-semibold text-[var(--ink)] transition hover:opacity-90"
        >
          <Plus size={13} /> Add crew member
        </button>
      </div>

      <div className="grid grid-cols-5 gap-3 border-b border-[var(--line)] px-5 py-3">
        <StatCard label="Crew total" value={String(employees.length)} />
        <StatCard label="Full-time" value={String(fullTimeCount)} />
        <StatCard label="Freelance" value={String(freelanceCount)} />
        <StatCard label="Rostered this week" value={`${Math.round(hoursRosteredThisWeek)}h`} />
        <StatCard
          label="Over standard hours"
          value={String(overStandardCount)}
          color={overStandardCount > 0 ? statusColor.warning : undefined}
        />
      </div>

      <div className="flex-1 overflow-auto px-5 py-3">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[var(--line)] text-left font-mono text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
              <th className="px-2 py-2 font-medium">Name</th>
              <th className="px-2 py-2 font-medium">Team</th>
              <th className="px-2 py-2 font-medium">Positions</th>
              <th className="px-2 py-2 font-medium">Type</th>
              <th className="px-2 py-2 font-medium">Hours</th>
              <th className="px-2 py-2 font-medium">Days off this week</th>
              <th className="px-2 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp) => {
              const stat = crewStats[emp.id];
              const markedOff = daysOffByEmployee.get(emp.id) ?? new Set<string>();
              const overStandard = !!stat?.isFullTime && stat.hoursThisWeek > FULLTIME_WEEK_STD_HOURS;
              return (
                <tr key={emp.id} className="border-b border-[var(--line)]/60 hover:bg-[var(--panel)]/40">
                  <td className="px-2 py-2.5">
                    <button
                      onClick={() => setSelectedEmployeeId(emp.id)}
                      className="font-medium text-[13px] text-[var(--text-primary)] hover:text-[var(--tally)] hover:underline"
                    >
                      {emp.name}
                    </button>
                  </td>
                  <td className="px-2 py-2.5 text-[11.5px] text-[var(--text-muted)]">{emp.team || '—'}</td>
                  <td className="px-2 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {emp.skills.map((skill: SkillCode) => (
                        <span
                          key={skill}
                          className="rounded px-1.5 py-0.5 font-mono text-[9.5px]"
                          style={{ color: skillColor[skill], backgroundColor: `${skillColor[skill]}1a` }}
                        >
                          {skillLabel[skill]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-2 py-2.5">
                    <span
                      className="rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold"
                      style={{
                        color: emp.grade === 'Permanent' ? 'var(--tally)' : 'var(--text-muted)',
                        backgroundColor: emp.grade === 'Permanent' ? '#f5ff001a' : 'transparent',
                      }}
                    >
                      {emp.grade}
                    </span>
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex items-center gap-1 font-mono text-[12px]" style={{ color: overStandard ? statusColor.warning : 'var(--text-primary)' }}>
                      {stat?.hoursThisWeek.toFixed(1) ?? '0.0'}h{stat?.isFullTime ? ` / ${FULLTIME_WEEK_STD_HOURS}h` : ''}
                      {overStandard && <AlertTriangle size={11} />}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[9.5px] text-[var(--text-muted)]">
                      {!!stat?.rdoOwed && (
                        <span className="rounded px-1 py-0.5" style={{ color: statusColor.breach, backgroundColor: `${statusColor.breach}1a` }}>
                          RDO {stat.rdoOwed} owed
                        </span>
                      )}
                      {!!stat?.rdoWorkedThisWeek && (
                        <span className="rounded px-1 py-0.5" style={{ color: statusColor.warning, backgroundColor: `${statusColor.warning}1a` }}>
                          worked {stat.rdoWorkedThisWeek}× on day off
                        </span>
                      )}
                      {!!stat?.otSeasonHours && <span>{stat.otSeasonHours.toFixed(1)}h OT this season</span>}
                    </div>
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex gap-1">
                      {rosterDays.map((day) => {
                        const off = markedOff.has(day.date);
                        return (
                          <button
                            key={day.date}
                            onClick={() => onToggleDayOff(emp.id, day.date)}
                            title={`${off ? 'Unmark' : 'Mark'} ${day.label} as a day off for ${emp.name.split(' ')[0]}`}
                            className="flex h-6 w-6 items-center justify-center rounded font-mono text-[9px] transition"
                            style={{
                              color: off ? 'var(--ink)' : 'var(--text-muted)',
                              backgroundColor: off ? 'var(--signal-amber)' : 'var(--panel)',
                              border: off ? 'none' : '1px solid var(--line)',
                            }}
                          >
                            {day.label[0]}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <button
                      onClick={() => onEditEmployee(emp)}
                      aria-label={`Edit ${emp.name}`}
                      className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      <Pencil size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-2 py-8 text-center text-[12px] text-[var(--text-muted)]">
                  No crew match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
        </>
      )}
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded px-2.5 py-1 font-mono text-[10.5px] transition ${
        active ? 'bg-[var(--tally)]/15 text-[var(--tally)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
      }`}
    >
      {label}
    </button>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 py-2.5">
      <div className="font-display text-[20px] font-semibold leading-none" style={{ color: color ?? 'var(--text-primary)' }}>
        {value}
      </div>
      <div className="mt-1 font-mono text-[9.5px] uppercase tracking-wide text-[var(--text-muted)]">{label}</div>
    </div>
  );
}
