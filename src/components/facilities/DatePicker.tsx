import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { toLocalDateString } from '../../lib/dateUtils';

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function displayDate(s: string): string {
  const d = parseLocalDate(s);
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

export function DatePicker({ value, onChange }: { value: string; onChange: (dateStr: string) => void }) {
  const [open, setOpen] = useState(false);
  const selected = parseLocalDate(value);
  const [viewMonth, setViewMonth] = useState(new Date(selected.getFullYear(), selected.getMonth(), 1));
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  function openPicker() {
    setViewMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
    setOpen(true);
  }

  const firstOfMonth = viewMonth;
  const daysInMonth = new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth() + 1, 0).getDate();
  const leadingBlanks = firstOfMonth.getDay();
  const today = toLocalDateString(new Date());

  const cells: (Date | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth(), i + 1)),
  ];

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={openPicker}
        className="input flex items-center justify-between gap-2 text-left"
      >
        <span>{displayDate(value)}</span>
        <CalendarDays size={13} className="shrink-0 text-[var(--text-muted)]" />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-[240px] rounded-lg border border-[var(--line)] bg-[var(--panel-raised)] p-2.5 shadow-2xl">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--panel)] hover:text-[var(--text-primary)]"
              aria-label="Previous month"
            >
              <ChevronLeft size={13} />
            </button>
            <span className="font-display text-[12px] font-semibold uppercase tracking-wide text-[var(--text-primary)]">
              {MONTH_NAMES[firstOfMonth.getMonth()]} {firstOfMonth.getFullYear()}
            </span>
            <button
              type="button"
              onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--panel)] hover:text-[var(--text-primary)]"
              aria-label="Next month"
            >
              <ChevronRight size={13} />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-0.5">
            {WEEKDAY_LABELS.map((w) => (
              <div key={w} className="text-center font-mono text-[9px] text-[var(--text-muted)]">
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const key = toLocalDateString(d);
              const isSelected = key === value;
              const isToday = key === today;
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => {
                    onChange(key);
                    setOpen(false);
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded-full font-mono text-[10.5px] transition"
                  style={{
                    backgroundColor: isSelected ? 'var(--tally)' : 'transparent',
                    color: isSelected ? 'var(--ink)' : isToday ? 'var(--tally)' : 'var(--text-primary)',
                    fontWeight: isSelected || isToday ? 700 : 400,
                  }}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
