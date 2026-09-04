import { useState } from 'react';
import { X, Check } from 'lucide-react';
import type { Employee, SkillCode } from '../lib/types';
import { allSkillCodes, skillColor, skillLabel, statusColor } from '../lib/visuals';

export function EmployeeProfileModal({
  employee,
  isNew,
  onClose,
  onSave,
}: {
  employee: Employee;
  isNew?: boolean;
  onClose: () => void;
  onSave: (updated: Employee) => void;
}) {
  const [draft, setDraft] = useState<Employee>(employee);

  function toggleSkill(skill: SkillCode) {
    setDraft((d) => {
      const has = d.skills.includes(skill);
      const skills = has ? d.skills.filter((s) => s !== skill) : [...d.skills, skill];
      const primarySkill = has && d.primarySkill === skill ? skills[0] ?? d.primarySkill : d.primarySkill;
      return { ...d, skills, primarySkill };
    });
  }

  const canSave = !!draft.name.trim() && !!draft.initials.trim() && draft.skills.length > 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-[420px] flex-col rounded-lg border border-[var(--line)] bg-[var(--panel-raised)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
          <h2 className="font-display text-[16px] font-semibold uppercase tracking-wide text-[var(--text-primary)]">
            {isNew ? 'Add crew member' : 'Edit profile'}
          </h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          <Field label="Name">
            <input
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              className="input"
            />
          </Field>

          <Field label="Initials">
            <input
              value={draft.initials}
              maxLength={3}
              onChange={(e) => setDraft((d) => ({ ...d, initials: e.target.value.toUpperCase() }))}
              className="input w-20"
            />
          </Field>

          <Field label="Team">
            <input
              value={draft.team}
              onChange={(e) => setDraft((d) => ({ ...d, team: e.target.value }))}
              placeholder="e.g. Rach's Team"
              className="input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Grade">
              <select
                value={draft.grade}
                onChange={(e) => setDraft((d) => ({ ...d, grade: e.target.value }))}
                className="input"
              >
                <option value="Permanent">Permanent</option>
                <option value="Freelance">Freelance</option>
              </select>
            </Field>
            <Field label="Agreement">
              <select
                value={draft.agreement}
                onChange={(e) => setDraft((d) => ({ ...d, agreement: e.target.value as Employee['agreement'] }))}
                className="input"
              >
                <option value="BREA">BREA</option>
                <option value="BARE">BARE</option>
              </select>
            </Field>
          </div>

          <Field label="Skills">
            <div className="flex flex-wrap gap-1.5">
              {allSkillCodes.map((skill) => {
                const active = draft.skills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className="flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[10.5px] transition"
                    style={{
                      borderColor: active ? skillColor[skill] : 'var(--line)',
                      backgroundColor: active ? `${skillColor[skill]}22` : 'transparent',
                      color: active ? skillColor[skill] : 'var(--text-muted)',
                    }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: skillColor[skill] }} />
                    {skillLabel[skill]}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Primary skill">
            <select
              value={draft.primarySkill}
              onChange={(e) => setDraft((d) => ({ ...d, primarySkill: e.target.value as SkillCode }))}
              className="input"
            >
              {draft.skills.map((skill) => (
                <option key={skill} value={skill}>
                  {skillLabel[skill]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--line)] px-4 py-3">
          <button
            onClick={onClose}
            className="rounded-md border border-[var(--line)] px-3 py-1.5 font-mono text-[10.5px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            Cancel
          </button>
          <button
            onClick={() => canSave && onSave(draft)}
            disabled={!canSave}
            className="flex items-center gap-1 rounded-md px-3 py-1.5 font-mono text-[10.5px] font-medium disabled:opacity-30"
            style={{ backgroundColor: `${statusColor.ok}22`, color: statusColor.ok }}
          >
            <Check size={12} /> {isNew ? 'Add crew member' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[9.5px] uppercase tracking-wide text-[var(--text-muted)]">{label}</span>
      {children}
    </label>
  );
}
