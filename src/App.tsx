import { useEffect, useMemo, useState } from 'react';
import { Clapperboard, Users } from 'lucide-react';
import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { employees as initialEmployees, shifts as staticShifts, initialAssignments, days as initialRosterDays } from './lib/data';
import type { Assignments, DayOff, Employee, Shift } from './lib/types';
import { computeCompliance, computeCrewStats, computeDropVerdict, mondayOf, type DropVerdict } from './lib/compliance';
import { showLibrary, type ShowTemplate } from './lib/showLibrary';
import type { ShowSchedule } from './lib/shows';
import { TopBar } from './components/TopBar';
import { RosterToolbar, type RosterViewMode } from './components/RosterToolbar';
import { Sidebar } from './components/Sidebar';
import { Board } from './components/Board';
import { RosterTable } from './components/RosterTable';
import { EmployeeChip } from './components/EmployeeChip';
import { EmployeeProfileModal } from './components/EmployeeProfileModal';
import { CrewPanel } from './components/CrewPanel';
import { ShowsPanel } from './components/ShowsPanel';
import { FacilitiesBoard } from './components/facilities/FacilitiesBoard';
import { SplitPane, type SplitLayoutMode } from './components/SplitPane';
import { LayoutModeSwitcher } from './components/LayoutModeSwitcher';

const NEW_EMPLOYEE_ID = '__new__';

function makeEmployeeId(name: string, existingIds: Set<string>): string {
  const base = name.trim().toLowerCase().split(/\s+/)[0]?.replace(/[^a-z0-9]/g, '') || 'crew';
  if (!existingIds.has(base)) return base;
  let n = 2;
  while (existingIds.has(`${base}${n}`)) n++;
  return `${base}${n}`;
}

function blankEmployee(): Employee {
  return {
    id: NEW_EMPLOYEE_ID,
    name: '',
    initials: '',
    grade: 'Permanent',
    agreement: 'BREA',
    skills: [],
    primarySkill: 'DA',
    team: '',
  };
}

