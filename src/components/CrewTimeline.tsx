import { useMemo, useState } from 'react';
import type { Assignments, Employee, Shift, SkillCode } from '../lib/types';
import type { CrewStat } from '../lib/compliance';
import { allSkillCodes, skillLabel, statusColor } from '../lib/visuals';
import { formatHM, nowClock } from '../lib/format';

function parseHour(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h + m / 60;
}

// Overnight shifts (end <= start) wrap past midnight — treat the end as
// next-day so the bar still reads left-to-right instead of wrapping.
function shiftSpan(s: Shift): { start: number; end: number } {
  const start = parseHour(s.start);
  let end = parseHour(s.end);
  if (end <= start) end += 24;
  return { start, end };
}

// The window is fitted to what's actually on screen this week — the
// earliest call to the latest wrap, padded an hour either side, with a
// floor so one short day doesn't stretch bars across the whole pane.
function fitWindow(days: string[], shifts: Shift[]): { start: number; end: number } {
  const daySet = new Set(days);
  let lo = Infinity;
  let hi = -Infinity;
  for (const s of shifts) {
    if (!daySet.has(s.day)) continue;
    const { start, end } = shiftSpan(s);
    lo = Math.min(lo, start);
    hi = Math.max(hi, end);
  }
  if (lo === Infinity) return { start: 6, end: 24 };
  lo = Math.max(0, Math.floor(lo) - 1);
  hi = Math.ceil(hi) + 1;
  if (hi - lo < 10) hi = lo + 10;
  return { start: lo, end: hi };
}

// A stable colour per production, so the same show reads as the same
// colour everywhere in the timeline without needing real per-show branding.
function productionColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return `hsl(${hash % 360}, 55%, 55%)`;
}

const BAND_LABEL: Record<CrewStat['weekBand'], string> = { std: '', extra: 'Extra', over: 'Over' };
const BAND_COLOR: Record<CrewStat['weekBand'], string> = { std: '', extra: statusColor.warning, over: statusColor.breach };

