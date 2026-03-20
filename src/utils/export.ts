import type { Rollout } from '../types';
import { fmtIter } from './format';

function downloadText(text: string, name: string, mime = 'text/plain') {
  const b = new Blob([text], { type: mime });
  const u = URL.createObjectURL(b);
  const a = document.createElement('a');
  a.href = u;
  a.download = name;
  a.click();
  URL.revokeObjectURL(u);
}

export function exportCSV(rows: Rollout[], sel: number[]) {
  const s = sel && sel.length ? sel.map(i => rows[i]).filter(Boolean) : rows;
  const h = ['row', 'iteration', 'correct', 'reward', 'advantage', 'view', 'shaped', 'angle'];
  const l = [h.join(',')];
  s.forEach((r, i) => {
    const m = r.metadata || {};
    const st = (r.step || m.step || {}) as Record<string, number>;
    l.push([
      i + 1,
      fmtIter(r.iteration),
      r.correct ? '1' : '0',
      (r.reward ?? 0).toFixed(4),
      (r.advantage ?? 0).toFixed(4),
      m._view_name || '',
      (m._esc_shaped_reward ?? 0).toFixed(4),
      (st.weight_angle_avg ?? 0).toFixed(6),
    ].join(','));
  });
  downloadText(l.join('\n'), `rollouts_${s.length}.csv`, 'text/csv');
}

export function exportJSONL(rows: Rollout[], sel: number[]) {
  const s = sel && sel.length ? sel.map(i => rows[i]).filter(Boolean) : rows;
  downloadText(s.map(r => JSON.stringify(r)).join('\n'), `rollouts_${s.length}.jsonl`, 'application/jsonl');
}
