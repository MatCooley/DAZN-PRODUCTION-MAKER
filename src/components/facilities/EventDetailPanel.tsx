import { X, Link2, Repeat, Users } from 'lucide-react';
import type { ChangeRequest, FacilityEvent } from '../../lib/facilityTypes';
import { facilityEventLabel, facilityEventStyle } from '../../lib/facilityVisuals';
import { showLibrary } from '../../lib/showLibrary';
import { toLocalDateString } from '../../lib/dateUtils';

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
  pendingRequest,
  anchorRect,
  onClose,
}: {
  event: FacilityEvent;
  resourceName: string;
  conflicts: FacilityEvent[];
  pendingRequest?: ChangeRequest;
  anchorRect: DOMRect | null;
  onClose: () => void;
}) {
  const style = facilityEventStyle[event.eventType];
  const show = event.showKey ? showLibrary.find((s) => s.key === event.showKey) : undefined;
  const currency = (n: number) => `$${n.toLocaleString('en-AU', { maximumFractionDigits: 0 })}`;

  // Anchor the panel next to the clicked block, flipping to whichever
  // side has room, and clamping so it never renders off-screen —
  // rather than always parking in a fixed corner regardless of where
  // you actually clicked.
  const PANEL_WIDTH = 300;
  const MARGIN = 10;
  let left: number;
  let top: number;
  if (anchorRect) {
    const preferRight = anchorRect.right + MARGIN + PANEL_WIDTH <= window.innerWidth;
    left = preferRight ? anchorRect.right + MARGIN : anchorRect.left - PANEL_WIDTH - MARGIN;
    left = Math.max(MARGIN, Math.min(left, window.innerWidth - PANEL_WIDTH - MARGIN));
    top = Math.max(MARGIN, Math.min(anchorRect.top, window.innerHeight - MARGIN - 120));
  } else {
    left = window.innerWidth - PANEL_WIDTH - 16;
    top = 16;
  }

  return (
    <div
      className="fixed z-30 w-[300px] rounded-lg border border-[var(--line)] bg-[var(--panel-raised)] p-3.5 shadow-2xl"
      style={{ left, top, maxHeight: 'calc(100vh - 20px)', overflowY: 'auto' }}
    >
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
        {toLocalDateString(new Date(event.start)) !== toLocalDateString(new Date(event.end)) && (
          <p className="text-[10px] italic text-[var(--tally)]">Spans past midnight into the next day</p>
        )}
        <Row label="Status" value={event.status} />
        {event.production && <Row label="Production" value={event.production} />}
        {event.client && <Row label="Client" value={event.client} />}
        <Row label="Event ID" value={event.id} mono />
      </dl>

      {(event.linkedBookingSetId || event.seriesId || event.bookingGroupId) && (
        <div className="mt-2.5 space-y-1 border-t border-[var(--line)] pt-2.5">
          {event.linkedBookingSetId && (
            <p className="flex items-center gap-1.5 text-[10.5px] text-[var(--text-muted)]">
              <Link2 size={11} className="text-[var(--tally)]" /> Linked — moves together with its coupled resource
            </p>
          )}
          {event.seriesId && (
            <p className="flex items-center gap-1.5 text-[10.5px] text-[var(--text-muted)]">
              <Repeat size={11} className="text-[var(--tally)]" />
              Part of a recurring series{event.isModifiedOccurrence ? ' — diverged from template' : ''}
            </p>
          )}
          {event.bookingGroupId && (
            <p className="flex items-center gap-1.5 text-[10.5px] text-[var(--text-muted)]">
              <Users size={11} className="text-[var(--tally)]" /> Shares this shift with another client/production code
            </p>
          )}
        </div>
      )}

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

      {show && (
        <div className="mt-3 space-y-2 border-t border-[var(--line)] pt-2.5">
          <p className="font-mono text-[9.5px] uppercase tracking-wide text-[var(--tally)]">
            Crew & cost (source: Studio_Staff_cost.xlsx)
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
            <span className="text-[var(--text-muted)]">Crew this booking</span>
            <span className="text-right text-[var(--text-primary)]">{show.crew.reduce((n, c) => n + c.count, 0)} people</span>
            <span className="text-[var(--text-muted)]">Booking cost</span>
            <span className="text-right text-[var(--text-primary)]">{currency(show.totalCrewCost)}</span>
            {show.episodes != null && (
              <>
                <span className="text-[var(--text-muted)]">Episodes / season</span>
                <span className="text-right text-[var(--text-primary)]">{show.episodes}</span>
              </>
            )}
            {show.seriesCost != null && (
              <>
                <span className="text-[var(--text-muted)]">Series cost</span>
                <span className="text-right text-[var(--text-primary)]">{currency(show.seriesCost)}</span>
              </>
            )}
          </div>
          <div className="max-h-[110px] space-y-0.5 overflow-y-auto rounded-md bg-[var(--panel)] p-1.5">
            {show.crew.map((c, i) => (
              <div key={i} className="flex justify-between text-[10px]">
                <span className="text-[var(--text-muted)]">
                  {c.count > 1 ? `${c.count}× ` : ''}{c.role}
                </span>
                <span className="font-mono text-[var(--text-primary)]">{currency(c.totalCost)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingRequest && (
        <div className="mt-3 rounded-md border border-[var(--signal-amber)]/40 bg-[var(--signal-amber)]/10 p-2">
          <p className="mb-1 font-mono text-[9.5px] uppercase tracking-wide text-[var(--signal-amber)]">
            Pending change request
          </p>
          <p className="text-[11px] text-[var(--text-primary)]">Proposed start: {fmt(pendingRequest.proposedStart)}</p>
          {pendingRequest.reason && (
            <p className="mt-0.5 text-[10.5px] italic text-[var(--text-muted)]">"{pendingRequest.reason}"</p>
          )}
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
