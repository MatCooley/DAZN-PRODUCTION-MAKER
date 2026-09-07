import { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

// Replaces the native title tooltip on bookings and shifts with a
// structured card — call/wrap/on-air/crew-fill detail the OS tooltip
// can't lay out, shown fast (140ms) and positioned to never run off
// the viewport. `position: fixed` so it always escapes any scrolling
// ancestor's clipping, matching how the reference tool behaves.
export interface HovercardRow {
  key: string;
  value: React.ReactNode;
}

export function Hovercard({
  anchorRect,
  accentColor,
  icon,
  title,
  subtitle,
  rows,
  warning,
}: {
  anchorRect: DOMRect;
  accentColor: string;
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  rows: HovercardRow[];
  warning?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const pad = 10;
    const h = el.offsetHeight;
    const w = el.offsetWidth;
    let top = anchorRect.bottom + 8;
    if (top + h > window.innerHeight - pad) top = Math.max(pad, anchorRect.top - h - 8);
    let left = anchorRect.left;
    if (left + w > window.innerWidth - pad) left = window.innerWidth - w - pad;
    setPos({ top, left: Math.max(pad, left) });
  }, [anchorRect]);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed z-[70] w-[280px] rounded-md border border-[var(--line)] p-3 shadow-2xl transition-opacity"
      style={{
        backgroundColor: 'var(--panel-raised)',
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        opacity: pos ? 1 : 0,
      }}
    >
      <div className="flex items-baseline gap-2">
        {icon ?? <span className="h-2 w-2 shrink-0 translate-y-[-1px] rounded-sm" style={{ backgroundColor: accentColor }} />}
        <span className="truncate text-[13px] font-bold tracking-tight text-[var(--text-primary)]">{title}</span>
        {subtitle && <span className="ml-auto shrink-0 font-mono text-[10px] text-[var(--text-muted)]">{subtitle}</span>}
      </div>
      <div className="mt-2 flex flex-col gap-1">
        {rows.map((r) => (
          <div key={r.key} className="flex gap-2.5 text-[11.5px]">
            <span className="w-[62px] shrink-0 text-[var(--text-muted)]">{r.key}</span>
            <span className="min-w-0 flex-1 break-words text-[var(--text-primary)]/90">{r.value}</span>
          </div>
        ))}
      </div>
      {warning && (
        <div className="mt-2.5 flex gap-1.5 border-t border-[var(--line)]/60 pt-2.5 text-[11.5px]" style={{ color: 'var(--signal-amber)' }}>
          <AlertTriangle size={13} className="mt-0.5 shrink-0" />
          <span>{warning}</span>
        </div>
      )}
    </div>
  );
}

// Shared hover-with-delay state: mirrors the reference tool's 140ms open
// delay and immediate close, keyed by a caller-supplied id so a single
// hook instance can serve a whole list without one timer per row.
export function useHoverDelay(delayMs = 140) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onEnter(id: string) {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setHoveredId(id), delayMs);
  }
  function onLeave() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setHoveredId(null);
  }
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { hoveredId, onEnter, onLeave };
}