export function CrewTimeline({
  employees,
  shifts,
  assignments,
  crewStats,
  rosterDays,
}: {
  employees: Employee[];
  shifts: Shift[];
  assignments: Assignments;
  crewStats: Record<string, CrewStat>;
  rosterDays: { date: string; label: string }[];
}) {
  const [roleFilter, setRoleFilter] = useState<SkillCode | 'ALL'>('ALL');

  const days = useMemo(() => rosterDays.map((d) => d.date), [rosterDays]);

  const shiftsByEmployee = useMemo(() => {
    const map = new Map<string, Shift[]>();
    const shiftsById = new Map(shifts.map((s) => [s.id, s]));
    for (const [shiftId, bySkill] of Object.entries(assignments)) {
      const shift = shiftsById.get(shiftId);
      if (!shift) continue;
      for (const ids of Object.values(bySkill)) {
        for (const empId of ids) {
          const list = map.get(empId) ?? [];
          list.push(shift);
          map.set(empId, list);
        }
      }
    }
    for (const list of map.values()) list.sort((a, b) => (a.day === b.day ? a.start.localeCompare(b.start) : a.day.localeCompare(b.day)));
    return map;
  }, [shifts, assignments]);

  const visibleEmployees = useMemo(
    () => employees.filter((e) => roleFilter === 'ALL' || e.skills.includes(roleFilter)),
    [employees, roleFilter],
  );

  const window_ = useMemo(() => fitWindow(days, shifts), [days, shifts]);

  const shiftsThisWeek = useMemo(() => shifts.filter((s) => days.includes(s.day)), [shifts, days]);

  const fillByDay = useMemo(() => {
    const out = new Map<string, { filled: number; required: number }>();
    for (const day of days) {
      let filled = 0;
      let required = 0;
      for (const s of shiftsThisWeek.filter((s) => s.day === day)) {
        for (const r of s.requirements) {
          if (roleFilter !== 'ALL' && r.skill !== roleFilter) continue;
          required += r.count;
          filled += (assignments[s.id]?.[r.skill] ?? []).length;
        }
      }
      out.set(day, { filled, required });
    }
    return out;
  }, [days, shiftsThisWeek, assignments, roleFilter]);

  const { todayIso, hour: nowHour, label: nowLabel } = nowClock();
  const nowLeftPct = ((nowHour - window_.start) / (window_.end - window_.start)) * 100;
  const showNowBadge = nowLeftPct >= 0 && nowLeftPct <= 100;

  const fullTime = visibleEmployees.filter((e) => e.grade === 'Permanent');
  const freelance = visibleEmployees.filter((e) => e.grade === 'Freelance');

  const gridCols = `200px repeat(${days.length}, minmax(140px, 1fr))`;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-[var(--line)] px-5 py-3">
        <span className="font-mono text-[10.5px] uppercase tracking-wide text-[var(--text-muted)]">Crew</span>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as SkillCode | 'ALL')}
          className="rounded-md border border-[var(--line)] bg-[var(--panel)] px-2.5 py-1.5 text-[12px] text-[var(--text-primary)] focus:border-[var(--tally)]"
        >
          <option value="ALL">All roles</option>
          {allSkillCodes.map((skill) => (
            <option key={skill} value={skill}>
              {skillLabel[skill]}
            </option>
          ))}
        </select>
        <span className="font-mono text-[11px] text-[var(--text-muted)]">{shiftsThisWeek.length} shifts</span>
        <span className="ml-auto font-mono text-[11px] text-[var(--text-muted)]">{visibleEmployees.length} shown</span>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid" style={{ gridTemplateColumns: gridCols }}>
          <div className="sticky top-0 z-10 border-b border-r border-[var(--line)] bg-[var(--ink)]" />
          {rosterDays.map((day) => {
            const fill = fillByDay.get(day.date) ?? { filled: 0, required: 0 };
            const isToday = day.date === todayIso;
            return (
              <div
                key={day.date}
                className={`sticky top-0 z-10 relative border-b border-r border-[var(--line)] bg-[var(--ink)] px-2 py-1.5 ${isToday ? 'bg-[var(--tally)]/10' : ''}`}
              >
                {isToday && showNowBadge && (
                  <span
                    className="absolute -top-1 z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded px-1.5 py-0.5 font-mono text-[10px] font-bold text-[var(--ink)] shadow"
                    style={{ left: `${nowLeftPct}%`, backgroundColor: 'var(--tally)' }}
                  >
                    {nowLabel}
                  </span>
                )}
                <div className="flex items-baseline gap-1.5">
                  <span
                    className="font-display text-[12px] font-semibold uppercase tracking-wide"
                    style={{ color: isToday ? 'var(--tally)' : 'var(--text-primary)' }}
                  >
                    {day.label}
                  </span>
                  <span className="font-mono text-[9.5px] text-[var(--text-muted)]">{day.date.slice(5)}</span>
                </div>
                <div
                  className="font-mono text-[9.5px]"
                  style={{ color: fill.required > 0 && fill.filled < fill.required ? statusColor.warning : 'var(--text-muted)' }}
                >
                  {fill.filled}/{fill.required} filled
                </div>
              </div>
            );
          })}

          {fullTime.length > 0 && (
            <SectionLabel label="Full-time" span={days.length + 1} />
          )}
          {fullTime.map((emp) => (
            <CrewRow
              key={emp.id}
              employee={emp}
              days={rosterDays}
              shifts={shiftsByEmployee.get(emp.id) ?? []}
              stat={crewStats[emp.id]}
              window={window_}
              todayIso={todayIso}
              nowHour={nowHour}
            />
          ))}

          {freelance.length > 0 && (
            <SectionLabel label="Freelance" span={days.length + 1} />
          )}
          {freelance.map((emp) => (
            <CrewRow
              key={emp.id}
              employee={emp}
              days={rosterDays}
              shifts={shiftsByEmployee.get(emp.id) ?? []}
              stat={crewStats[emp.id]}
              window={window_}
              todayIso={todayIso}
              nowHour={nowHour}
            />
          ))}

          {visibleEmployees.length === 0 && (
            <div className="col-span-full px-5 py-10 text-center text-[12px] text-[var(--text-muted)]">
              Nobody matches this filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ label, span }: { label: string; span: number }) {
  return (
    <div className="border-b border-[var(--line)] bg-[var(--panel)]/60 px-2 py-1 font-mono text-[9.5px] uppercase tracking-wide text-[var(--text-muted)]" style={{ gridColumn: `span ${span}` }}>
      {label}
    </div>
  );
}

