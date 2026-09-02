import { useRef, useState, type ReactNode } from 'react';
import { GripHorizontal } from 'lucide-react';

export type SplitLayoutMode = 'split' | 'top' | 'bottom';

export function SplitPane({
  top,
  bottom,
  defaultTopPct = 55,
  minPct = 20,
  maxPct = 80,
  mode = 'split',
}: {
  top: ReactNode;
  bottom: ReactNode;
  defaultTopPct?: number;
  minPct?: number;
  maxPct?: number;
  mode?: SplitLayoutMode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [topPct, setTopPct] = useState(defaultTopPct);
  const [dragging, setDragging] = useState(false);

  function handleMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    setDragging(true);

    function handleMove(ev: MouseEvent) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const pct = ((ev.clientY - rect.top) / rect.height) * 100;
      setTopPct(Math.min(maxPct, Math.max(minPct, pct)));
    }

    function handleUp() {
      setDragging(false);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    }

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }

  const effectiveTopPct = mode === 'top' ? 100 : mode === 'bottom' ? 0 : topPct;

  return (
    <div ref={containerRef} className="flex min-h-0 flex-1 flex-col select-none">
      <div className="flex min-h-0 flex-col overflow-hidden" style={{ height: `${effectiveTopPct}%` }}>
        {top}
      </div>

      {/* The handle sits flush against both panes — no gap either side —
          so it reads as physically joining them rather than a stray line
          floating between two separate blocks. */}
      {mode === 'split' && (
        <div
          onMouseDown={handleMouseDown}
          onDoubleClick={() => setTopPct(defaultTopPct)}
          title="Drag to resize Studios / Roster · double-click to reset"
          className={`group relative z-20 flex h-[10px] shrink-0 cursor-row-resize items-center justify-center border-y bg-[var(--panel)] transition-colors ${
            dragging ? 'border-[var(--tally)] bg-[var(--tally)]/20' : 'border-[var(--line)] hover:bg-[var(--tally)]/10'
          }`}
        >
          <GripHorizontal
            size={16}
            className={`transition-colors ${dragging ? 'text-[var(--tally)]' : 'text-[var(--text-muted)] group-hover:text-[var(--tally)]'}`}
          />
        </div>
      )}

      <div className="flex min-h-0 flex-col overflow-hidden" style={{ height: `${100 - effectiveTopPct}%` }}>
        {bottom}
      </div>
    </div>
  );
}
