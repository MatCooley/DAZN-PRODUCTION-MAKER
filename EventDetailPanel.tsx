import { X } from 'lucide-react';
import type { FacilityEvent } from '../../lib/facilityTypes';
import { facilityEventLabel, facilityEventStyle } from '../../lib/facilityVisuals';

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('en-AU', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function EventDetailPanel({
  event,
  resourceName,
  conflicts,
  onClose,
}: {
  event: FacilityEvent;
  resourceName: string;
  conflicts: FacilityEvent[];
  onClose: () => void;
}) {
  const style = facilityEventStyle[event.eventType];

  return (
    <div className="absolute right-3 top-3 z-30 w-[280px] rounded-lg border border-[var(--line)] bg-[var(--panel-raised)] p-3.5 shadow-xl">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: style.border }} />
          <span className="font-mono text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
            {facilityEventLabel[event.eventType]}
          </span>
        </div>
        <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]" aria-label="Close">
          <X size={14} />
        </button>
      </div>

      <h3 className="mb-2 font-display text-[15px] font-semibold text-[var(--text-primary)]">
        {event.title ?? facilityEventLabel[event.eventType]}
      </h3>

      <dl className="space-y-1.5 text-[11.5px]">
        <Row label="Resource" value={resourceName} />
        <Row label="Start" value={fmt(event.start)} mono />
        <Row label="End" value={fmt(event.end)} mono />
        <Row label="Status" value={event.status} />
        {event.production && <Row label="Production" value={event.production} />}
        {event.client && <Row label="Client" value={event.client} />}
        <Row label="Event ID" value={event.id} mono />
      </dl>

      {conflicts.length > 0 && (
        <div className="mt-3 rounded-md border border-[var(--signal-red)]/40 bg-[var(--signal-red)]/10 p-2">
          <p className="mb-1 font-mono text-[9.5px] uppercase tracking-wide text-[var(--signal-red)]">
            Conflicts with {conflicts.length}
          </p>
          {conflicts.map((c) => (
            <p key={c.id} className="truncate text-[11px] text-[var(--text-primary)]">
              {c.title ?? c.eventType} · {fmt(c.start)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-[var(--text-muted)]">{label}</dt>
      <dd className={`truncate text-right text-[var(--text-primary)] ${mono ? 'font-mono text-[10.5px]' : ''}`}>
        {value}
      </dd>
    </div>
  );
}
