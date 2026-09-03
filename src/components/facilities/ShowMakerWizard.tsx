import { useMemo, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Search, Check, Minus, Plus } from 'lucide-react';
import { showLibrary, type ShowTemplate } from '../../lib/showLibrary';
import { resolveBookingResourceIds, bookingTargetOptions } from '../../lib/facilityData';
import { allSkillCodes, skillColor, skillLabel, statusColor } from '../../lib/visuals';
import { DatePicker } from './DatePicker';
import type { BookingDraft } from '../../lib/facilityTypes';
import type { SkillCode } from '../../lib/types';
import { generateOccurrences } from '../../lib/facilityLogic';
import { startOfWeekMonday, toLocalDateString } from '../../lib/dateUtils';

const WEEKDAY_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function defaultDuration(t: ShowTemplate | null): number {
  if (!t || t.crew.length === 0) return 4;
  return Math.max(...t.crew.map((c) => c.shiftHours));
}

// Duration is derived from Start/End time rather than typed directly —
// wraps past midnight for an overnight booking instead of going negative.
function hoursBetween(startHHmm: string, endHHmm: string): number {
  const [sh, sm] = startHHmm.split(':').map(Number);
  const [eh, em] = endHHmm.split(':').map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins <= 0) mins += 24 * 60;
  return mins / 60;
}

