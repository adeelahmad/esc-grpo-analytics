import { useMemo } from 'react';
import { useAppState } from '../context/AppContext';
import { isForced } from '../utils/data';
import type { BatchStepNode } from '../types';

export function useBatchTree(filteredIndices: number[]): BatchStepNode[] {
  const { rows } = useAppState();

  return useMemo(() => {
    const tree: Record<string, BatchStepNode> = {};
    filteredIndices.forEach((i) => {
      const r = rows[i],
        iter = r.iteration ?? 0,
        f = isForced(r);
      const step = Math.floor(iter),
        sub = Math.round((iter - step) * 10);
      const type = r.type || 'unknown';
      const sKey = `s${step}`;
      if (!tree[sKey])
        tree[sKey] = { step, subs: {}, rows: [], correct: 0, total: 0, rewards: [], forced: 0 };
      tree[sKey].total++;
      tree[sKey].rewards.push(r.reward ?? 0);
      if (r.correct) tree[sKey].correct++;
      if (f) tree[sKey].forced++;

      if (!tree[sKey].subs[sub])
        tree[sKey].subs[sub] = { sub, types: {}, rows: [], correct: 0, total: 0, forced: 0 };
      tree[sKey].subs[sub].total++;
      if (r.correct) tree[sKey].subs[sub].correct++;
      if (f) tree[sKey].subs[sub].forced++;

      if (!tree[sKey].subs[sub].types[type])
        tree[sKey].subs[sub].types[type] = { type, rowIndices: [], correct: 0, forced: 0 };
      tree[sKey].subs[sub].types[type].rowIndices.push(i);
      if (r.correct) tree[sKey].subs[sub].types[type].correct++;
      if (f) tree[sKey].subs[sub].types[type].forced++;
      tree[sKey].rows.push(i);
    });
    return Object.values(tree).sort((a, b) => a.step - b.step);
  }, [filteredIndices, rows]);
}
