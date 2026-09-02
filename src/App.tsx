import { useMemo, useState } from 'react';
import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { employees as initialEmployees, shifts as staticShifts, initialAssignments, days as initialRosterDays } from './lib/data';
import type { Assignments, Employee, Shift } from './lib/types';
import { computeCompliance } from './lib/compliance';
import { TopBar } from './components/TopBar';
import { RosterToolbar, type RosterViewMode } from './components/RosterToolbar';
import { Sidebar } from './components/Sidebar';
import { Board } from './components/Board';
import { RosterTable } from './components/RosterTable';
import { EmployeeChip } from './components/EmployeeChip';
import { EmployeeProfileModal } from './components/EmployeeProfileModal';
import { FacilitiesBoard } from './components/facilities/FacilitiesBoard';
import { SplitPane, type SplitLayoutMode } from './components/SplitPane';
import { LayoutModeSwitcher } from './components/LayoutModeSwitcher';

export default function App() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [assignments, setAssignments] = useState<Assignments>(initialAssignments);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [layoutMode, setLayoutMode] = useState<SplitLayoutMode>('split');
  const [rosterViewMode, setRosterViewMode] = useState<RosterViewMode>('board');
  const [rosterDays, setRosterDays] = useState(initialRosterDays);
  const [derivedShifts, setDerivedShifts] = useState<Shift[]>([]);

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

    const requirement = shift.requirements.find((r) => r.skill === skill);
    if (!requirement) return;
    if (!employee.skills.includes(requirement.skill)) return; // unqualified — silently reject

    setAssignments((prev) => {
      const shiftAssignments = prev[shiftId] ?? {};
      const currentForSkill = shiftAssignments[skill] ?? [];

      // already assigned to this shift (any skill)? no duplicates within a shift
      const alreadyOnShift = Object.values(shiftAssignments).some((ids) => ids.includes(employeeId));
      if (alreadyOnShift) return prev;

      // slot full
      if (currentForSkill.length >= requirement.count) return prev;

      return {
        ...prev,
        [shiftId]: {
          ...shiftAssignments,
          [skill]: [...currentForSkill, employeeId],
        },
      };
    });
  }

  function handleSaveEmployee(updated: Employee) {
    setEmployees((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    setEditingEmployee(null);
  }

  function handleRemove(shiftId: string, skill: string, employeeId: string) {
    setAssignments((prev) => {
      const shiftAssignments = prev[shiftId];
      if (!shiftAssignments) return prev;
      return {
        ...prev,
        [shiftId]: {
          ...shiftAssignments,
          [skill]: (shiftAssignments[skill] ?? []).filter((id) => id !== employeeId),
        },
      };
    });
  }

  const draggingEmployee = draggingId ? employeesById.get(draggingId.replace('emp:', '')) : undefined;

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-screen flex-col bg-[var(--ink)]">
        <TopBar>
          <LayoutModeSwitcher mode={layoutMode} onChange={setLayoutMode} />
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
                onReset={() => setAssignments({})}
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
          onClose={() => setEditingEmployee(null)}
          onSave={handleSaveEmployee}
        />
      )}
    </DndContext>
  );
}
