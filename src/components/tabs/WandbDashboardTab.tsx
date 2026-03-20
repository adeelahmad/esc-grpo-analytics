import { useMemo } from 'react';
import type { Rollout, ChartPoint } from '../../types';
import { CB } from '../../constants/colors';
import { METRIC_CFG } from '../../constants/metrics';
import { fmtIter } from '../../utils/format';
import HelpBox from '../ui/HelpBox';
import DashboardSection from './DashboardSection';

interface WandbDashboardTabProps {
  rows: Rollout[];
  row: Rollout;
}

const SECTION_RULES: { id: string; label: string; match: (k: string) => boolean }[] = [
  {
    id: 'charts',
    label: 'Charts',
    match: (k) =>
      [
        'loss',
        'grad_norm',
        'entropy',
        'policy_loss',
        'value_loss',
        'clip_fraction',
        'approx_kl',
        'explained_var',
        'perplexity',
        'tok_per_sec',
        'learning_rate',
        'lr',
        'progress',
        'accuracy',
      ].includes(k),
  },
  {
    id: 'rewards',
    label: 'Rewards',
    match: (k) => k.includes('reward') || k.includes('advantage'),
  },
  {
    id: 'kl',
    label: 'KL Divergence',
    match: (k) => k.startsWith('kl') || k === 'kl_div',
  },
  {
    id: 'weights',
    label: 'Weight Metrics',
    match: (k) => k.includes('weight') || k.includes('angle'),
  },
  { id: 'other', label: 'Other Metrics', match: () => true },
];

export default function WandbDashboardTab({ rows, row }: WandbDashboardTabProps) {
  const curIterLabel = row ? fmtIter(row.iteration) : null;

  const { series, allKeys } = useMemo(() => {
    const seen = new Set<string>();
    const pts: Record<string, unknown>[] = [];
    const keySet = new Set<string>();

    rows.forEach((r) => {
      const it = r.iteration ?? 0;
      const k = it.toFixed(2);
      if (seen.has(k)) return;
      seen.add(k);
      const st = (r.step || r.metadata?.step || {}) as Record<string, unknown>;
      const m = r.metadata || {};
      const point: Record<string, unknown> = { iter: it, label: fmtIter(it) };

      Object.entries(st).forEach(([key, val]) => {
        if (typeof val === 'number' && isFinite(val)) {
          point[key] = val;
          keySet.add(key);
        }
      });

      if (m.weight_angle_avg != null && point.weight_angle_avg == null) {
        point.weight_angle_avg = m.weight_angle_avg;
        keySet.add('weight_angle_avg');
      }
      if (point.mean_reward == null && r.reward != null) {
        point.mean_reward = r.reward;
        keySet.add('mean_reward');
      }
      pts.push(point);
    });

    pts.sort((a, b) => (a.iter as number) - (b.iter as number));
    return { series: pts, allKeys: [...keySet] };
  }, [rows]);

  const metricData = useMemo(() => {
    const result: Record<string, ChartPoint[]> = {};
    allKeys.forEach((key) => {
      const pts = series
        .filter((p) => p[key] != null)
        .map((p) => ({ x: p.label as string, y: p[key] as number }));
      if (pts.length > 0) result[key] = pts;
    });

    // Compute accuracy as a derived metric
    const accMap: Record<number, { c: number; t: number }> = {};
    rows.forEach((r) => {
      const s = Math.floor(r.iteration ?? 0);
      if (!accMap[s]) accMap[s] = { c: 0, t: 0 };
      accMap[s].t++;
      if (r.correct) accMap[s].c++;
    });
    const accPts = Object.entries(accMap)
      .sort(([a], [b]) => +a - +b)
      .map(([s, v]) => ({ x: fmtIter(+s), y: v.c / v.t }));
    if (accPts.length > 0) result.accuracy = accPts;

    return result;
  }, [series, allKeys, rows]);

  const sections = useMemo(() => {
    const keysWithAccuracy = metricData.accuracy ? [...allKeys, 'accuracy'] : allKeys;

    const known = Object.keys(METRIC_CFG);
    const heroKeys = keysWithAccuracy.filter((k) => METRIC_CFG[k]?.hero);
    const knownKeys = keysWithAccuracy.filter((k) => !METRIC_CFG[k]?.hero && known.includes(k));
    const unknownKeys = keysWithAccuracy.filter((k) => !known.includes(k) && k !== 'accuracy');
    const ordered = [
      ...heroKeys,
      ...knownKeys,
      ...(metricData.accuracy && !known.includes('accuracy') ? ['accuracy'] : []),
      ...unknownKeys,
    ];

    const grouped: { id: string; label: string; keys: string[] }[] = [];
    const assigned = new Set<string>();

    for (const rule of SECTION_RULES) {
      const keys = ordered.filter((k) => !assigned.has(k) && rule.match(k));
      if (keys.length > 0) {
        grouped.push({ id: rule.id, label: rule.label, keys });
        keys.forEach((k) => assigned.add(k));
      }
    }

    return grouped;
  }, [allKeys, metricData]);

  if (!series.length) return null;

  let keyOffset = 0;

  return (
    <div style={{ paddingBottom: 40 }}>
      <HelpBox>
        All metrics below are <strong>auto-discovered</strong> from the step/metadata fields in your
        JSONL. Organized in a grid layout with collapsible sections. The{' '}
        <span style={{ color: CB.magenta, fontWeight: 700 }}>magenta marker</span> shows the
        currently selected rollout.
      </HelpBox>

      {sections.map((section) => {
        const offset = keyOffset;
        keyOffset += section.keys.length;
        return (
          <DashboardSection
            key={section.id}
            title={section.label}
            metrics={section.keys}
            metricData={metricData}
            highlightX={curIterLabel}
            keyOffset={offset}
          />
        );
      })}
    </div>
  );
}
