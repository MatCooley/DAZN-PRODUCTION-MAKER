import { useMemo, useState } from 'react';
import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { employees, shifts } from './lib/data';
import type { Assignments } from './lib/types';
import { computeCompliance } from './lib/compliance';
import { TopBar, type ViewMode } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { Board } from './components/Board';
import { EmployeeChip } from './components/EmployeeChip';
import { FacilitiesBoard } from './components/facilities/FacilitiesBoard';

const shiftsById = new Map(shifts.map((s) => [s.id, s]));
const employeesById = new Map(employees.map((e) => [e.id, e]));

const initialAssignments: Assignments = {};

export default function App() {
  const [assignments, setAssignments] = useState<Assignments>(initialAssignments);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('roster');

  const compliance = useMemo(() => computeCompliance(shifts, assignments, employees), [assignments]);

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
    for (const s of shifts) {
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
  }, [compliance]);

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
        <TopBar
          view={view}
          onViewChange={setView}
          coveragePct={coveragePct}
          breachCount={breachCount}
          warningCount={warningCount}
          onReset={() => setAssignments({})}
        />
        {view === 'roster' ? (
          <div className="flex min-h-0 flex-1">
            <Sidebar employees={employees} assignedCounts={assignedCounts} />
            <div className="min-w-0 flex-1 overflow-auto">
              <Board
                assignments={assignments}
                employeesById={employeesById}
                compliance={compliance}
                onRemove={handleRemove}
              />
            </div>
          </div>
        ) : (
          <FacilitiesBoard />
        )}
      </div>
      <DragOverlay>{draggingEmployee ? <EmployeeChip employee={draggingEmployee} /> : null}</DragOverlay>
    </DndContext>
  );
}
