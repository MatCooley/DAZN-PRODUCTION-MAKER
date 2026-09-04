import { useState } from 'react';
import { CalendarPlus, ChevronLeft, Plus, X } from 'lucide-react';
import type { ShowTemplate } from '../lib/showLibrary';
import { skillCodeForRole } from '../lib/showLibrary';
import type { Employee } from '../lib/types';
import { DAY_LABELS_SHORT, type ShowSchedule, type ShowCrewAssignment } from '../lib/shows';
import type { GenerateResult } from './facilities/FacilitiesBoard';
import { allSkillCodes, skillLabel } from '../lib/visuals';
import { resources } from '../lib/facilityData';
import { statusColor } from '../lib/visuals';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
function addMonthsIso(base: string, months: number): string {
  const d = new Date(`${base}T00:00:00`);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}
function daysSummary(days: number[]): string {
  const order = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun
  return order.filter((d) => days.includes(d)).map((d) => DAY_LABELS_SHORT[d]).join('/');
}

const PALETTE = ['#e8a93c', '#4f9de0', '#8b7ce8', '#e07ca8', '#4dd68c', '#c084fc', '#fbbf24', '#94a3b8'];
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun, matching the reference layout

function resourceStudioLetter(code: string): string {
  return code.split('_')[1] ?? '?';
}

