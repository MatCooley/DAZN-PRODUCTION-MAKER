import { useMemo, useState } from 'react';
import { X, Check } from 'lucide-react';
import { bookingTargetOptions, resolveBookingResourceIds } from '../../lib/facilityData';
import type { FacilityEvent, BookingDraft } from '../../lib/facilityTypes';
import { statusColor } from '../../lib/visuals';
import { DatePicker } from './DatePicker';
import { toLocalDateString } from '../../lib/dateUtils';

function draftFromEvent(event: FacilityEvent, studio: string, selection: 'BOTH' | 'CR' | 'FL'): BookingDraft {
  const start = new Date(event.start);
  const end = new Date(event.end);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    template: null,
    studio,
    resourceSelection: selection,
    date: toLocalDateString(start),
    startTime: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
    durationHours: Math.max(0.25, (end.getTime() - start.getTime()) / 3_600_000),
    title: event.title ?? '',
    production: event.production ?? '',
    client: event.client ?? '',
    repeatDays: [],
    repeatWeeks: 1,
    excludedCrewRoles: event.excludedCrewRoles ?? [],
    customCrew: event.customCrew ?? [],
  };
}

export function EditBookingModal({
  event,
  studio,
  selection,
  isNoteOnly,
  checkFree,
  onClose,
  onSubmit,
}: {
  event: FacilityEvent;
  studio: string;
  selection: 'BOTH' | 'CR' | 'FL';
  isNoteOnly: boolean;
  checkFree: (resourceIds: string[], start: Date, end: Date) => { free: boolean; blockedBy: string[] };
  onClose: () => void;
  onSubmit: (draft: BookingDraft, resourceIds: string[]) => void;
}) {
  const [draft, setDraft] = useState<BookingDraft>(() => draftFromEvent(event, studio, selection));
  const targetOptions = useMemo(() => bookingTargetOptions(), []);

  const start = draft.date && draft.startTime ? new Date(`${draft.date}T${draft.startTime}:00`) : null;
  const end = start ? new Date(start.getTime() + draft.durationHours * 3_600_000) : null;
  const resourceIds = draft.studio ? resolveBookingResourceIds(draft.studio, draft.resourceSelection) : [];

  const freeCheck = start && end && resourceIds.length ? checkFree(resourceIds, start, end) : null;
  const canSubmit = !!draft.title && !!draft.studio && !!draft.date && !!draft.startTime && draft.durationHours > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-[480px] flex-col rounded-lg border border-[var(--line)] bg-[var(--panel-raised)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
          <h2 className="font-display text-[16px] font-semibold uppercase tracking-wide text-[var(--text-primary)]">
            Edit booking
          </h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          <Field label="Title">
            <input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} className="input" />
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
              {targetOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Date">
            <DatePicker value={draft.date} onChange={(dateStr) => setDraft((d) => ({ ...d, date: dateStr }))} />
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
                min={0.25}
                step={0.25}
                value={draft.durationHours}
                onChange={(e) => setDraft((d) => ({ ...d, durationHours: Number(e.target.value) }))}
                className="input"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Production">
              <input
                value={draft.production}
                onChange={(e) => setDraft((d) => ({ ...d, production: e.target.value }))}
                className="input"
              />
            </Field>
            <Field label="Client">
              <input value={draft.client} onChange={(e) => setDraft((d) => ({ ...d, client: e.target.value }))} className="input" />
            </Field>
          </div>

          {start && end && (
            <p className="font-mono text-[10.5px] text-[var(--text-muted)]">
              {start.toLocaleString('en-AU', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })} →{' '}
              {end.toLocaleString('en-AU', { weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false })}
            </p>
          )}

          {freeCheck && !freeCheck.free && (
            <div
              className="rounded-md border p-2 text-[11px]"
              style={{ borderColor: `${statusColor.breach}66`, backgroundColor: `${statusColor.breach}15`, color: statusColor.breach }}
            >
              ⚠ Conflicts with: {freeCheck.blockedBy.join(', ')}
              {isNoteOnly ? ' — you can still propose this, a supervisor will see the conflict.' : ' — resolve before saving.'}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--line)] px-4 py-3">
          <button
            onClick={onClose}
            className="rounded-md border border-[var(--line)] px-3 py-1.5 font-mono text-[10.5px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            Cancel
          </button>
          <button
            onClick={() => canSubmit && resourceIds.length > 0 && onSubmit(draft, resourceIds)}
            disabled={!canSubmit || resourceIds.length === 0}
            className="flex items-center gap-1 rounded-md px-3 py-1.5 font-mono text-[10.5px] font-medium disabled:opacity-30"
            style={{ backgroundColor: `${statusColor.ok}22`, color: statusColor.ok }}
          >
            <Check size={12} /> {isNoteOnly ? 'Propose changes' : 'Save changes'}
          </button>
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
