import { useRef, useState, type ReactNode } from 'react';

export function SplitPane({
  top,
  bottom,
  defaultTopPct = 55,
  minPct = 20,
  maxPct = 80,
}: {
  top: ReactNode;
  bottom: ReactNode;
  defaultTopPct?: number;
  minPct?: number;
  maxPct?: number;
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

  return (
    <div ref={containerRef} className="flex min-h-0 flex-1 flex-col select-none">
      <div className="flex min-h-0 flex-col overflow-hidden" style={{ height: `${topPct}%` }}>
        {top}
      </div>

      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={() => setTopPct(defaultTopPct)}
        title="Drag to resize · double-click to reset"
        className="group relative z-10 h-[7px] shrink-0 cursor-row-resize border-y border-[var(--line)] bg-[var(--panel)]"
      >
        <div
          className={`absolute left-1/2 top-1/2 h-[3px] w-12 -translate-x-1/2 -translate-y-1/2 rounded-full transition ${
            dragging ? 'bg-[var(--tally)]' : 'bg-[var(--line)] group-hover:bg-[var(--tally)]/70'
          }`}
        />
      </div>

      <div className="flex min-h-0 flex-col overflow-hidden" style={{ height: `${100 - topPct}%` }}>
        {bottom}
      </div>
    </div>
  );
}
