import { useMemo, useState } from 'react';
import { resources, initialFacilityEvents } from '../../lib/facilityData';
import type { ChangeRequest, FacilityEvent, SimUser } from '../../lib/facilityTypes';
import { computeConflicts, overlaps } from '../../lib/facilityLogic';
import { canEditDirectly, simUsers } from '../../lib/users';
import { TimeRuler } from './TimeRuler';
import { ResourceRow } from './ResourceRow';
import { EventDetailPanel } from './EventDetailPanel';
import { RoleSwitcher } from './RoleSwitcher';
import { NotificationBell } from './NotificationBell';
import { statusColor } from '../../lib/visuals';

let reqSeq = 0;
const newRequestId = () => `cr-${++reqSeq}`;

export function FacilitiesBoard() {
  const [events, setEvents] = useState<FacilityEvent[]>(initialFacilityEvents);
  const [selected, setSelected] = useState<FacilityEvent | null>(null);
  const [currentUser, setCurrentUser] = useState<SimUser>(simUsers[0]);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [toast, setToast] = useState<string | null>(null);

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

    // Validate every member of the moving set against its own resource
    // before committing any of them — all-or-nothing.
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

    // NOTE_ONLY / READ_ONLY: never move directly — always propose.
    const request: ChangeRequest = {
      id: newRequestId(),
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

  function handleApprove(requestId: string) {
    const req = changeRequests.find((r) => r.id === requestId);
    if (!req) return;
    commitMove(req.targetEventId, new Date(req.proposedStart), new Date(req.proposedEnd), false);
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

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--panel)]/60 px-4 py-2">
        <p className="text-[11px] text-[var(--text-muted)]">
          {canEditDirectly(currentUser.accessLevel)
            ? 'Drag a block to reschedule — linked Control Room + Floor pairs move together. Click any block for details.'
            : "You have note-only access — dragging a block proposes a change for a supervisor to approve, it won't move directly."}
        </p>
        <div className="flex items-center gap-3">
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
            <TimeRuler />
          </div>
          {resources.map((r) => (
            <ResourceRow
              key={r.id}
              resource={r}
              events={events.filter((e) => e.resourceId === r.id)}
              conflictIds={conflictedIds}
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

      {toast && (
        <div className="absolute bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-md border border-[var(--line)] bg-[var(--panel-raised)] px-3 py-2 text-[11.5px] text-[var(--text-primary)] shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
