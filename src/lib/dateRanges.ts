import { toLocalDateString } from './dateUtils';

export type ViewMode = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface DateBucket {
  key: string;
  label: string;
  sublabel?: string;
  start: Date;
  end: Date; // exclusive
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** One bucket per calendar day covering the whole month containing `anchor`. */
export function monthDayBuckets(anchor: Date): DateBucket[] {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: lastDay }, (_, i) => {
    const start = startOfDay(new Date(year, month, i + 1));
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return {
      key: toLocalDateString(start),
      label: String(i + 1),
      sublabel: DAY_LABELS[start.getDay()],
      start,
      end,
    };
  });
}

/** One bucket per calendar day covering the calendar quarter containing `anchor`. */
export function quarterDayBuckets(anchor: Date): DateBucket[] {
  const year = anchor.getFullYear();
  const qStartMonth = Math.floor(anchor.getMonth() / 3) * 3;
  const buckets: DateBucket[] = [];
  for (let m = qStartMonth; m < qStartMonth + 3; m++) {
    const lastDay = new Date(year, m + 1, 0).getDate();
    for (let d = 1; d <= lastDay; d++) {
      const start = startOfDay(new Date(year, m, d));
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      buckets.push({
        key: toLocalDateString(start),
        label: d === 1 ? MONTH_NAMES[m] : String(d),
        start,
        end,
      });
    }
  }
  return buckets;
}

/** One bucket per calendar month covering the calendar year containing `anchor`. */
export function yearMonthBuckets(anchor: Date): DateBucket[] {
  const year = anchor.getFullYear();
  return Array.from({ length: 12 }, (_, m) => {
    const start = new Date(year, m, 1);
    const end = new Date(year, m + 1, 1);
    return { key: `${year}-${m}`, label: MONTH_NAMES[m], sublabel: String(year), start, end };
  });
}

export function periodLabel(mode: ViewMode, anchor: Date, weekDays?: { date: string }[]): string {
  if (mode === 'day') {
    return anchor.toLocaleDateString('en-AU', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  }
  if (mode === 'week' && weekDays) {
    const first = new Date(weekDays[0].date + 'T00:00:00');
    const last = new Date(weekDays[weekDays.length - 1].date + 'T00:00:00');
    const fm = MONTH_NAMES[first.getMonth()];
    const lm = MONTH_NAMES[last.getMonth()];
    if (first.getFullYear() !== last.getFullYear()) return `${fm} ${first.getFullYear()} – ${lm} ${last.getFullYear()}`;
    if (fm !== lm) return `${fm} – ${lm} ${first.getFullYear()}`;
    return `${fm} ${first.getFullYear()}`;
  }
  if (mode === 'month') return `${MONTH_NAMES[anchor.getMonth()]} ${anchor.getFullYear()}`;
  if (mode === 'quarter') {
    const q = Math.floor(anchor.getMonth() / 3) + 1;
    return `Q${q} ${anchor.getFullYear()}`;
  }
  return String(anchor.getFullYear());
}

export function shiftAnchor(mode: ViewMode, anchor: Date, direction: 1 | -1): Date {
  const next = new Date(anchor);
  if (mode === 'day') next.setDate(next.getDate() + direction);
  else if (mode === 'week') next.setDate(next.getDate() + direction * 7);
  else if (mode === 'month') next.setMonth(next.getMonth() + direction);
  else if (mode === 'quarter') next.setMonth(next.getMonth() + direction * 3);
  else next.setFullYear(next.getFullYear() + direction);
  return next;
}

const DAY_LABELS_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Single-day "week" for the Day view — same {date,label} shape as weekOf(). */
export function dayOf(anchor: Date): { date: string; label: string }[] {
  return [{ date: toLocalDateString(anchor), label: DAY_LABELS_FULL[anchor.getDay()] }];
}
