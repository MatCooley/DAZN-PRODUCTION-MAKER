import { useState } from 'react';
import { Bell, Check, X } from 'lucide-react';
import type { ChangeRequest, FacilityEvent, SimUser } from '../../lib/facilityTypes';
import { simUsers } from '../../lib/users';
import { statusColor } from '../../lib/visuals';

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-AU', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function NotificationBell({
  requests,
  eventsById,
  onApprove,
  onReject,
}: {
  requests: ChangeRequest[];
  eventsById: Map<string, FacilityEvent>;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const pending = requests.filter((r) => r.status === 'PENDING');
  const usersById = new Map<string, SimUser>(simUsers.map((u) => [u.id, u]));

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-7 w-7 items-center justify-center rounded-md border border-[var(--line)] text-[var(--text-muted)] transition hover:border-[var(--tally)]/60 hover:text-[var(--text-primary)]"
        aria-label="Change requests"
      >
        <Bell size={13} />
        {pending.length > 0 && (
          <span
            className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 font-mono text-[9px] font-bold text-[var(--ink)]"
            style={{ backgroundColor: statusColor.warning }}
          >
            {pending.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-40 w-[300px] rounded-lg border border-[var(--line)] bg-[var(--panel-raised)] p-2 shadow-xl">
          <p className="mb-1.5 px-1 font-mono text-[9.5px] uppercase tracking-wide text-[var(--text-muted)]">
            {pending.length === 0 ? 'No pending change requests' : `${pending.length} pending change request${pending.length === 1 ? '' : 's'}`}
          </p>
          <div className="max-h-[280px] space-y-1.5 overflow-y-auto">
            {pending.map((r) => {
              const event = r.targetEventId ? eventsById.get(r.targetEventId) : undefined;
              const displayTitle = event?.title ?? r.proposedTitle ?? 'Unknown';
              const requester = usersById.get(r.requestedById);
              return (
                <div key={r.id} className="rounded-md border border-[var(--line)] bg-[var(--panel)] p-2">
                  <p className="truncate text-[11.5px] font-medium text-[var(--text-primary)]">
                    {r.requestType === 'CREATE' ? '+ ' : ''}
                    {displayTitle}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {requester?.name ?? 'Unknown'} {r.requestType === 'CREATE' ? 'proposed creating a booking at' : 'proposed'} {fmt(r.proposedStart)}
                  </p>
                  {r.reason && <p className="mt-0.5 text-[10px] italic text-[var(--text-muted)]">"{r.reason}"</p>}
                  {!r.wasValidAtRequestTime && (
                    <p className="mt-1 text-[10px] font-medium" style={{ color: statusColor.breach }}>
                      ⚠ Would conflict if approved
                    </p>
                  )}
                  <div className="mt-1.5 flex gap-1.5">
                    <button
                      onClick={() => onApprove(r.id)}
                      className="flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[9.5px]"
                      style={{ backgroundColor: `${statusColor.ok}22`, color: statusColor.ok }}
                    >
                      <Check size={10} /> Approve
                    </button>
                    <button
                      onClick={() => onReject(r.id)}
                      className="flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[9.5px]"
                      style={{ backgroundColor: `${statusColor.breach}22`, color: statusColor.breach }}
                    >
                      <X size={10} /> Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
