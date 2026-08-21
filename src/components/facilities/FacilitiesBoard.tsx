import { useMemo, useState } from 'react';
import { resources, initialFacilityEvents } from '../../lib/facilityData';
import type { FacilityEvent } from '../../lib/facilityTypes';
import { computeConflicts, isResourceAvailable, overlaps } from '../../lib/facilityLogic';
import { TimeRuler } from './TimeRuler';
import { ResourceRow } from './ResourceRow';
import { EventDetailPanel } from './EventDetailPanel';
import { statusColor } from '../../lib/visuals';

export function FacilitiesBoard() {
  const [events, setEvents] = useState<FacilityEvent[]>(initialFacilityEvents);
  const [selected, setSelected] = useState<FacilityEvent | null>(null);

  const conflicts = useMemo(() => computeConflicts(events), [events]);
  const resourcesById = useMemo(() => new Map(resources.map((r) => [r.id, r])), []);

  const conflictedIds = useMemo(() => new Set(Object.keys(conflicts)), [conflicts]);
  const conflictEventCount = conflictedIds.size;

  function checkValid(event: FacilityEvent, start: Date, end: Date): boolean {
    const resource = resourcesById.get(event.resourceId);
    if (!resource || !resource.isBookable) return false;
    // Valid if it doesn't overlap any OTHER blocking event on this resource.
    const others = events.filter((e) => e.resourceId === event.resourceId && e.id !== event.id && e.isBlocking && e.status !== 'CANCELLED');
    return !others.some((o) => overlaps(new Date(o.start), new Date(o.end), start, end));
  }

  function handleCommit(id: string, start: Date, end: Date) {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, start: start.toISOString().slice(0, 19), end: end.toISOString().slice(0, 19) } : e))
    );
    setSelected((prev) => (prev && prev.id === id ? { ...prev, start: start.toISOString().slice(0, 19), end: end.toISOString().slice(0, 19) } : prev));
  }

  const selectedConflicts = useMemo(() => {
    if (!selected) return [];
    const ids = conflicts[selected.id] ?? [];
    return events.filter((e) => ids.includes(e.id));
  }, [selected, conflicts, events]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--panel)]/60 px-4 py-2">
        <p className="text-[11px] text-[var(--text-muted)]">
          Drag a booking, hold, maintenance or blackout block to reschedule — it validates against every other
          blocking event on that resource live. Click any block for details.
        </p>
        <div className="flex items-center gap-4 font-mono text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusColor.breach }} />
            <span style={{ color: conflictEventCount > 0 ? statusColor.breach : 'var(--text-muted)' }}>
              {Math.round(conflictEventCount)} conflict{conflictEventCount === 1 ? '' : 's'}
            </span>
          </span>
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
              onCommit={handleCommit}
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
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

// re-export for typing convenience elsewhere
export { isResourceAvailable };
