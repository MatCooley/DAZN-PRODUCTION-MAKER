import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, CalendarClock } from 'lucide-react';
import { resources, initialFacilityEvents, weekOf, weekStartISO } from '../../lib/facilityData';
import type { ChangeRequest, FacilityEvent, SimUser } from '../../lib/facilityTypes';
import { computeConflicts, overlaps, checkResourcesFree } from '../../lib/facilityLogic';
import { canEditDirectly, simUsers } from '../../lib/users';
import { TimeRuler } from './TimeRuler';
import { ResourceRow } from './ResourceRow';
import { EventDetailPanel } from './EventDetailPanel';
import { RoleSwitcher } from './RoleSwitcher';
import { NotificationBell } from './NotificationBell';
import { ShowMakerWizard, type BookingDraft } from './ShowMakerWizard';
import { statusColor } from '../../lib/visuals';

let reqSeq = 0;
const newRequestId = () => `cr-${++reqSeq}`;
let evSeq = 1000;
const newEventId = () => `fe-new-${++evSeq}`;
let linkSeq = 0;
const newLinkId = () => `link-new-${++linkSeq}`;

const DEMO_WEEK_ANCHOR = new Date(weekStartISO);

export function FacilitiesBoard() {
  const [events, setEvents] = useState<FacilityEvent[]>(initialFacilityEvents);
  const [selected, setSelected] = useState<FacilityEvent | null>(null);
  const [currentUser, setCurrentUser] = useState<SimUser>(simUsers[0]);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [weekAnchor, setWeekAnchor] = useState<Date>(DEMO_WEEK_ANCHOR);
  const [wizardOpen, setWizardOpen] = useState(false);

  const days = useMemo(() => weekOf(weekAnchor), [weekAnchor]);
  const weekStartMs = useMemo(() => new Date(`${days[0].date}T00:00:00`).getTime(), [days]);

  const conflicts = useMemo(() => computeConflicts(events), [events]);
  const resourcesById = useMemo(() => new Map(resources.map((r) => [r.id, r])), []);
  const eventsById = useMemo(() => new Map(events.map((e) => [e.id, e])), [events]);

  const conflictedIds = useMemo(() => new Set(Object.keys(conflicts)), [conflicts]);
  const conflictEventCount = conflictedIds.size;

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 3500);
  }

  function shiftWeek(deltaWeeks: number) {
    const next = new Date(weekAnchor);
    next.setDate(next.getDate() + deltaWeeks * 7);
    setWeekAnchor(next);
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

  const selectedConflicts = useMemo(() => {
    if (!selected) return [];
    const ids = conflicts[selected.id] ?? [];
    return events.filter((e) => ids.includes(e.id));
  }, [selected, conflicts, events]);

  const selectedPendingRequest = useMemo(
    () => (selected ? changeRequests.find((r) => r.targetEventId === selected.id && r.status === 'PENDING') : undefined),
    [selected, changeRequests]
  );

  const isCurrentWeekDemoWeek = days[0].date === weekOf(DEMO_WEEK_ANCHOR)[0].date;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--panel)]/60 px-4 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftWeek(-1)}
            className="flex h-6 w-6 items-center justify-center rounded border border-[var(--line)] text-[var(--text-muted)] hover:border-[var(--tally)]/60 hover:text-[var(--text-primary)]"
            aria-label="Previous week"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            onClick={() => shiftWeek(1)}
            className="flex h-6 w-6 items-center justify-center rounded border border-[var(--line)] text-[var(--text-muted)] hover:border-[var(--tally)]/60 hover:text-[var(--text-primary)]"
            aria-label="Next week"
          >
            <ChevronRight size={13} />
          </button>
          {!isCurrentWeekDemoWeek && (
            <button
              onClick={() => setWeekAnchor(DEMO_WEEK_ANCHOR)}
              className="flex items-center gap-1 rounded border border-[var(--line)] px-2 py-1 font-mono text-[9.5px] text-[var(--text-muted)] hover:border-[var(--tally)]/60 hover:text-[var(--text-primary)]"
            >
              <CalendarClock size={11} /> Jump to bookings
            </button>
          )}
          <p className="ml-1 text-[11px] text-[var(--text-muted)]">
            {canEditDirectly(currentUser.accessLevel)
              ? 'Drag to reschedule, or add a new booking. Click any block for details.'
              : "Note-only access — dragging or creating proposes a change for a supervisor to approve."}
          </p>
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

      <div className="min-h-0 flex-1 overflow-auto" onClick={() => setSelected(null)}>
        <div className="inline-block min-w-full">
          <div className="sticky top-0 z-20 flex bg-[var(--panel)]">
            <div className="sticky left-0 z-30 w-[200px] shrink-0 border-b border-r border-[var(--line)] bg-[var(--panel)]" />
            <TimeRuler days={days} />
          </div>
          {resources.map((r) => (
            <ResourceRow
              key={r.id}
              resource={r}
              events={events.filter((e) => e.resourceId === r.id && days.some((d) => e.start.startsWith(d.date)))}
              conflictIds={conflictedIds}
              weekStartMs={weekStartMs}
              checkValid={checkValid}
              onDrop={handleDrop}
              onClickEvent={(ev) => setSelected(ev)}
            />
          ))}
        </div>
      </div>

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
