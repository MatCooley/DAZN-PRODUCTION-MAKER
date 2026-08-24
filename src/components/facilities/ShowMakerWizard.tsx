import { useMemo, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Search, Check } from 'lucide-react';
import { showLibrary, type ShowTemplate } from '../../lib/showLibrary';
import { studioResourceMap, resources } from '../../lib/facilityData';
import { statusColor } from '../../lib/visuals';
import { DatePicker } from './DatePicker';
import type { BookingDraft } from '../../lib/facilityTypes';
import { generateOccurrences } from '../../lib/facilityLogic';

const WEEKDAY_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function defaultDuration(t: ShowTemplate | null): number {
  if (!t || t.crew.length === 0) return 4;
  return Math.max(...t.crew.map((c) => c.shiftHours));
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
  const [draft, setDraft] = useState<BookingDraft>({
    template: null,
    studio: '',
    date: '2026-08-24',
    startTime: '18:00',
    durationHours: 4,
    title: '',
    production: '',
    client: '',
    repeatDays: [1], // Monday — matches the default date above
    repeatWeeks: 1,
  });

  const filteredTemplates = useMemo(() => {
    const studioBound = showLibrary.filter((s) => s.studio);
    if (!query) return studioBound;
    return studioBound.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()));
  }, [query]);

  function pickTemplate(t: ShowTemplate | null) {
    setDraft((d) => {
      const anchorDay = new Date(`${d.date}T00:00:00`).getDay();
      return {
        ...d,
        template: t,
        studio: t?.studio ?? d.studio,
        durationHours: defaultDuration(t),
        title: t?.name ?? d.title,
        production: t?.name ?? d.production,
        repeatDays: [anchorDay],
        repeatWeeks: t?.episodes ?? d.repeatWeeks,
      };
    });
    setStep(1);
  }

  function toggleDay(dow: number) {
    setDraft((d) => {
      const has = d.repeatDays.includes(dow);
      const next = has ? d.repeatDays.filter((x) => x !== dow) : [...d.repeatDays, dow].sort();
      // Always keep at least the anchor date's own weekday selected.
      const anchorDow = new Date(`${d.date}T00:00:00`).getDay();
      return { ...d, repeatDays: next.length > 0 ? next : [anchorDow] };
    });
  }

  const occurrences = useMemo(() => generateOccurrences(draft), [draft]);
  const resourceIds = draft.studio ? studioResourceMap[draft.studio] ?? [] : [];
  const start = occurrences[0]?.start ?? null;
  const end = occurrences[0]?.end ?? null;

  const occurrenceChecks = useMemo(
    () => occurrences.map((o) => ({ ...o, check: resourceIds.length ? checkFree(resourceIds, o.start, o.end) : null })),
    [occurrences, resourceIds, checkFree]
  );
  const conflictingOccurrences = occurrenceChecks.filter((o) => o.check && !o.check.free);

  const studioOptions = Object.keys(studioResourceMap);
  const canProceedStep1 = !!draft.studio && !!draft.date && !!draft.startTime && draft.durationHours > 0;
  const canSubmit = canProceedStep1 && !!draft.title;
  const isRecurring = occurrences.length > 1;

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
              <Field label="Studio">
                <select
                  value={draft.studio}
                  onChange={(e) => setDraft((d) => ({ ...d, studio: e.target.value }))}
                  className="input"
                >
                  <option value="">Select a studio…</option>
                  {studioOptions.map((s) => (
                    <option key={s} value={s}>
                      Studio {s} {resources.find((r) => r.id === studioResourceMap[s][0])?.name.includes('Floor') ? '' : ''}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Date">
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
                      return { ...d, date: dateStr, repeatDays };
                    })
                  }
                />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Start time">
                  <input
                    type="time"
                    value={draft.startTime}
                    onChange={(e) => setDraft((d) => ({ ...d, startTime: e.target.value }))}
                    className="input"
                  />
                </Field>
                <Field label="Duration (h)">
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={draft.durationHours}
                    onChange={(e) => setDraft((d) => ({ ...d, durationHours: Number(e.target.value) }))}
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
                  min={1}
                  max={52}
                  value={draft.repeatWeeks}
                  onChange={(e) => setDraft((d) => ({ ...d, repeatWeeks: Math.max(1, Number(e.target.value)) }))}
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
                </p>
              )}
              {conflictingOccurrences.length > 0 && (
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
              )}
            </div>
          )}

          {step === 2 && draft.template && (
            <div className="space-y-2">
              <p className="font-mono text-[9.5px] uppercase tracking-wide text-[var(--text-muted)]">
                Crew pulled from show template{isRecurring ? ' (applied to every occurrence)' : ''}
              </p>
              <div className="max-h-[220px] space-y-0.5 overflow-y-auto rounded-md bg-[var(--panel)] p-2">
                {draft.template.crew.map((c, i) => (
                  <div key={i} className="flex justify-between text-[11px]">
                    <span className="text-[var(--text-muted)]">
                      {c.count > 1 ? `${c.count}× ` : ''}
                      {c.role}
                    </span>
                    <span className="font-mono text-[var(--text-primary)]">${c.totalCost}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between border-t border-[var(--line)] pt-2 text-[12px]">
                <span className="text-[var(--text-muted)]">Cost per occurrence</span>
                <span className="font-mono font-medium text-[var(--text-primary)]">
                  ${draft.template.totalCrewCost.toLocaleString()}
                </span>
              </div>
              {isRecurring && (
                <div className="flex justify-between text-[12px]">
                  <span className="text-[var(--text-muted)]">
                    Projected total ({occurrences.length} × ${draft.template.totalCrewCost.toLocaleString()})
                  </span>
                  <span className="font-mono font-medium text-[var(--tally)]">
                    ${(draft.template.totalCrewCost * occurrences.length).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}
          {step === 2 && !draft.template && (
            <div className="space-y-1">
              <p className="text-[12px] text-[var(--text-muted)]">
                No show template selected — this will be created as a custom booking with no crew cost estimate.
              </p>
              {isRecurring && (
                <p className="text-[12px] text-[var(--text-muted)]">Will create {occurrences.length} occurrences.</p>
              )}
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
