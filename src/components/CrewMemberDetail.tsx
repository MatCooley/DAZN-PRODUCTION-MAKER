import { useState } from 'react';
import { ChevronLeft, Download, Plus, Printer, X } from 'lucide-react';
import type { Assignments, Employee, Shift, SkillCode } from '../lib/types';
import {
  computeDailyOvertime,
  computeMonthSummary,
  computeRolling30DayHours,
  FULLTIME_MONTH_STD_HOURS,
  FULLTIME_WEEK_STD_HOURS,
  type CrewStat,
} from '../lib/compliance';
import { allSkillCodes, departmentForSkill, skillLabel, statusColor } from '../lib/visuals';
import { avgRateForSkill } from '../lib/showLibrary';
import { formatHM } from '../lib/format';
import { downloadIcs } from '../lib/ics';

function currentMonthValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function monthBounds(monthValue: string): { start: string; end: string } {
  const [y, m] = monthValue.split('-').map(Number);
  const start = `${monthValue}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const end = `${monthValue}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

export function CrewMemberDetail({
  employee,
  shifts,
  assignments,
  crewStat,
  rosterDays,
  onBack,
  onUpdate,
  onRemove,
}: {
  employee: Employee;
  shifts: Shift[];
  assignments: Assignments;
  crewStat: CrewStat | undefined;
  rosterDays: { date: string; label: string }[];
  onBack: () => void;
  onUpdate: (updated: Employee) => void;
  onRemove: (employeeId: string) => void;
}) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [month, setMonth] = useState(currentMonthValue());
  const [addingSkill, setAddingSkill] = useState<SkillCode | ''>('');

  const days = rosterDays.map((d) => d.date);
  const weekEnd = days[days.length - 1] ?? days[0];
  const dailyOvertime = computeDailyOvertime(shifts, assignments, employee.id, days);
  const rolling30 = computeRolling30DayHours(shifts, assignments, employee.id, weekEnd);
  const { start: monthStart, end: monthEnd } = monthBounds(month);
  const monthSummary = computeMonthSummary(shifts, assignments, employee.id, monthStart, monthEnd);

  const isFullTime = employee.grade === 'Permanent';
  const overtimeThisWeek = crewStat ? Math.max(0, crewStat.hoursThisWeek - FULLTIME_WEEK_STD_HOURS) : 0;
  const daysOffAvailable = allSkillCodes.filter((s) => !employee.skills.includes(s));

  function addPosition(skill: SkillCode) {
    if (!skill || employee.skills.includes(skill)) return;
    onUpdate({ ...employee, skills: [...employee.skills, skill] });
  }

  function removePosition(skill: SkillCode) {
    const skills = employee.skills.filter((s) => s !== skill);
    if (skills.length === 0) return; // must keep at least one position
    const primarySkill = employee.primarySkill === skill ? skills[0] : employee.primarySkill;
    onUpdate({ ...employee, skills, primarySkill });
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="border-b border-[var(--line)] px-5 py-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1 font-mono text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <ChevronLeft size={14} /> Crew
        </button>
      </div>

      <div className="flex items-center justify-between px-5 py-4">
        <h3 className="font-display text-[22px] font-semibold text-[var(--text-primary)]">{employee.name}</h3>
        {confirmRemove ? (
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10.5px] text-[var(--text-muted)]">Remove {employee.name.split(' ')[0]}?</span>
            <button
              onClick={() => {
                onRemove(employee.id);
                onBack();
              }}
              className="rounded-md px-2.5 py-1.5 font-mono text-[10.5px] font-medium"
              style={{ backgroundColor: `${statusColor.breach}22`, color: statusColor.breach }}
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmRemove(false)}
              className="rounded-md border border-[var(--line)] px-2.5 py-1.5 font-mono text-[10.5px] text-[var(--text-muted)]"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmRemove(true)}
            className="rounded-md border border-[var(--line)] px-2.5 py-1.5 font-mono text-[10.5px] text-[var(--text-muted)] hover:border-[var(--signal-red)]/60 hover:text-[var(--signal-red)]"
          >
            Remove from crew
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-5 px-5 pb-5">
        <div>
          <SectionTitle>Details</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Department">
              <div className="input opacity-70">{departmentForSkill[employee.primarySkill]}</div>
            </Field>
            <Field label="Standard hours / week">
              <div className="input opacity-70">{isFullTime ? FULLTIME_WEEK_STD_HOURS : '—'}</div>
            </Field>
          </div>
          <Field label="Employment">
            <div className="flex gap-1.5">
              {(['Permanent', 'Freelance'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => onUpdate({ ...employee, grade: g })}
                  className="rounded-md px-3 py-1.5 font-mono text-[11px] font-medium transition"
                  style={{
                    backgroundColor: employee.grade === g ? 'var(--tally)' : 'var(--panel)',
                    color: employee.grade === g ? 'var(--ink)' : 'var(--text-muted)',
                    border: employee.grade === g ? 'none' : '1px solid var(--line)',
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Email">
            <input
              value={employee.email ?? ''}
              onChange={(e) => onUpdate({ ...employee, email: e.target.value })}
              placeholder="Not on file"
              className="input"
            />
          </Field>
          <Field label="Phone">
            <input
              value={employee.phone ?? ''}
              onChange={(e) => onUpdate({ ...employee, phone: e.target.value })}
              placeholder="Not on file"
              className="input"
            />
          </Field>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <SectionTitle>Positions</SectionTitle>
            <span className="font-mono text-[11px] text-[var(--text-muted)]">{employee.skills.length}</span>
          </div>
          <div className="space-y-1.5">
            {employee.skills.map((skill) => {
              const rate = avgRateForSkill(skill);
              return (
                <div key={skill} className="flex items-center justify-between rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 py-2">
                  <span className="text-[12.5px] text-[var(--text-primary)]">{skillLabel[skill]}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11.5px] text-[var(--text-muted)]">{rate ? `$${rate}/hr` : '—'}</span>
                    <button onClick={() => removePosition(skill)} aria-label={`Remove ${skillLabel[skill]}`} className="text-[var(--text-muted)] hover:text-[var(--signal-red)]">
                      <X size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {daysOffAvailable.length > 0 && (
            <div className="mt-2 flex items-center gap-1.5">
              <select
                value={addingSkill}
                onChange={(e) => setAddingSkill(e.target.value as SkillCode | '')}
                className="input flex-1"
              >
                <option value="">Add a position…</option>
                {daysOffAvailable.map((s) => (
                  <option key={s} value={s}>
                    {skillLabel[s]}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (addingSkill) {
                    addPosition(addingSkill);
                    setAddingSkill('');
                  }
                }}
                disabled={!addingSkill}
                className="flex items-center gap-1 rounded-md border border-[var(--line)] px-2.5 py-1.5 font-mono text-[10.5px] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30"
              >
                <Plus size={12} /> Add
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-[var(--line)] px-5 py-4">
        <div className="mb-2 flex items-center justify-between">
          <SectionTitle>Hours and overtime</SectionTitle>
          <span className="font-mono text-[10.5px] text-[var(--text-muted)]">
            {rosterDays[0]?.label} {rosterDays[0]?.date.slice(5)} to {rosterDays[6]?.label} {rosterDays[6]?.date.slice(5)}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <StatTile
            value={formatHM(crewStat?.hoursThisWeek ?? 0)}
            label="rostered this week"
            sub={isFullTime ? `of ${FULLTIME_WEEK_STD_HOURS}h — ${crewStat?.weekBand === 'std' ? 'within standard' : crewStat?.weekBand === 'extra' ? 'reasonable additional' : 'overtime'}` : undefined}
            subColor={crewStat?.weekBand === 'over' ? statusColor.breach : crewStat?.weekBand === 'extra' ? statusColor.warning : undefined}
          />
          {isFullTime && (
            <StatTile
              value={formatHM(overtimeThisWeek)}
              label="overtime this week"
              sub={overtimeThisWeek > 0 ? `${formatHM(overtimeThisWeek)} past ${FULLTIME_WEEK_STD_HOURS}h` : undefined}
              valueColor={overtimeThisWeek > 0 ? statusColor.warning : undefined}
            />
          )}
          <StatTile value={String(crewStat?.rdoWorkedThisWeek ?? 0)} label="days off taken" sub={`${crewStat?.daysWorkedThisWeek ?? 0} days worked`} />
          <StatTile
            value={formatHM(rolling30)}
            label="rostered in 30 days"
            sub={isFullTime ? `of ${FULLTIME_MONTH_STD_HOURS}h — ${rolling30 > FULLTIME_MONTH_STD_HOURS ? 'over standard' : 'within standard'}` : undefined}
            subColor={isFullTime && rolling30 > FULLTIME_MONTH_STD_HOURS ? statusColor.warning : undefined}
          />
          {isFullTime && (
            <StatTile
              value={formatHM(crewStat?.otSeasonHours ?? 0)}
              label="overtime this season"
              valueColor={(crewStat?.otSeasonHours ?? 0) > 0 ? statusColor.warning : undefined}
            />
          )}
        </div>
      </div>

      {dailyOvertime.length > 0 && (
        <div className="border-t border-[var(--line)] px-5 py-4">
          <div className="mb-2 flex items-center justify-between">
            <SectionTitle>Overtime by day</SectionTitle>
            <span className="font-mono text-[10.5px] text-[var(--text-muted)]">
              {rosterDays[0]?.label} {rosterDays[0]?.date.slice(5)} to {rosterDays[6]?.label} {rosterDays[6]?.date.slice(5)}
            </span>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[var(--line)] text-left font-mono text-[9.5px] uppercase tracking-wide text-[var(--text-muted)]">
                <th className="px-2 py-1.5 font-medium">Day</th>
                <th className="px-2 py-1.5 font-medium">Worked</th>
                <th className="px-2 py-1.5 font-medium">Overtime</th>
                <th className="px-2 py-1.5 font-medium">On</th>
              </tr>
            </thead>
            <tbody>
              {dailyOvertime.map((d) => (
                <tr key={d.date} className="border-b border-[var(--line)]/60">
                  <td className="px-2 py-2 text-[12px] text-[var(--text-primary)]">{d.date.slice(5)}</td>
                  <td className="px-2 py-2 font-mono text-[11.5px] text-[var(--text-primary)]">{formatHM(d.worked)}</td>
                  <td className="px-2 py-2 font-mono text-[11.5px]" style={{ color: statusColor.warning }}>
                    {formatHM(d.overtime)}
                  </td>
                  <td className="px-2 py-2 text-[11.5px] text-[var(--text-muted)]">{d.production}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="border-t border-[var(--line)] px-5 py-4">
        <div className="mb-2 flex items-center justify-between">
          <SectionTitle>Roster export</SectionTitle>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="input w-40"
          />
        </div>
        <p className="mb-3 font-mono text-[11px] text-[var(--text-muted)]">
          {monthSummary.calls} calls · {formatHM(monthSummary.hours)} across {monthSummary.days} days
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-md border border-[var(--line)] px-3 py-1.5 font-mono text-[10.5px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <Printer size={13} /> Print roster
          </button>
          <button
            onClick={() => downloadIcs(`${employee.name.replace(/\s+/g, '-').toLowerCase()}-${month}.ics`, `${employee.name} — Roster`, monthSummary.shifts)}
            disabled={monthSummary.shifts.length === 0}
            className="flex items-center gap-1.5 rounded-md border border-[var(--line)] px-3 py-1.5 font-mono text-[10.5px] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30"
          >
            <Download size={13} /> Download .ics
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="font-display text-[13px] font-semibold uppercase tracking-wide text-[var(--text-primary)]">{children}</h4>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mt-3 block">
      <span className="mb-1 block font-mono text-[9.5px] uppercase tracking-wide text-[var(--text-muted)]">{label}</span>
      {children}
    </label>
  );
}

function StatTile({
  value,
  label,
  sub,
  valueColor,
  subColor,
}: {
  value: string;
  label: string;
  sub?: string;
  valueColor?: string;
  subColor?: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 py-2.5">
      <div className="font-display text-[19px] font-semibold leading-none" style={{ color: valueColor ?? 'var(--text-primary)' }}>
        {value}
      </div>
      <div className="mt-1 font-mono text-[9.5px] uppercase tracking-wide text-[var(--text-muted)]">{label}</div>
      {sub && (
        <div className="mt-0.5 font-mono text-[9.5px]" style={{ color: subColor ?? 'var(--text-muted)' }}>
          {sub}
        </div>
      )}
    </div>
  );
}
