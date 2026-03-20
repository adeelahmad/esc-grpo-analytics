import type { RoleVisual, Segment, SourceVisual } from '../types';

/* ═══ Okabe-Ito colorblind-safe palette ═══ */
export const CB = {
  blue: '#0077bb',
  orange: '#ee7733',
  green: '#009988',
  red: '#cc3311',
  cyan: '#33bbee',
  magenta: '#ee3377',
  grey: '#bbbbbb',
  yellow: '#ecb100',
  teal: '#009988',
  purple: '#aa3377',
  slate: '#475569',
  lightSlate: '#94a3b8',
} as const;

/* Proximity gradient: weight → hsl color string */
export const proxGrad = (w: number): string => {
  const n = Math.min(w / 3.6, 1);
  return `hsl(${n * 130},${70 + n * 15}%,${25 + n * 35}%)`;
};

/* Weight → threshold color */
export const wColor = (w: number): string => {
  const n = Math.min(w / 3.6, 1);
  if (n > 0.85) return CB.green;
  if (n > 0.6) return CB.teal;
  if (n > 0.4) return CB.yellow;
  if (n > 0.2) return CB.orange;
  return CB.red;
};

/* Segment → semantic role */
export type SegmentRole =
  | 'system'
  | 'scaffold'
  | 'generated'
  | 'forced'
  | 'answer'
  | 'prefix'
  | 'post'
  | 'injected'
  | 'other';

export const segRole = (seg?: Segment | null): SegmentRole => {
  const t = seg?.tag || '';
  const s = seg?.source || '';
  if (t === 'system' || t === 'prompt' || s === 'SegmentSource.PROMPT') return 'system';
  if (t.startsWith('scaffold')) return 'scaffold';
  if (t.startsWith('cycle') || t === 'thinking') return 'generated';
  if (t === 'forced_answer') return 'forced';
  if (t === 'answer') return 'answer';
  if (t === 'answer_prefix') return 'prefix';
  if (t === 'post_scaffold' || t === 'post_answer') return 'post';
  if (s === 'injected') return 'injected';
  return 'other';
};

/* Role → visual config */
export const RV: Record<string, RoleVisual> = {
  system: { bg: CB.slate, lt: '#f1f5f9', lbl: 'SYSTEM/PROMPT', ic: '📋', stripe: false },
  scaffold: { bg: CB.blue, lt: '#dbeafe', lbl: 'SCAFFOLD', ic: '🔧', stripe: true },
  generated: { bg: CB.green, lt: '#dcfce7', lbl: 'GENERATED', ic: '🧠', stripe: false },
  answer: { bg: CB.yellow, lt: '#fef9c3', lbl: 'ANSWER', ic: '✅', stripe: false },
  forced: { bg: '#f97316', lt: '#fff7ed', lbl: 'FORCED ANS', ic: '💉✅', stripe: true },
  prefix: { bg: CB.purple, lt: '#f3e8ff', lbl: 'PREFIX', ic: '🏷️', stripe: true },
  post: { bg: '#6b7280', lt: '#f3f4f6', lbl: 'POST', ic: '⏭️', stripe: true },
  injected: { bg: CB.cyan, lt: '#e0f2fe', lbl: 'INJECTED', ic: '💉', stripe: true },
  other: { bg: '#9ca3af', lt: '#f9fafb', lbl: 'OTHER', ic: '?', stripe: false },
};

/* Source → visual config */
const SOURCE_MAP: Record<string, SourceVisual> = {
  'SegmentSource.PROMPT': { bg: '#f1f5f9', bd: '#94a3b8', label: 'PROMPT' },
  injected: { bg: '#eff6ff', bd: CB.blue, label: 'INJECT' },
  generated: { bg: '#f0fdf4', bd: CB.green, label: 'GEN' },
};

export const getSrc = (s?: string): SourceVisual =>
  SOURCE_MAP[s || ''] || { bg: '#f9fafb', bd: '#d1d5db', label: '?' };

/* Tag → background color */
export const tagBg = (t?: string): string => {
  if (!t) return '#e5e7eb';
  if (t.startsWith('scaffold')) return '#bfdbfe';
  if (t.startsWith('cycle')) return '#bbf7d0';
  if (t === 'thinking') return '#e9d5ff';
  if (t === 'forced_answer') return '#fed7aa';
  if (t === 'answer') return '#fde68a';
  if (t === 'prompt' || t === 'system') return '#e2e8f0';
  if (t === 'answer_prefix') return '#fef3c7';
  return '#e5e7eb';
};

/* Segment-aware token cell background */
export const getSegBg = (seg: Segment | undefined | null, w: number): string => {
  if (!seg) return wColor(w);
  if (seg.truncated)
    return `repeating-linear-gradient(45deg,${CB.orange},${CB.orange} 2px,#fdba74 2px,#fdba74 4px)`;
  const role = segRole(seg);
  if (role === 'forced')
    return seg.masked
      ? `repeating-linear-gradient(45deg,#f97316,#f97316 3px,#fdba74 3px,#fdba74 6px)`
      : `linear-gradient(135deg,#f97316,#fb923c)`;
  if (seg.masked) {
    if (role === 'system') return CB.slate;
    return `repeating-linear-gradient(45deg,#e2e8f0,#e2e8f0 2px,#f8fafc 2px,#f8fafc 4px)`;
  }
  return wColor(w);
};