export function ShowDetail({
  show,
  employees,
  schedule,
  onBack,
  onSave,
  onDelete,
  onGenerate,
}: {
  show: ShowTemplate;
  employees: Employee[];
  schedule: ShowSchedule;
  onBack: () => void;
  onSave: (updated: ShowSchedule) => void;
  onDelete: () => void;
  onGenerate: (fromDate: string, toDate: string) => GenerateResult;
}) {
  const [draft, setDraft] = useState<ShowSchedule>(schedule);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addingRole, setAddingRole] = useState<string>('');
  const [genFrom, setGenFrom] = useState(todayIso());
  const [genTo, setGenTo] = useState(addMonthsIso(todayIso(), 1));
  const [genResult, setGenResult] = useState<GenerateResult | null>(null);

  function save(next: ShowSchedule) {
    setDraft(next);
    onSave(next);
  }

  function toggleDay(day: number) {
    const repeatDays = draft.repeatDays.includes(day) ? draft.repeatDays.filter((d) => d !== day) : [...draft.repeatDays, day];
    save({ ...draft, repeatDays });
  }

  function toggleResource(id: string) {
    const resourceIds = draft.resourceIds.includes(id) ? draft.resourceIds.filter((r) => r !== id) : [...draft.resourceIds, id];
    save({ ...draft, resourceIds });
  }

  function updateAssignment(role: string, patch: Partial<ShowCrewAssignment>) {
    save({ ...draft, crewAssignments: draft.crewAssignments.map((a) => (a.role === role ? { ...a, ...patch } : a)) });
  }

  function removeAssignment(role: string) {
    save({ ...draft, crewAssignments: draft.crewAssignments.filter((a) => a.role !== role) });
  }

  function addAssignment() {
    if (!addingRole || draft.crewAssignments.some((a) => a.role === addingRole)) return;
    save({ ...draft, crewAssignments: [...draft.crewAssignments, { role: addingRole, regularEmployeeId: null, callOffsetMin: 0, wrapOffsetMin: 30 }] });
    setAddingRole('');
  }

  const assignedRoles = new Set(draft.crewAssignments.map((a) => a.role));
  const availableRoles = allSkillCodes.map((skill) => skillLabel[skill]).filter((role) => !assignedRoles.has(role));
  const isWeekly = draft.repeatDays.length > 0;
  const groupedResources = resources.reduce<Record<string, typeof resources>>((acc, r) => {
    const letter = resourceStudioLetter(r.code);
    (acc[letter] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className="flex-1 overflow-auto">
      <div className="border-b border-[var(--line)] px-5 py-3">
        <button onClick={onBack} className="flex items-center gap-1 font-mono text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          <ChevronLeft size={14} /> Shows
        </button>
      </div>

      <div className="flex items-center justify-between px-5 py-4">
        <h3 className="font-display text-[22px] font-semibold text-[var(--text-primary)]">{show.name}</h3>
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10.5px] text-[var(--text-muted)]">Remove this show from the list?</span>
            <button
              onClick={onDelete}
              className="rounded-md px-2.5 py-1.5 font-mono text-[10.5px] font-medium"
              style={{ backgroundColor: `${statusColor.breach}22`, color: statusColor.breach }}
            >
              Confirm
            </button>
            <button onClick={() => setConfirmDelete(false)} className="rounded-md border border-[var(--line)] px-2.5 py-1.5 font-mono text-[10.5px] text-[var(--text-muted)]">
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="rounded-md border border-[var(--line)] px-2.5 py-1.5 font-mono text-[10.5px] text-[var(--text-muted)] hover:border-[var(--signal-red)]/60 hover:text-[var(--signal-red)]"
          >
            Delete show
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-5 px-5 pb-5">
        <div>
          <SectionTitle>Colour</SectionTitle>
          <div className="mt-2 flex gap-1.5">
            {PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => save({ ...draft, color: c })}
                aria-label={`Set colour ${c}`}
                className="h-7 w-7 rounded-full transition"
                style={{ backgroundColor: c, boxShadow: draft.color === c ? `0 0 0 2px var(--ink), 0 0 0 4px ${c}` : 'none' }}
              />
            ))}
          </div>

          <div className="mt-5">
            <SectionTitle>Schedule</SectionTitle>
            <div className="mt-2 flex gap-1.5">
              <button
                onClick={() => save({ ...draft, repeatDays: draft.repeatDays.length > 0 ? draft.repeatDays : [1] })}
                className="rounded-md px-3 py-1.5 font-mono text-[11px] font-medium"
                style={{ backgroundColor: isWeekly ? 'var(--tally)' : 'var(--panel)', color: isWeekly ? 'var(--ink)' : 'var(--text-muted)', border: isWeekly ? 'none' : '1px solid var(--line)' }}
              >
                Weekly
              </button>
              <button
                onClick={() => save({ ...draft, repeatDays: [] })}
                className="rounded-md px-3 py-1.5 font-mono text-[11px] font-medium"
                style={{ backgroundColor: !isWeekly ? 'var(--tally)' : 'var(--panel)', color: !isWeekly ? 'var(--ink)' : 'var(--text-muted)', border: !isWeekly ? 'none' : '1px solid var(--line)' }}
              >
                One-off
              </button>
            </div>

            {isWeekly && (
              <div className="mt-3">
                <FieldLabel>Days</FieldLabel>
                <div className="flex gap-1">
                  {WEEKDAY_ORDER.map((day) => (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className="flex h-7 w-9 items-center justify-center rounded font-mono text-[10.5px] font-medium"
                      style={{
                        backgroundColor: draft.repeatDays.includes(day) ? 'var(--tally)' : 'var(--panel)',
                        color: draft.repeatDays.includes(day) ? 'var(--ink)' : 'var(--text-muted)',
                        border: draft.repeatDays.includes(day) ? 'none' : '1px solid var(--line)',
                      }}
                    >
                      {DAY_LABELS_SHORT[day]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Starts">
                <input type="time" value={draft.startTime} onChange={(e) => save({ ...draft, startTime: e.target.value })} className="input" />
              </Field>
              <Field label="Ends">
                <input type="time" value={draft.endTime} onChange={(e) => save({ ...draft, endTime: e.target.value })} className="input" />
              </Field>
            </div>
            {isWeekly && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Field label="Season from">
                  <input type="date" value={draft.seasonFrom} onChange={(e) => save({ ...draft, seasonFrom: e.target.value })} className="input" />
                </Field>
                <Field label="Season to">
                  <input type="date" value={draft.seasonTo} onChange={(e) => save({ ...draft, seasonTo: e.target.value })} className="input" />
                </Field>
              </div>
            )}
          </div>

          <div className="mt-5">
            <SectionTitle>Facilities</SectionTitle>
            <div className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-md border border-[var(--line)] bg-[var(--panel)] p-2.5">
              {Object.entries(groupedResources).map(([letter, group]) => (
                <div key={letter}>
                  <div className="font-mono text-[9.5px] uppercase tracking-wide text-[var(--text-muted)]">Studio {letter}</div>
                  {group.map((r) => (
                    <label key={r.id} className="flex items-center gap-2 py-0.5 pl-1 text-[12px] text-[var(--text-primary)]">
                      <input type="checkbox" checked={draft.resourceIds.includes(r.id)} onChange={() => toggleResource(r.id)} />
                      {r.name.split('—')[1]?.trim() ?? r.name}
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <SectionTitle>Work order</SectionTitle>
            <Field label="Project">
              <input value={draft.project} onChange={(e) => save({ ...draft, project: e.target.value })} placeholder="e.g. Rugby League / Show Name / CODE" className="input" />
            </Field>
          </div>

          <div className="mt-5">
            <SectionTitle>Generate bookings</SectionTitle>
            <p className="mt-1 text-[10.5px] leading-snug text-[var(--text-muted)]">
              Creates real bookings on the Studio board for this schedule — every {isWeekly ? daysSummary(draft.repeatDays) : 'day'} between
              the dates below — and fills in the regulars set above wherever a slot is still open.
            </p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <Field label="From">
                <input type="date" value={genFrom} onChange={(e) => setGenFrom(e.target.value)} className="input" />
              </Field>
              <Field label="To">
                <input type="date" value={genTo} onChange={(e) => setGenTo(e.target.value)} className="input" />
              </Field>
            </div>
            <button
              onClick={() => setGenResult(onGenerate(genFrom, genTo))}
              disabled={draft.resourceIds.length === 0}
              className="mt-2 flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-[10.5px] font-semibold disabled:opacity-30"
              style={{ backgroundColor: 'var(--tally)', color: 'var(--ink)' }}
            >
              <CalendarPlus size={13} /> Generate
            </button>
            {draft.resourceIds.length === 0 && (
              <p className="mt-1.5 text-[10.5px] text-[var(--text-muted)]">Pick a facility above first.</p>
            )}
            {genResult && (
              <p className="mt-1.5 text-[10.5px]" style={{ color: genResult.created > 0 ? statusColor.ok : statusColor.warning }}>
                {genResult.error
                  ? genResult.error
                  : genResult.created > 0
                    ? `Created ${genResult.created} booking${genResult.created === 1 ? '' : 's'}.`
                    : genResult.conflicts > 0
                      ? `Blocked — ${genResult.conflicts} occurrence${genResult.conflicts === 1 ? '' : 's'} conflict with an existing booking.`
                      : 'No occurrences in that date range.'}
              </p>
            )}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <SectionTitle>Standard crew</SectionTitle>
            <span className="font-mono text-[11px] text-[var(--text-muted)]">{draft.crewAssignments.length} positions</span>
          </div>
          <div className="space-y-1.5">
            {draft.crewAssignments.map((a) => {
              const skill = skillCodeForRole(a.role);
              const eligible = skill ? employees.filter((e) => e.skills.includes(skill)) : [];
              return (
                <div key={a.role} className="rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 py-2">
                  <div className="text-[12.5px] font-medium text-[var(--text-primary)]">{a.role}</div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <select
                      value={a.regularEmployeeId ?? ''}
                      onChange={(e) => updateAssignment(a.role, { regularEmployeeId: e.target.value || null })}
                      className="input flex-1"
                    >
                      <option value="">Open — freelance pool</option>
                      {eligible.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={a.callOffsetMin}
                      onChange={(e) => updateAssignment(a.role, { callOffsetMin: Number(e.target.value) })}
                      title="Call offset, minutes relative to start"
                      className="input w-16"
                    />
                    <input
                      type="number"
                      value={a.wrapOffsetMin}
                      onChange={(e) => updateAssignment(a.role, { wrapOffsetMin: Number(e.target.value) })}
                      title="Wrap offset, minutes relative to end"
                      className="input w-16"
                    />
                    <button onClick={() => removeAssignment(a.role)} aria-label={`Remove ${a.role}`} className="text-[var(--text-muted)] hover:text-[var(--signal-red)]">
                      <X size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {availableRoles.length > 0 && (
            <div className="mt-2 flex items-center gap-1.5">
              <select value={addingRole} onChange={(e) => setAddingRole(e.target.value)} className="input flex-1">
                <option value="">Add a position…</option>
                {availableRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <button
                onClick={addAssignment}
                disabled={!addingRole}
                className="flex items-center gap-1 rounded-md border border-[var(--line)] px-2.5 py-1.5 font-mono text-[10.5px] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30"
              >
                <Plus size={12} /> Add to crew
              </button>
            </div>
          )}
          <p className="mt-3 text-[10.5px] leading-snug text-[var(--text-muted)]">
            This is the standing plan for who normally covers each position — Generate bookings below fills open roster slots with
            these regulars automatically; a position with nobody set is left open for the freelance pool.
          </p>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="font-display text-[13px] font-semibold uppercase tracking-wide text-[var(--text-primary)]">{children}</h4>;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block font-mono text-[9.5px] uppercase tracking-wide text-[var(--text-muted)]">{children}</span>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      {children}
    </label>
  );
}
