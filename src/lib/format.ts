export function formatHM(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// The one place every "now" indicator (roster board, roster table, crew
// timeline, studio board) reads the clock from — so they can never drift
// out of sync with each other within a single render.
export function nowClock(): { todayIso: string; hour: number; label: string } {
  const now = new Date();
  return {
    todayIso: now.toISOString().slice(0, 10),
    hour: now.getHours() + now.getMinutes() / 60,
    label: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
  };
}
