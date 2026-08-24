import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, CalendarClock } from 'lucide-react';
import { resources, initialFacilityEvents, weekOf, weekStartISO } from '../../lib/facilityData';
import type { ChangeRequest, FacilityEvent, SimUser } from '../../lib/facilityTypes';
import { computeConflicts, overlaps, checkResourcesFree } from '../../lib/facilityLogic';
import { canEditDirectly, simUsers } from '../../lib/users';
import {
  type ViewMode,
  type DateBucket,
  monthDayBuckets,
  quarterDayBuckets,
  yearMonthBuckets,
  periodLabel,
  shiftAnchor,
} from '../../lib/dateRanges';
import { TimeRuler } from './TimeRuler';
import { ResourceRow } from './ResourceRow';
import { DensityGrid } from './DensityGrid';
import { ViewModeSwitcher } from './ViewModeSwitcher';
import { EventDetailPanel } from './EventDetailPanel';
import { RoleSwitcher } from './RoleSwitcher';
import { NotificationBell } from './NotificationBell';
import { ShowMakerWizard, type BookingDraft } from './ShowMakerWizard';
import { statusColor } from '../../lib/visuals';
import { DEFAULT_PX_PER_HOUR, MIN_PX_PER_HOUR, MAX_PX_PER_HOUR } from '../../lib/facilityVisuals';

let reqSeq = 0;
const newRequestId = () => `cr-${++reqSeq}`;
let evSeq = 1000;
const newEventId = () => `fe-new-${++evSeq}`;
let linkSeq = 0;
const newLinkId = () => `link-new-${++linkSeq}`;

const DEMO_ANCHOR = new Date(weekStartISO);