export default function App() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [assignments, setAssignments] = useState<Assignments>(initialAssignments);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [layoutMode, setLayoutMode] = useState<SplitLayoutMode>('split');
  const [rosterViewMode, setRosterViewMode] = useState<RosterViewMode>('board');
  const [rosterDays, setRosterDays] = useState(initialRosterDays);
  const [derivedShifts, setDerivedShifts] = useState<Shift[]>([]);
  const [history, setHistory] = useState<{ label: string; assignments: Assignments }[]>([]);
  const [daysOff, setDaysOff] = useState<DayOff[]>([]);
  const [crewPanelOpen, setCrewPanelOpen] = useState(false);
  const [customShows, setCustomShows] = useState<ShowTemplate[]>([]);
  const [showSchedules, setShowSchedules] = useState<Record<string, ShowSchedule>>({});
  const [hiddenShowKeys, setHiddenShowKeys] = useState<Set<string>>(new Set());
  const [showsPanelOpen, setShowsPanelOpen] = useState(false);

  // Hand-authored shifts (real historical roster data) always win over a
  // booking-derived one for the SAME production on the SAME day, so a real
  // PDF-sourced shift is never overridden by a cost-sheet guess — but a
  // new booking on a day that already has unrelated authored shifts (e.g.
  // adding a fresh Sunday booking alongside the existing Sunday shifts)
  // still gets its own derived shift instead of being silently dropped.
  const shifts = useMemo(() => {
    const authoredKeys = new Set(staticShifts.map((s) => `${s.day}::${s.production}`));
    const extra = derivedShifts.filter((s) => !authoredKeys.has(`${s.day}::${s.production}`));
    return [...staticShifts, ...extra];
  }, [derivedShifts]);

  const shiftsById = useMemo(() => new Map(shifts.map((s) => [s.id, s])), [shifts]);

  const hasShiftsForWeek = useMemo(
    () => shifts.some((s) => rosterDays.some((d) => d.date === s.day)),
    [shifts, rosterDays],
  );

  const employeesById = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);
  const compliance = useMemo(() => computeCompliance(shifts, assignments, employees), [shifts, assignments, employees]);
  const crewStats = useMemo(
    () => computeCrewStats(shifts, assignments, employees, daysOff, mondayOf(rosterDays[0].date)),
    [shifts, assignments, employees, daysOff, rosterDays],
  );

  const assignedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const bySkill of Object.values(assignments)) {
      for (const ids of Object.values(bySkill)) {
        for (const id of ids) counts[id] = (counts[id] ?? 0) + 1;
      }
    }
    return counts;
  }, [assignments]);

  const { coveragePct, breachCount, warningCount } = useMemo(() => {
    let filled = 0;
    let required = 0;
    let breaches = 0;
    let warnings = 0;
    const visibleShifts = shifts.filter((s) => rosterDays.some((d) => d.date === s.day));
    for (const s of visibleShifts) {
      const f = compliance.shiftFillSummary[s.id];
      if (f) {
        filled += f.filled;
        required += f.required;
      }
      const status = compliance.shiftStatus[s.id];
      if (status === 'breach') breaches++;
      if (status === 'warning') warnings++;
    }
    return {
      coveragePct: required === 0 ? 100 : Math.round((filled / required) * 100),
      breachCount: breaches,
      warningCount: warnings,
    };
  }, [shifts, rosterDays, compliance]);

  const HISTORY_MAX = 60;
  function pushHistory(label: string, snapshot: Assignments) {
    setHistory((prev) => {
      const next = [...prev, { label, assignments: snapshot }];
      return next.length > HISTORY_MAX ? next.slice(next.length - HISTORY_MAX) : next;
    });
  }

  function undoLast() {
    if (history.length === 0) return;
    const entry = history[history.length - 1];
    setAssignments(entry.assignments);
    setHistory((prev) => prev.slice(0, -1));
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undoLast();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [history]);

  // The same rules the drag preview shows are what decide the drop, so a
  // slot that previews as assignable always is — there is no separate,
  // possibly-diverging check at drop time.
  function getDropVerdict(shiftId: string, skill: string): DropVerdict | null {
    if (!draggingId) return null;
    return computeDropVerdict(shiftsById, assignments, employeesById, shiftId, skill, draggingId.replace('emp:', ''));
  }

  function handleDragStart(event: DragStartEvent) {
    setDraggingId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggingId(null);
    const { active, over } = event;
    if (!over) return;

    const employeeId = String(active.id).replace('emp:', '');
    const [, shiftId, skill] = String(over.id).split(':');
    const shift = shiftsById.get(shiftId);
    const employee = employeesById.get(employeeId);
    if (!shift || !employee) return;

    const verdict = computeDropVerdict(shiftsById, assignments, employeesById, shiftId, skill, employeeId);
    if (verdict === null || verdict === 'invalid' || verdict === 'duplicate' || verdict === 'full') return;

    const shiftAssignments = assignments[shiftId] ?? {};
    const currentForSkill = shiftAssignments[skill] ?? [];
    pushHistory(`Assigned ${employee.name.split(' ')[0]} to ${shift.production}`, assignments);
    setAssignments({
      ...assignments,
      [shiftId]: {
        ...shiftAssignments,
        [skill]: [...currentForSkill, employeeId],
      },
    });
  }

  function handleSaveEmployee(updated: Employee) {
    if (updated.id === NEW_EMPLOYEE_ID) {
      const id = makeEmployeeId(updated.name, new Set(employees.map((e) => e.id)));
      setEmployees((prev) => [...prev, { ...updated, id }]);
    } else {
      setEmployees((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    }
    setEditingEmployee(null);
  }

  function handleUpdateEmployee(updated: Employee) {
    setEmployees((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  }

  function handleRemoveEmployee(employeeId: string) {
    setEmployees((prev) => prev.filter((e) => e.id !== employeeId));
  }

  function toggleDayOff(employeeId: string, date: string) {
    setDaysOff((prev) => {
      const existing = prev.find((o) => o.employeeId === employeeId && o.date === date);
      if (existing) return prev.filter((o) => o.id !== existing.id);
      return [...prev, { id: `${employeeId}::${date}`, employeeId, date }];
    });
  }

  function handleRemove(shiftId: string, skill: string, employeeId: string) {
    const shiftAssignments = assignments[shiftId];
    if (!shiftAssignments) return;
    const employee = employeesById.get(employeeId);
    const shift = shiftsById.get(shiftId);
    pushHistory(`Removed ${employee?.name.split(' ')[0] ?? 'crew'} from ${shift?.production ?? 'shift'}`, assignments);
    setAssignments({
      ...assignments,
      [shiftId]: {
        ...shiftAssignments,
        [skill]: (shiftAssignments[skill] ?? []).filter((id) => id !== employeeId),
      },
    });
  }

  const allShows = useMemo(() => [...showLibrary, ...customShows], [customShows]);

  function handleUpdateShowSchedule(key: string, updated: ShowSchedule) {
    setShowSchedules((prev) => ({ ...prev, [key]: updated }));
  }

  function handleAddCustomShow(show: ShowTemplate) {
    setCustomShows((prev) => [...prev, show]);
  }

  function handleHideShow(key: string) {
    setHiddenShowKeys((prev) => new Set(prev).add(key));
  }

  function handleResetRoster() {
    if (Object.keys(assignments).length === 0) return;
    pushHistory('Reset roster', assignments);
    setAssignments({});
  }

  const draggingEmployee = draggingId ? employeesById.get(draggingId.replace('emp:', '')) : undefined;

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-screen flex-col bg-[var(--ink)]">
        <TopBar>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCrewPanelOpen(true)}
              className="flex items-center gap-1.5 rounded-md border border-[var(--line)] px-2.5 py-1.5 font-mono text-[10.5px] text-[var(--text-muted)] transition hover:border-[var(--tally)]/60 hover:text-[var(--text-primary)]"
            >
              <Users size={13} />
              Crew
            </button>
            <button
              onClick={() => setShowsPanelOpen(true)}
              className="flex items-center gap-1.5 rounded-md border border-[var(--line)] px-2.5 py-1.5 font-mono text-[10.5px] text-[var(--text-muted)] transition hover:border-[var(--tally)]/60 hover:text-[var(--text-primary)]"
            >
              <Clapperboard size={13} />
              Shows
            </button>
            <LayoutModeSwitcher mode={layoutMode} onChange={setLayoutMode} />
          </div>
        </TopBar>
        <SplitPane
          defaultTopPct={55}
          mode={layoutMode}
          top={<FacilitiesBoard onVisibleWeekChange={setRosterDays} onDerivedShiftsChange={setDerivedShifts} />}
          bottom={
            <div className="flex h-full min-h-0 flex-col">
              <RosterToolbar
                coveragePct={coveragePct}
                breachCount={breachCount}
                warningCount={warningCount}
                onReset={handleResetRoster}
                canUndo={history.length > 0}
                undoLabel={history[history.length - 1]?.label}
                onUndo={undoLast}
                viewMode={rosterViewMode}
                onViewModeChange={setRosterViewMode}
              />
              {!hasShiftsForWeek && (
                <div className="border-b border-[var(--line)] bg-[var(--panel-raised)]/60 px-4 py-1.5 font-mono text-[10.5px] text-[var(--text-muted)]">
                  No roster shifts published for {rosterDays[0]?.date.slice(5)} – {rosterDays[6]?.date.slice(5)} yet.
                </div>
              )}
              {rosterViewMode === 'table' ? (
                <RosterTable days={rosterDays} employees={employees} shifts={shifts} assignments={assignments} />
              ) : (
                <div className="flex min-h-0 flex-1">
                  <Sidebar
                    employees={employees}
                    assignedCounts={assignedCounts}
                    onEditEmployee={setEditingEmployee}
                  />
                  <div className="min-w-0 flex-1 overflow-auto">
                    <Board
                      days={rosterDays}
                      shifts={shifts}
                      assignments={assignments}
                      employeesById={employeesById}
                      compliance={compliance}
                      onRemove={handleRemove}
                      getDropVerdict={getDropVerdict}
                    />
                  </div>
                </div>
              )}
            </div>
          }
        />
      </div>
      <DragOverlay>{draggingEmployee ? <EmployeeChip employee={draggingEmployee} /> : null}</DragOverlay>
      {editingEmployee && (
        <EmployeeProfileModal
          employee={editingEmployee}
          isNew={editingEmployee.id === NEW_EMPLOYEE_ID}
          onClose={() => setEditingEmployee(null)}
          onSave={handleSaveEmployee}
        />
      )}
      {crewPanelOpen && (
        <CrewPanel
          employees={employees}
          shifts={shifts}
          assignments={assignments}
          crewStats={crewStats}
          rosterDays={rosterDays}
          daysOff={daysOff}
          onToggleDayOff={toggleDayOff}
          onClose={() => setCrewPanelOpen(false)}
          onEditEmployee={setEditingEmployee}
          onAddEmployee={() => setEditingEmployee(blankEmployee())}
          onUpdateEmployee={handleUpdateEmployee}
          onRemoveEmployee={handleRemoveEmployee}
        />
      )}
      {showsPanelOpen && (
        <ShowsPanel
          shows={allShows}
          employees={employees}
          schedules={showSchedules}
          hiddenKeys={hiddenShowKeys}
          onClose={() => setShowsPanelOpen(false)}
          onUpdateSchedule={handleUpdateShowSchedule}
          onAddCustomShow={handleAddCustomShow}
          onHideShow={handleHideShow}
        />
      )}
    </DndContext>
  );
}
