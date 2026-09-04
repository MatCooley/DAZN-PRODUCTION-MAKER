import { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { ShowTemplate } from '../lib/showLibrary';
import type { Employee } from '../lib/types';
import { defaultScheduleFor, scheduleSummary, type ShowSchedule } from '../lib/shows';
import type { GenerateResult } from './facilities/FacilitiesBoard';
import { statusColor } from '../lib/visuals';
import { ShowDetail } from './ShowDetail';

export function ShowsPanel({
  shows,
  employees,
  schedules,
  hiddenKeys,
  onClose,
  onUpdateSchedule,
  onAddCustomShow,
  onHideShow,
  onGenerate,
}: {
  shows: ShowTemplate[];
  employees: Employee[];
  schedules: Record<string, ShowSchedule>;
  hiddenKeys: Set<string>;
  onClose: () => void;
  onUpdateSchedule: (key: string, updated: ShowSchedule) => void;
  onAddCustomShow: (show: ShowTemplate) => void;
  onHideShow: (key: string) => void;
  onGenerate: (show: ShowTemplate, schedule: ShowSchedule, fromDate: string, toDate: string) => GenerateResult;
}) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [addingShow, setAddingShow] = useState(false);
  const [newShowName, setNewShowName] = useState('');

  const visibleShows = useMemo(() => shows.filter((s) => !hiddenKeys.has(s.key)), [shows, hiddenKeys]);
  const selectedShow = selectedKey ? shows.find((s) => s.key === selectedKey) : undefined;

  function scheduleFor(show: ShowTemplate): ShowSchedule {
    return schedules[show.key] ?? defaultScheduleFor(show, '2026-03-01', '2026-10-01');
  }

  function handleAddShow() {
    const name = newShowName.trim();
    if (!name) return;
    const key = `custom-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
    const show: ShowTemplate = { key, name, studio: null, notes: [], crew: [], totalCrewCost: 0, episodes: null, seriesCost: null };
    onAddCustomShow(show);
    onUpdateSchedule(key, defaultScheduleFor(show, '2026-03-01', '2026-10-01'));
    setNewShowName('');
    setAddingShow(false);
    setSelectedKey(key);
  }

  if (selectedShow) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[var(--ink)]">
        <ShowDetail
          show={selectedShow}
          employees={employees}
          schedule={scheduleFor(selectedShow)}
          onBack={() => setSelectedKey(null)}
          onSave={(updated) => onUpdateSchedule(selectedShow.key, updated)}
          onDelete={() => {
            onHideShow(selectedShow.key);
            setSelectedKey(null);
          }}
          onGenerate={(fromDate, toDate) => onGenerate(selectedShow, scheduleFor(selectedShow), fromDate, toDate)}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--ink)]">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
        <div className="flex items-baseline gap-2">
          <h2 className="font-display text-[20px] font-semibold uppercase tracking-wide text-[var(--text-primary)]">Shows</h2>
          <span className="font-mono text-[12px] text-[var(--text-muted)]">{visibleShows.length} shows</span>
        </div>
        <div className="flex items-center gap-2">
          {addingShow ? (
            <>
              <input
                autoFocus
                value={newShowName}
                onChange={(e) => setNewShowName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddShow()}
                placeholder="Show name…"
                className="rounded-md border border-[var(--line)] bg-[var(--panel)] px-2.5 py-1.5 text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--tally)]"
              />
              <button
                onClick={handleAddShow}
                disabled={!newShowName.trim()}
                className="rounded-md bg-[var(--tally)] px-3 py-1.5 font-mono text-[10.5px] font-semibold text-[var(--ink)] disabled:opacity-30"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setAddingShow(false);
                  setNewShowName('');
                }}
                className="rounded-md border border-[var(--line)] px-2.5 py-1.5 font-mono text-[10.5px] text-[var(--text-muted)]"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setAddingShow(true)}
              className="flex items-center gap-1.5 rounded-md bg-[var(--tally)] px-3 py-1.5 font-mono text-[10.5px] font-semibold text-[var(--ink)] transition hover:opacity-90"
            >
              <Plus size={13} /> New show
            </button>
          )}
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]" aria-label="Close shows panel">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-5">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
          {visibleShows.map((show) => {
            const schedule = scheduleFor(show);
            const bookedOut = schedule.crewAssignments.filter((a) => a.regularEmployeeId).length;
            return (
              <button
                key={show.key}
                onClick={() => setSelectedKey(show.key)}
                className="flex flex-col rounded-lg border border-[var(--line)] bg-[var(--panel)] p-3 text-left transition hover:border-[var(--tally)]/60"
                style={{ borderLeft: `3px solid ${schedule.color}` }}
              >
                <span className="font-display text-[14px] font-semibold text-[var(--text-primary)]">{show.name}</span>
                <span className="mt-1 font-mono text-[10.5px] text-[var(--text-muted)]">{scheduleSummary(schedule)}</span>
                {show.studio && <span className="mt-0.5 font-mono text-[10.5px] text-[var(--text-muted)]">Studio {show.studio}</span>}
                <span className="mt-2 font-mono text-[10.5px]" style={{ color: bookedOut < schedule.crewAssignments.length ? statusColor.warning : statusColor.ok }}>
                  {schedule.crewAssignments.length} position{schedule.crewAssignments.length === 1 ? '' : 's'} · {bookedOut} regular{bookedOut === 1 ? '' : 's'} set
                </span>
              </button>
            );
          })}
        </div>
        {visibleShows.length === 0 && <p className="p-6 text-center text-[12px] text-[var(--text-muted)]">No shows to display.</p>}
      </div>
    </div>
  );
}