function CrewRow({
  employee,
  days,
  shifts,
  stat,
  window: win,
  todayIso,
  nowHour,
}: {
  employee: Employee;
  days: { date: string; label: string }[];
  shifts: Shift[];
  stat: CrewStat | undefined;
  window: { start: number; end: number };
  todayIso: string;
  nowHour: number;
}) {
  const shiftsByDay = useMemo(() => {
    const map = new Map<string, Shift[]>();
    for (const s of shifts) {
      const list = map.get(s.day) ?? [];
      list.push(s);
      map.set(s.day, list);
    }
    return map;
  }, [shifts]);

  const span = win.end - win.start;
  const nowLeftPct = ((nowHour - win.start) / span) * 100;

  return (
    <>
      <div className="border-b border-r border-[var(--line)] px-2 py-2">
        <div className="truncate text-[12.5px] font-medium text-[var(--text-primary)]">{employee.name}</div>
        <div className="flex items-center gap-1 font-mono text-[9.5px] text-[var(--text-muted)]">
          {stat?.isFullTime ? `${formatHM(stat.hoursThisWeek)} of 38h` : `${formatHM(stat?.hoursThisWeek ?? 0)}`}
          {stat && stat.weekBand !== 'std' && (
            <span className="rounded px-1 py-0.5" style={{ color: BAND_COLOR[stat.weekBand], backgroundColor: `${BAND_COLOR[stat.weekBand]}1a` }}>
              {BAND_LABEL[stat.weekBand]}
            </span>
          )}
        </div>
        {!!stat?.rdoOwed && (
          <div
            className="mt-0.5 inline-block rounded px-1 py-0.5 font-mono text-[9px]"
            style={{ color: statusColor.breach, backgroundColor: `${statusColor.breach}1a` }}
          >
            {stat.rdoOwed} RDO owed
          </div>
        )}
      </div>
      {days.map((day) => {
        const dayShifts = shiftsByDay.get(day.date) ?? [];
        const showNow = day.date === todayIso && nowLeftPct >= 0 && nowLeftPct <= 100;
        return (
          <div key={day.date} className="relative h-[46px] border-b border-r border-[var(--line)]">
            {showNow && (
              <div className="absolute top-0 bottom-0 z-10 w-px bg-[var(--tally)]" style={{ left: `${nowLeftPct}%` }} />
            )}
            {dayShifts.map((s) => {
              const { start, end } = shiftSpan(s);
              const left = Math.max(0, ((start - win.start) / span) * 100);
              const width = Math.max(2, ((Math.min(end, win.end) - start) / span) * 100);
              const color = productionColor(s.production);
              return (
                <div
                  key={s.id}
                  title={`${s.start}–${s.end} · ${s.production}`}
                  className="absolute top-1 bottom-1 overflow-hidden rounded border px-1.5 py-0.5"
                  style={{ left: `${left}%`, width: `${width}%`, borderColor: color, backgroundColor: `${color}26` }}
                >
                  <div className="truncate font-medium text-[9.5px] leading-tight" style={{ color }}>
                    {s.production}
                  </div>
                  <div className="truncate font-mono text-[8.5px] leading-tight text-[var(--text-muted)]">
                    {s.start}–{s.end}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </>
  );
}