export function FacilitiesBoard() {
  const [events, setEvents] = useState<FacilityEvent[]>(initialFacilityEvents);
  const [selected, setSelected] = useState<FacilityEvent | null>(null);
  const [currentUser, setCurrentUser] = useState<SimUser>(simUsers[0]);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [anchor, setAnchor] = useState<Date>(DEMO_ANCHOR);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [wizardOpen, setWizardOpen] = useState(false);

  // Fit exactly 7 days into the visible width so the whole week is
  // visible without horizontal scrolling by default — recomputed on
  // resize. Falls back to DEFAULT_PX_PER_HOUR (and normal scrolling)
  // if the window is too narrow to keep hours legible.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pxPerHour, setPxPerHour] = useState(DEFAULT_PX_PER_HOUR);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const LABEL_COLUMN_WIDTH = 200;

    function recalc() {
      const available = el!.clientWidth - LABEL_COLUMN_WIDTH;
      const fit = available / (7 * 24);
      setPxPerHour(Math.min(MAX_PX_PER_HOUR, Math.max(MIN_PX_PER_HOUR, fit)));
    }

    recalc();
    const ro = new ResizeObserver(recalc);
    ro.observe(el);
    return () => ro.disconnect();
  }, [viewMode]);

  const days = useMemo(() => weekOf(anchor), [anchor]);
  const weekStartMs = useMemo(() => new Date(`${days[0].date}T00:00:00`).getTime(), [days]);

  const buckets: DateBucket[] = useMemo(() => {
    if (viewMode === 'month') return monthDayBuckets(anchor);
    if (viewMode === 'quarter') return quarterDayBuckets(anchor);
    if (viewMode === 'year') return yearMonthBuckets(anchor);
    return [];
  }, [viewMode, anchor]);

  const cellWidth = viewMode === 'month' ? 30 : viewMode === 'quarter' ? 11 : 72;

  const conflicts = useMemo(() => computeConflicts(events), [events]);
  const resourcesById = useMemo(() => new Map(resources.map((r) => [r.id, r])), []);
  const eventsById = useMemo(() => new Map(events.map((e) => [e.id, e])), [events]);

  const conflictedIds = useMemo(() => new Set(Object.keys(conflicts)), [conflicts]);
  const conflictEventCount = conflictedIds.size;

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 3500);
  }

  function checkValid(event: FacilityEvent, start: Date, end: Date): boolean {
    const resource = resourcesById.get(event.resourceId);
    if (!resource || !resource.isBookable) return false;
    const others = events.filter(
      (e) =>
        e.resourceId === event.resourceId &&
        e.id !== event.id &&
        e.isBlocking &&
        e.status !== 'CANCELLED' &&
        !(e.bookingGroupId && event.bookingGroupId && e.bookingGroupId === event.bookingGroupId)
    );
    return !others.some((o) => overlaps(new Date(o.start), new Date(o.end), start, end));
  }

  function commitMove(id: string, start: Date, _end: Date, cascadeLinked: boolean) {
    const primary = eventsById.get(id);
    if (!primary) return;
    const deltaMs = start.getTime() - new Date(primary.start).getTime();

    const idsToMove = new Set([id]);
    if (cascadeLinked && primary.linkedBookingSetId) {
      for (const e of events) {
        if (e.linkedBookingSetId === primary.linkedBookingSetId) idsToMove.add(e.id);
      }
    }

    for (const moveId of idsToMove) {
      const ev = eventsById.get(moveId);
      if (!ev) continue;
      const newStart = new Date(new Date(ev.start).getTime() + deltaMs);
      const newEnd = new Date(new Date(ev.end).getTime() + deltaMs);
      if (!checkValid(ev, newStart, newEnd)) {
        showToast(`Move blocked — would conflict on ${resourcesById.get(ev.resourceId)?.name ?? 'a linked resource'}`);
        return;
      }
    }

    setEvents((prev) =>
      prev.map((e) => {
        if (!idsToMove.has(e.id)) return e;
        const newStart = new Date(new Date(e.start).getTime() + deltaMs);
        const newEnd = new Date(new Date(e.end).getTime() + deltaMs);
        return {
          ...e,
          start: newStart.toISOString().slice(0, 19),
          end: newEnd.toISOString().slice(0, 19),
          isModifiedOccurrence: e.seriesId ? true : e.isModifiedOccurrence,
        };
      })
    );

    if (idsToMove.size > 1) {
      showToast(`Moved ${idsToMove.size} linked bookings together`);
    }
  }

  function handleDrop(id: string, start: Date, end: Date, valid: boolean) {
    const event = eventsById.get(id);
    if (!event) return;

    if (canEditDirectly(currentUser.accessLevel)) {
      if (!valid) {
        showToast('Move rejected — conflicts with another blocking event');
        return;
      }
      commitMove(id, start, end, true);
      return;
    }

    const request: ChangeRequest = {
      id: newRequestId(),
      requestType: 'MOVE',
      targetEventId: id,
      requestedById: currentUser.id,
      proposedStart: start.toISOString().slice(0, 19),
      proposedEnd: end.toISOString().slice(0, 19),
      status: 'PENDING',
      wasValidAtRequestTime: valid,
      createdAt: new Date().toISOString(),
    };
    setChangeRequests((prev) => [...prev, request]);
    showToast(`Change proposed for "${event.title ?? event.eventType}" — awaiting approval`);
  }

  function buildNewEvents(draft: BookingDraft, resourceIds: string[]): FacilityEvent[] {
    const start = new Date(`${draft.date}T${draft.startTime}:00`);
    const end = new Date(start.getTime() + draft.durationHours * 3_600_000);
    const linkId = resourceIds.length > 1 ? newLinkId() : undefined;
    return resourceIds.map((resourceId) => ({
      id: newEventId(),
      resourceId,
      eventType: 'BOOKING',
      isBlocking: true,
      start: start.toISOString().slice(0, 19),
      end: end.toISOString().slice(0, 19),
      status: 'CONFIRMED',
      title: draft.title,
      production: draft.production || undefined,
      client: draft.client || undefined,
      showKey: draft.template?.key,
      linkedBookingSetId: linkId,
    }));
  }

  function handleWizardSubmit(draft: BookingDraft, resourceIds: string[]) {
    const start = new Date(`${draft.date}T${draft.startTime}:00`);
    const end = new Date(start.getTime() + draft.durationHours * 3_600_000);
    const freeCheck = checkResourcesFree(resourceIds, start, end, events);

    if (canEditDirectly(currentUser.accessLevel)) {
      if (!freeCheck.free) {
        showToast(`Booking blocked — conflicts with ${freeCheck.blockedBy.join(', ')}`);
        return;
      }
      const newEvents = buildNewEvents(draft, resourceIds);
      setEvents((prev) => [...prev, ...newEvents]);
      showToast(`Created "${draft.title}"${resourceIds.length > 1 ? ' (Control Room + Floor)' : ''}`);
      setWizardOpen(false);
      return;
    }

    const request: ChangeRequest = {
      id: newRequestId(),
      requestType: 'CREATE',
      requestedById: currentUser.id,
      proposedStart: start.toISOString().slice(0, 19),
      proposedEnd: end.toISOString().slice(0, 19),
      status: 'PENDING',
      wasValidAtRequestTime: freeCheck.free,
      createdAt: new Date().toISOString(),
      proposedResourceIds: resourceIds,
      proposedTitle: draft.title,
      proposedProduction: draft.production || undefined,
      proposedClient: draft.client || undefined,
      proposedShowKey: draft.template?.key,
    };
    setChangeRequests((prev) => [...prev, request]);
    showToast(`"${draft.title}" proposed — awaiting approval`);
    setWizardOpen(false);
  }

  function handleApprove(requestId: string) {
    const req = changeRequests.find((r) => r.id === requestId);
    if (!req) return;

    if (req.requestType === 'MOVE' && req.targetEventId) {
      commitMove(req.targetEventId, new Date(req.proposedStart), new Date(req.proposedEnd), false);
    } else if (req.requestType === 'CREATE' && req.proposedResourceIds) {
      const linkId = req.proposedResourceIds.length > 1 ? newLinkId() : undefined;
      const newEvents: FacilityEvent[] = req.proposedResourceIds.map((resourceId) => ({
        id: newEventId(),
        resourceId,
        eventType: 'BOOKING',
        isBlocking: true,
        start: req.proposedStart,
        end: req.proposedEnd,
        status: 'CONFIRMED',
        title: req.proposedTitle,
        production: req.proposedProduction,
        client: req.proposedClient,
        showKey: req.proposedShowKey,
        linkedBookingSetId: linkId,
      }));
      setEvents((prev) => [...prev, ...newEvents]);
      showToast(`Approved and created "${req.proposedTitle}"`);
    }

    setChangeRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'APPROVED', reviewedById: currentUser.id } : r))
    );
  }

  function handleReject(requestId: string) {
    setChangeRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'REJECTED', reviewedById: currentUser.id } : r))
    );
  }

  function handleBucketClick(bucket: DateBucket) {
    if (viewMode === 'year') {
      setAnchor(bucket.start);
      setViewMode('month');
    } else {
      setAnchor(bucket.start);
      setViewMode('week');
    }
  }

  const selectedConflicts = useMemo(() => {
    if (!selected) return [];
    const ids = conflicts[selected.id] ?? [];
    return events.filter((e) => ids.includes(e.id));
  }, [selected, conflicts, events]);

  const selectedPendingRequest = useMemo(
    () => (selected ? changeRequests.find((r) => r.targetEventId === selected.id && r.status === 'PENDING') : undefined),
    [selected, changeRequests]
  );

  const isOnDemoPeriod = viewMode === 'week' && days[0].date === weekOf(DEMO_ANCHOR)[0].date;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-y-2 border-b border-[var(--line)] bg-[var(--panel)]/60 px-4 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAnchor((a) => shiftAnchor(viewMode, a, -1))}
            className="flex h-6 w-6 items-center justify-center rounded border border-[var(--line)] text-[var(--text-muted)] hover:border-[var(--tally)]/60 hover:text-[var(--text-primary)]"
            aria-label="Previous period"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            onClick={() => setAnchor((a) => shiftAnchor(viewMode, a, 1))}
            className="flex h-6 w-6 items-center justify-center rounded border border-[var(--line)] text-[var(--text-muted)] hover:border-[var(--tally)]/60 hover:text-[var(--text-primary)]"
            aria-label="Next period"
          >
            <ChevronRight size={13} />
          </button>
          <span className="ml-1 font-display text-[13px] font-semibold uppercase tracking-wide text-[var(--tally)]">
            {periodLabel(viewMode, anchor, days)}
          </span>
          <ViewModeSwitcher mode={viewMode} onChange={setViewMode} />
          {!isOnDemoPeriod && (
            <button
              onClick={() => {
                setAnchor(DEMO_ANCHOR);
                setViewMode('week');
              }}
              className="flex items-center gap-1 rounded border border-[var(--line)] px-2 py-1 font-mono text-[9.5px] text-[var(--text-muted)] hover:border-[var(--tally)]/60 hover:text-[var(--text-primary)]"
            >
              <CalendarClock size={11} /> Jump to bookings
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWizardOpen(true)}
            className="flex items-center gap-1 rounded-md border border-[var(--tally)]/50 bg-[var(--tally)]/10 px-2.5 py-1.5 font-mono text-[10.5px] text-[var(--tally)] transition hover:bg-[var(--tally)]/20"
          >
            <Plus size={12} /> New booking
          </button>
          <span className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusColor.breach }} />
            <span style={{ color: conflictEventCount > 0 ? statusColor.breach : 'var(--text-muted)' }}>
              {conflictEventCount} conflict{conflictEventCount === 1 ? '' : 's'}
            </span>
          </span>
          {canEditDirectly(currentUser.accessLevel) && (
            <NotificationBell
              requests={changeRequests}
              eventsById={eventsById}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          )}
          <RoleSwitcher currentUser={currentUser} onChange={setCurrentUser} />
        </div>
      </div>

      {viewMode === 'week' ? (
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto" onClick={() => setSelected(null)}>
          <div className="inline-block min-w-full">
            <div className="sticky top-0 z-20 flex bg-[var(--panel)]">
              <div className="sticky left-0 z-30 w-[200px] shrink-0 border-b border-r border-[var(--line)] bg-[var(--panel)]" />
              <TimeRuler days={days} pxPerHour={pxPerHour} />
            </div>
            {resources.map((r) => (
              <ResourceRow
                key={r.id}
                resource={r}
                events={events.filter((e) => e.resourceId === r.id && days.some((d) => e.start.startsWith(d.date)))}
                conflictIds={conflictedIds}
                weekStartMs={weekStartMs}
                pxPerHour={pxPerHour}
                checkValid={checkValid}
                onDrop={handleDrop}
                onClickEvent={(ev) => setSelected(ev)}
              />
            ))}
          </div>
        </div>
      ) : (
        <DensityGrid
          resources={resources}
          buckets={buckets}
          events={events}
          conflictedIds={conflictedIds}
          cellWidth={cellWidth}
          onCellClick={handleBucketClick}
        />
      )}

      {selected && (
        <EventDetailPanel
          event={selected}
          resourceName={resourcesById.get(selected.resourceId)?.name ?? selected.resourceId}
          conflicts={selectedConflicts}
          pendingRequest={selectedPendingRequest}
          onClose={() => setSelected(null)}
        />
      )}

      {wizardOpen && (
        <ShowMakerWizard
          isNoteOnly={!canEditDirectly(currentUser.accessLevel)}
          checkFree={(resourceIds, start, end) => checkResourcesFree(resourceIds, start, end, events)}
          onClose={() => setWizardOpen(false)}
          onSubmit={handleWizardSubmit}
        />
      )}

      {toast && (
        <div className="absolute bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-md border border-[var(--line)] bg-[var(--panel-raised)] px-3 py-2 text-[11.5px] text-[var(--text-primary)] shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