function addHours(hhmm: string, hours: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = (((h * 60 + m + Math.round(hours * 60)) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

// "NRL 360 Mon" -> "NRL 360" — the base title defaults to the show name;
// per-occurrence weekday suffixes get added back at creation time for
// bookings that span more than one weekday (see buildEventsForDraft).
function stripTrailingWeekday(name: string): string {
  return name.replace(/\s+(Mon|Tue|Wed|Thu|Fri|Sat|Sun)(day)?$/i, '').trim();
}

// Picking an End Date auto-fills which weekdays the show repeats on (every
// distinct weekday between Start and End) and how many weeks that spans —
// still hand-editable afterward via the Repeats on / weeks fields below.
function computeRepeatFromRange(startDateStr: string, endDateStr: string): { repeatDays: number[]; repeatWeeks: number } {
  const start = new Date(`${startDateStr}T00:00:00`);
  const end = new Date(`${endDateStr}T00:00:00`);
  if (end.getTime() < start.getTime()) return { repeatDays: [start.getDay()], repeatWeeks: 0 };

  const daysSpan = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  const weekdaySet = new Set<number>();
  const cursor = new Date(start);
  for (let i = 0; i < Math.min(daysSpan, 7); i++) {
    weekdaySet.add(cursor.getDay());
    cursor.setDate(cursor.getDate() + 1);
  }
  return { repeatDays: Array.from(weekdaySet).sort((a, b) => a - b), repeatWeeks: Math.max(1, Math.ceil(daysSpan / 7)) };
}

// The other direction of the same sync — toggling a weekday on/off in
// "Repeats on" moves End Date to match, landing on whichever selected
// weekday falls last within the current repeat span.
function lastOccurrenceDateStr(startDateStr: string, repeatDays: number[], repeatWeeks: number): string {
  const anchorDay = new Date(`${startDateStr}T00:00:00`);
  const monday = startOfWeekMonday(anchorDay);
  const weeks = Math.max(1, repeatWeeks);
  const days = repeatDays.length > 0 ? repeatDays : [anchorDay.getDay()];

  let last = anchorDay;
  for (let w = 0; w < weeks; w++) {
    for (const dow of days) {
      const offsetFromMonday = dow === 0 ? 6 : dow - 1; // Mon=0 ... Sun=6
      const occurrenceDay = new Date(monday);
      occurrenceDay.setDate(monday.getDate() + w * 7 + offsetFromMonday);
      if (occurrenceDay.getTime() < anchorDay.getTime()) continue;
      if (occurrenceDay.getTime() > last.getTime()) last = occurrenceDay;
    }
  }
  return toLocalDateString(last);
}

const STEPS = ['Choose a show', 'Date & studio', 'Review & crew'] as const;

export function ShowMakerWizard({
  isNoteOnly,
  checkFree,
  onClose,
  onSubmit,
}: {
  isNoteOnly: boolean;
  checkFree: (resourceIds: string[], start: Date, end: Date) => { free: boolean; blockedBy: string[] };
  onClose: () => void;
  onSubmit: (draft: BookingDraft, resourceIds: string[]) => void;
}) {
  const [step, setStep] = useState(0);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<BookingDraft>(() => {
    const today = toLocalDateString(new Date());
    return {
      template: null,
      studio: '',
      resourceSelection: 'BOTH',
      date: today,
      endDate: today,
      startTime: '00:00',
      endTime: '00:00',
      durationHours: hoursBetween('00:00', '00:00'),
      title: '',
      production: '',
      client: '',
      repeatDays: [], // none selected — a single booking on `date` until the user opts into a pattern
      repeatWeeks: 0,
      liveTxStart: '00:00',
      liveTxEnd: '00:00',
      excludedCrewRoles: [],
      customCrew: [],
    };
  });

  const filteredTemplates = useMemo(() => {
    const studioBound = showLibrary.filter((s) => s.studio);
    if (!query) return studioBound;
    return studioBound.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()));
  }, [query]);

  function pickTemplate(t: ShowTemplate | null) {
    setDraft((d) => {
      const dur = t ? defaultDuration(t) : d.durationHours;
      const endTime = t ? addHours(d.startTime, dur) : d.endTime;
      return {
        ...d,
        template: t,
        studio: t?.studio ?? d.studio,
        resourceSelection: 'BOTH',
        endTime,
        durationHours: dur,
        title: stripTrailingWeekday(t?.name ?? d.title),
        production: t?.name ?? d.production,
        excludedCrewRoles: [],
        customCrew: [],
      };
    });
    setStep(1);
  }

  function toggleCrewRole(role: string) {
    setDraft((d) => {
      const excluded = d.excludedCrewRoles.includes(role)
        ? d.excludedCrewRoles.filter((r) => r !== role)
        : [...d.excludedCrewRoles, role];
      return { ...d, excludedCrewRoles: excluded };
    });
  }

  function toggleCustomCrewSkill(skill: SkillCode) {
    setDraft((d) => {
      const has = d.customCrew.some((c) => c.skill === skill);
      const customCrew = has
        ? d.customCrew.filter((c) => c.skill !== skill)
        : [...d.customCrew, { skill, count: 1 }];
      return { ...d, customCrew };
    });
  }

  function adjustCustomCrewCount(skill: SkillCode, delta: number) {
    setDraft((d) => ({
      ...d,
      customCrew: d.customCrew.map((c) => (c.skill === skill ? { ...c, count: Math.max(1, c.count + delta) } : c)),
    }));
  }

  function toggleDay(dow: number) {
    setDraft((d) => {
      const has = d.repeatDays.includes(dow);
      const next = has ? d.repeatDays.filter((x) => x !== dow) : [...d.repeatDays, dow].sort();
      // Always keep at least the anchor date's own weekday selected.
      const anchorDow = new Date(`${d.date}T00:00:00`).getDay();
      const repeatDays = next.length > 0 ? next : [anchorDow];
      const endDate = lastOccurrenceDateStr(d.date, repeatDays, d.repeatWeeks);
      return { ...d, repeatDays, endDate };
    });
  }

  const occurrences = useMemo(() => generateOccurrences(draft), [draft]);
  const resourceIds = draft.studio ? resolveBookingResourceIds(draft.studio, draft.resourceSelection) : [];
  const start = occurrences[0]?.start ?? null;
  const end = occurrences[0]?.end ?? null;

  const occurrenceChecks = useMemo(
    () => occurrences.map((o) => ({ ...o, check: resourceIds.length ? checkFree(resourceIds, o.start, o.end) : null })),
    [occurrences, resourceIds, checkFree]
  );
  const conflictingOccurrences = occurrenceChecks.filter((o) => o.check && !o.check.free);

  // Shown on both Date & studio and Review & crew — conflicts don't stop
  // mattering just because you moved to the next step, and "Create
  // booking" silently failing on Step 3 with no visible reason was exactly
  // the confusing bit this fixes.
  const conflictBanner = conflictingOccurrences.length > 0 && (
    <div
      className="rounded-md border p-2 text-[11px]"
      style={{ borderColor: `${statusColor.breach}66`, backgroundColor: `${statusColor.breach}15`, color: statusColor.breach }}
    >
      ⚠ {conflictingOccurrences.length} of {occurrences.length} occurrence{occurrences.length === 1 ? '' : 's'} conflict
      {conflictingOccurrences.length === 1 ? 's' : ''}:{' '}
      {conflictingOccurrences
        .slice(0, 3)
        .map((o) => o.start.toLocaleDateString('en-AU', { day: '2-digit', month: 'short' }))
        .join(', ')}
      {conflictingOccurrences.length > 3 ? `, +${conflictingOccurrences.length - 3} more` : ''}
      {isNoteOnly ? ' — you can still propose this, a supervisor will see the conflicts.' : ' — resolve before creating.'}
    </div>
  );

  const noOccurrencesBanner = occurrences.length === 0 && (
    <div
      className="rounded-md border p-2 text-[11px]"
      style={{ borderColor: `${statusColor.breach}66`, backgroundColor: `${statusColor.breach}15`, color: statusColor.breach }}
    >
      ⚠ No occurrences fall in range — check that End Date isn't before Start Date.
    </div>
  );

  const targetOptions = useMemo(() => bookingTargetOptions(), []);
  const canProceedStep1 = !!draft.studio && !!draft.date && !!draft.startTime && draft.durationHours > 0;
  // A direct-edit user can't create a genuinely conflicting booking — a
  // note-only user still can, as a proposal for a supervisor to review —
  // matching the conflict-blocking logic in handleWizardSubmit.
  const hasBlockingConflicts = conflictingOccurrences.length > 0 && !isNoteOnly;
  // occurrences.length === 0 (e.g. an End Date landing before Start Date)
  // would otherwise let "Create booking" report success while creating
  // nothing at all — guard against that directly, not just at the source.
  const canSubmit = canProceedStep1 && !!draft.title && !hasBlockingConflicts && occurrences.length > 0;
  const isRecurring = occurrences.length > 1;
  const includedCrewCost = (draft.template?.crew ?? [])
    .filter((c) => !draft.excludedCrewRoles.includes(c.role))
    .reduce((n, c) => n + c.totalCost, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-[520px] flex-col rounded-lg border border-[var(--line)] bg-[var(--panel-raised)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
          <div>
            <h2 className="font-display text-[16px] font-semibold uppercase tracking-wide text-[var(--text-primary)]">
              New booking
            </h2>
            <div className="mt-1 flex items-center gap-1.5">
              {STEPS.map((s, i) => (
                <span
                  key={s}
                  className="flex items-center gap-1 font-mono text-[9.5px]"
                  style={{ color: i === step ? 'var(--tally)' : i < step ? statusColor.ok : 'var(--text-muted)' }}
                >
                  {i < step ? <Check size={10} /> : `${i + 1}.`} {s}
                  {i < STEPS.length - 1 && <span className="mx-0.5 text-[var(--text-muted)]">/</span>}
                </span>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {step === 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--ink)] px-2.5 py-1.5">
                <Search size={13} className="text-[var(--text-muted)]" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search show types…"
                  className="w-full bg-transparent text-[12px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                />
              </div>
              <div className="space-y-1.5">
                <button
                  onClick={() => pickTemplate(null)}
                  className="w-full rounded-md border border-dashed border-[var(--line)] px-3 py-2 text-left text-[12px] text-[var(--text-muted)] transition hover:border-[var(--tally)]/60 hover:text-[var(--text-primary)]"
                >
                  + Custom booking (no template)
                </button>
                {filteredTemplates.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => pickTemplate(t)}
                    className="flex w-full items-center justify-between rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-left transition hover:border-[var(--tally)]/60"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-medium text-[var(--text-primary)]">{t.name}</p>
                      <p className="text-[10.5px] text-[var(--text-muted)]">
                        Studio {t.studio} · {t.crew.reduce((n, c) => n + c.count, 0)} crew · ~
                        {defaultDuration(t)}h
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-[11px] text-[var(--text-primary)]">
                      ${t.totalCrewCost.toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <Field label="Title">
                <input
                  value={draft.title}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                  className="input"
                />
              </Field>
              <Field label="Where">
                <select
                  value={draft.studio ? `${draft.studio}|${draft.resourceSelection}` : ''}
                  onChange={(e) => {
                    const [studio, selection] = e.target.value.split('|') as [string, BookingDraft['resourceSelection']];
                    setDraft((d) => ({ ...d, studio, resourceSelection: selection ?? 'BOTH' }));
                  }}
                  className="input"
                >
                  <option value="">Select a studio / resource…</option>
                  {targetOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Start date">
                  <DatePicker
                    value={draft.date}
                    onChange={(dateStr) =>
                      setDraft((d) => {
                        const oldAnchorDow = new Date(`${d.date}T00:00:00`).getDay();
                        const newAnchorDow = new Date(`${dateStr}T00:00:00`).getDay();
                        // Swap the old anchor weekday for the new one, keeping any
                        // other days the user had toggled on.
                        const repeatDays = d.repeatDays.includes(oldAnchorDow)
                          ? Array.from(new Set([...d.repeatDays.filter((x) => x !== oldAnchorDow), newAnchorDow])).sort()
                          : d.repeatDays;
                        // Keep End Date valid — a stale End Date left behind
                        // the new Start Date would silently zero out every
                        // occurrence (and "Create booking" would create
                        // nothing at all without any error).
                        const endDate = d.endDate && d.endDate >= dateStr ? d.endDate : dateStr;
                        return { ...d, date: dateStr, endDate, repeatDays };
                      })
                    }
                  />
                </Field>
                <Field label="End date">
                  <DatePicker
                    value={draft.endDate ?? draft.date}
                    onChange={(dateStr) =>
                      setDraft((d) => {
                        const { repeatDays, repeatWeeks } = computeRepeatFromRange(d.date, dateStr);
                        return { ...d, endDate: dateStr, repeatDays, repeatWeeks };
                      })
                    }
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Start time">
                  <input
                    type="time"
                    value={draft.startTime}
                    onChange={(e) => {
                      const startTime = e.target.value;
                      setDraft((d) => ({ ...d, startTime, durationHours: hoursBetween(startTime, d.endTime ?? '20:00') }));
                    }}
                    className="input"
                  />
                </Field>
                <Field label="End time">
                  <input
                    type="time"
                    value={draft.endTime ?? '20:00'}
                    onChange={(e) => {
                      const endTime = e.target.value;
                      setDraft((d) => ({ ...d, endTime, durationHours: hoursBetween(d.startTime, endTime) }));
                    }}
                    className="input"
                  />
                </Field>
              </div>
              <p className="font-mono text-[10px] text-[var(--text-muted)]">Duration: {draft.durationHours}h</p>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Live TX start">
                  <input
                    type="time"
                    value={draft.liveTxStart ?? '18:30'}
                    onChange={(e) => setDraft((d) => ({ ...d, liveTxStart: e.target.value }))}
                    className="input"
                  />
                </Field>
                <Field label="Live TX end">
                  <input
                    type="time"
                    value={draft.liveTxEnd ?? '19:30'}
                    onChange={(e) => setDraft((d) => ({ ...d, liveTxEnd: e.target.value }))}
                    className="input"
                  />
                </Field>
              </div>
              <Field label="Repeats on">
                <div className="flex gap-1">
                  {WEEKDAY_SHORT.map((label, dow) => {
                    const active = draft.repeatDays.includes(dow);
                    return (
                      <button
                        type="button"
                        key={dow}
                        onClick={() => toggleDay(dow)}
                        className="flex h-7 w-7 items-center justify-center rounded-full font-mono text-[10px] transition"
                        style={{
                          backgroundColor: active ? 'var(--tally)' : 'var(--ink)',
                          color: active ? 'var(--ink)' : 'var(--text-muted)',
                          border: `1px solid ${active ? 'var(--tally)' : 'var(--line)'}`,
                          fontWeight: active ? 700 : 400,
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <Field label="Repeat for how many weeks / episodes">
                <input
                  type="number"
                  min={0}
                  max={52}
                  value={draft.repeatWeeks}
                  onChange={(e) => {
                    const repeatWeeks = Math.max(0, Number(e.target.value));
                    setDraft((d) => ({ ...d, repeatWeeks, endDate: lastOccurrenceDateStr(d.date, d.repeatDays, repeatWeeks) }));
                  }}
                  className="input"
                />
              </Field>
              {start && end && (
                <p className="font-mono text-[10.5px] text-[var(--text-muted)]">
                  First: {start.toLocaleString('en-AU', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })} →{' '}
                  {end.toLocaleString('en-AU', { weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false })}
                  {resourceIds.length > 1 ? ' · Control Room + Floor' : ''}
                  {isRecurring && occurrences.length > 0 && (
                    <>
                      {' '}· {occurrences.length} occurrences total, last on{' '}
                      {occurrences[occurrences.length - 1].start.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </>
                  )}
                  {draft.liveTxStart && draft.liveTxEnd && ` · Live TX ${draft.liveTxStart}–${draft.liveTxEnd}`}
                </p>
              )}
              {noOccurrencesBanner}
              {conflictBanner}
            </div>
          )}

          {step === 2 && draft.template && (
            <div className="space-y-2">
              <p className="font-mono text-[9.5px] uppercase tracking-wide text-[var(--text-muted)]">
                Crew needed{isRecurring ? ' (applied to every occurrence)' : ''} — uncheck any role not needed for this booking
              </p>
              <div className="max-h-[220px] space-y-0.5 overflow-y-auto rounded-md bg-[var(--panel)] p-2">
                {draft.template.crew.map((c, i) => {
                  const excluded = draft.excludedCrewRoles.includes(c.role);
                  return (
                    <button
                      type="button"
                      key={i}
                      onClick={() => toggleCrewRole(c.role)}
                      className="flex w-full items-center justify-between gap-2 rounded px-1 py-1 text-left transition hover:bg-[var(--panel-raised)]"
                    >
                      <span className="flex items-center gap-2 text-[11px]" style={{ color: excluded ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                        <span
                          className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border"
                          style={{
                            borderColor: excluded ? 'var(--line)' : 'var(--tally)',
                            backgroundColor: excluded ? 'transparent' : 'var(--tally)',
                          }}
                        >
                          {!excluded && <Check size={10} color="var(--ink)" />}
                        </span>
                        <span style={{ textDecoration: excluded ? 'line-through' : 'none' }}>
                          {c.count > 1 ? `${c.count}× ` : ''}
                          {c.role}
                        </span>
                      </span>
                      <span className="font-mono text-[11px]" style={{ color: excluded ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                        ${c.totalCost}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between border-t border-[var(--line)] pt-2 text-[12px]">
                <span className="text-[var(--text-muted)]">Cost per occurrence</span>
                <span className="font-mono font-medium text-[var(--text-primary)]">
                  ${includedCrewCost.toLocaleString()}
                </span>
              </div>
              {isRecurring && (
                <div className="flex justify-between text-[12px]">
                  <span className="text-[var(--text-muted)]">
                    Projected total ({occurrences.length} × ${includedCrewCost.toLocaleString()})
                  </span>
                  <span className="font-mono font-medium text-[var(--tally)]">
                    ${(includedCrewCost * occurrences.length).toLocaleString()}
                  </span>
                </div>
              )}
              {noOccurrencesBanner}
              {conflictBanner}
            </div>
          )}
          {step === 2 && !draft.template && (
            <div className="space-y-2">
              <p className="text-[12px] text-[var(--text-muted)]">
                No show template selected — this will be created as a custom booking with no crew cost estimate.
              </p>
              {isRecurring && (
                <p className="text-[12px] text-[var(--text-muted)]">Will create {occurrences.length} occurrences.</p>
              )}

              <p className="font-mono text-[9.5px] uppercase tracking-wide text-[var(--text-muted)]">
                Crew needed — pick which roles this booking needs
              </p>
              <div className="flex flex-wrap gap-1.5">
                {allSkillCodes.map((skill) => {
                  const active = draft.customCrew.some((c) => c.skill === skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleCustomCrewSkill(skill)}
                      className="flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[10.5px] transition"
                      style={{
                        borderColor: active ? skillColor[skill] : 'var(--line)',
                        backgroundColor: active ? `${skillColor[skill]}22` : 'transparent',
                        color: active ? skillColor[skill] : 'var(--text-muted)',
                      }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: skillColor[skill] }} />
                      {skillLabel[skill]}
                    </button>
                  );
                })}
              </div>

              {draft.customCrew.length > 0 && (
                <div className="space-y-0.5 rounded-md bg-[var(--panel)] p-2">
                  {draft.customCrew.map((c) => (
                    <div key={c.skill} className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1.5 text-[var(--text-primary)]">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: skillColor[c.skill] }} />
                        {skillLabel[c.skill]}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => adjustCustomCrewCount(c.skill, -1)}
                          className="flex h-5 w-5 items-center justify-center rounded border border-[var(--line)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          aria-label={`Decrease ${skillLabel[c.skill]} count`}
                        >
                          <Minus size={10} />
                        </button>
                        <span className="w-4 text-center font-mono text-[var(--text-primary)]">{c.count}</span>
                        <button
                          type="button"
                          onClick={() => adjustCustomCrewCount(c.skill, 1)}
                          className="flex h-5 w-5 items-center justify-center rounded border border-[var(--line)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          aria-label={`Increase ${skillLabel[c.skill]} count`}
                        >
                          <Plus size={10} />
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {noOccurrencesBanner}
              {conflictBanner}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--line)] px-4 py-3">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-1 rounded-md border border-[var(--line)] px-2.5 py-1.5 font-mono text-[10.5px] text-[var(--text-muted)] disabled:opacity-30"
          >
            <ChevronLeft size={12} /> Back
          </button>
          {step < 2 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 && !canProceedStep1}
              className="flex items-center gap-1 rounded-md px-3 py-1.5 font-mono text-[10.5px] font-medium disabled:opacity-30"
              style={{ backgroundColor: `${statusColor.ok}22`, color: statusColor.ok }}
            >
              Next <ChevronRight size={12} />
            </button>
          ) : (
            <button
              onClick={() => canSubmit && onSubmit(draft, resourceIds)}
              disabled={!canSubmit}
              className="rounded-md px-3 py-1.5 font-mono text-[10.5px] font-medium disabled:opacity-30"
              style={{ backgroundColor: `${statusColor.ok}22`, color: statusColor.ok }}
            >
              {isNoteOnly ? 'Propose booking' : 'Create booking'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[9.5px] uppercase tracking-wide text-[var(--text-muted)]">{label}</span>
      {children}
    </label>
  );
}
