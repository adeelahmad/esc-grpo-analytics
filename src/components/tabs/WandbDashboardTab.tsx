import { useMemo } from 'react';
import type { Rollout, ChartPoint } from '../../types';
import { CB } from '../../constants/colors';
import { METRIC_CFG, PALETTE } from '../../constants/metrics';
import { fmtIter } from '../../utils/format';
import { isForced } from '../../utils/data';
import HelpBox from '../ui/HelpBox';
import DashboardSection from './DashboardSection';
import type { MetricMeta } from './DashboardSection';

interface WandbDashboardTabProps {
  rows: Rollout[];
  row: Rollout;
}

const ROLLOUT_KEYS = [
  'accuracy',
  'reward_per_step',
  'advantage_per_step',
  'reward_std_per_step',
  'forced_rate',
  'generated_tokens',
  'total_tokens',
  'scaffold_ratio',
  'n_eff',
  'shaped_reward',
  'length_vs_reward',
];

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
      ].includes(k),
  },
  {
    id: 'rollouts',
    label: 'Rollouts',
    match: (k) => ROLLOUT_KEYS.includes(k),
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
  {
    id: 'type',
    label: 'Type',
    match: (k) => k.startsWith('type:'),
  },
  {
    id: 'view',
    label: 'View',
    match: (k) => k.startsWith('view:'),
  },
  { id: 'other', label: 'Other Metrics', match: () => true },
];

export default function WandbDashboardTab({ rows, row }: WandbDashboardTabProps) {
  const curIterLabel = row ? fmtIter(row.iteration) : null;

  /* ═══ Step-level metrics from step/metadata ═══ */
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

  /* ═══ All metric chart data ═══ */
  const { metricData, metricMeta } = useMemo(() => {
    const result: Record<string, ChartPoint[]> = {};
    const meta: Record<string, MetricMeta> = {};

    // Step-level metrics from series
    allKeys.forEach((key) => {
      const pts = series
        .filter((p) => p[key] != null)
        .map((p) => ({ x: p.label as string, y: p[key] as number }));
      if (pts.length > 0) result[key] = pts;
    });

    // ── Step-aggregated rollout metrics ──
    const stepBuckets: Record<
      number,
      {
        rewards: number[];
        advantages: number[];
        correct: number;
        total: number;
        forced: number;
      }
    > = {};

    rows.forEach((r) => {
      const s = Math.floor(r.iteration ?? 0);
      if (!stepBuckets[s])
        stepBuckets[s] = { rewards: [], advantages: [], correct: 0, total: 0, forced: 0 };
      const b = stepBuckets[s];
      b.rewards.push(r.reward ?? 0);
      b.advantages.push(r.advantage ?? 0);
      b.total++;
      if (r.correct) b.correct++;
      if (isForced(r)) b.forced++;
    });

    const sortedSteps = Object.keys(stepBuckets)
      .map(Number)
      .sort((a, b) => a - b);

    // Accuracy per step
    const accPts = sortedSteps.map((s) => ({
      x: fmtIter(s),
      y: stepBuckets[s].total > 0 ? stepBuckets[s].correct / stepBuckets[s].total : 0,
    }));
    if (accPts.length > 0) {
      result.accuracy = accPts;
      meta.accuracy = { yRange: [0, 1] };
    }

    // Mean reward per step
    const rwPts = sortedSteps.map((s) => {
      const rws = stepBuckets[s].rewards;
      return { x: fmtIter(s), y: rws.reduce((a, b) => a + b, 0) / rws.length };
    });
    if (rwPts.length > 0) result.reward_per_step = rwPts;

    // Mean advantage per step
    const advPts = sortedSteps.map((s) => {
      const advs = stepBuckets[s].advantages;
      return { x: fmtIter(s), y: advs.reduce((a, b) => a + b, 0) / advs.length };
    });
    if (advPts.length > 0) result.advantage_per_step = advPts;

    // Reward std per step
    const stdPts = sortedSteps.map((s) => {
      const rws = stepBuckets[s].rewards;
      const mean = rws.reduce((a, b) => a + b, 0) / rws.length;
      const variance = rws.reduce((a, v) => a + (v - mean) ** 2, 0) / rws.length;
      return { x: fmtIter(s), y: Math.sqrt(variance) };
    });
    if (stdPts.length > 0) result.reward_std_per_step = stdPts;

    // Forced rate per step
    const hasAnyForced = sortedSteps.some((st) => stepBuckets[st].forced > 0);
    if (hasAnyForced) {
      const forcedPts = sortedSteps.map((s) => ({
        x: fmtIter(s),
        y: stepBuckets[s].total > 0 ? stepBuckets[s].forced / stepBuckets[s].total : 0,
      }));
      result.forced_rate = forcedPts;
      meta.forced_rate = { yRange: [0, 1] };
    }

    // ── Per-iteration metrics ──
    const iterSeen = new Set<string>();
    const genTokPts: ChartPoint[] = [];
    const totalTokPts: ChartPoint[] = [];
    const scaffoldRatioPts: ChartPoint[] = [];
    const nEffPts: ChartPoint[] = [];
    const shapedPts: ChartPoint[] = [];

    rows.forEach((r) => {
      const it = r.iteration ?? 0;
      const k = it.toFixed(2);
      if (iterSeen.has(k)) return;
      iterSeen.add(k);
      const label = fmtIter(it);
      const tc = r.token_counts || {};
      const rm = r.metadata || {};

      const gen = tc.generated ?? tc.total_completion;
      if (gen != null) genTokPts.push({ x: label, y: gen });

      const total = tc.total_completion;
      if (total != null) totalTokPts.push({ x: label, y: total });

      const segs = r.segments || [];
      const scafTok = segs
        .filter((s) => (s.tag || '').startsWith('scaffold'))
        .reduce((a, s) => a + (s.token_count || 0), 0);
      const genSeg = segs
        .filter((s) => (s.tag || '').startsWith('cycle') || s.tag === 'thinking')
        .reduce((a, s) => a + (s.token_count || 0), 0);
      if (scafTok > 0 || genSeg > 0) {
        const ratio = scafTok > 0 ? genSeg / scafTok : genSeg > 0 ? 999 : 0;
        scaffoldRatioPts.push({ x: label, y: ratio });
      }

      if (rm._esc_n_eff != null) nEffPts.push({ x: label, y: rm._esc_n_eff as number });
      if (rm._esc_shaped_reward != null)
        shapedPts.push({ x: label, y: rm._esc_shaped_reward as number });
    });

    const sortByX = (pts: ChartPoint[]) =>
      pts.sort((a, b) => parseFloat(String(a.x)) - parseFloat(String(b.x)));

    if (genTokPts.length > 0) result.generated_tokens = sortByX(genTokPts);
    if (totalTokPts.length > 0) result.total_tokens = sortByX(totalTokPts);
    if (scaffoldRatioPts.length > 0) result.scaffold_ratio = sortByX(scaffoldRatioPts);
    if (nEffPts.length > 0) result.n_eff = sortByX(nEffPts);
    if (shapedPts.length > 0) result.shaped_reward = sortByX(shapedPts);

    // ── Length vs Reward (scatter) ──
    const lrPts = rows
      .map((r, i) => {
        const tc = r.token_counts || {};
        const genTok = tc.generated ?? tc.total_completion ?? 0;
        return { x: genTok, y: r.reward ?? 0, ok: r.correct, label: `Row ${i + 1}` };
      })
      .filter((p) => (p.x as number) > 0);
    if (lrPts.length > 2) {
      result.length_vs_reward = lrPts;
      meta.length_vs_reward = { scatter: true, xLabel: 'Generated tokens', yLabel: 'Reward' };
    }

    // ── Per-view charts (accuracy & reward over time) ──
    const viewSteps: Record<
      string,
      Record<number, { rewards: number[]; correct: number; total: number }>
    > = {};
    rows.forEach((r) => {
      const v = ((r.metadata || {}) as Record<string, unknown>)._view_name as string | undefined;
      if (!v) return;
      const s = Math.floor(r.iteration ?? 0);
      if (!viewSteps[v]) viewSteps[v] = {};
      if (!viewSteps[v][s]) viewSteps[v][s] = { rewards: [], correct: 0, total: 0 };
      const b = viewSteps[v][s];
      b.rewards.push(r.reward ?? 0);
      b.total++;
      if (r.correct) b.correct++;
    });

    const viewNames = Object.keys(viewSteps).sort();
    viewNames.forEach((v, vi) => {
      const steps = Object.keys(viewSteps[v])
        .map(Number)
        .sort((a, b) => a - b);
      if (steps.length < 1) return;

      const accKey = `view:${v}_accuracy`;
      const rwKey = `view:${v}_reward`;

      result[accKey] = steps.map((s) => ({
        x: fmtIter(s),
        y: viewSteps[v][s].total > 0 ? viewSteps[v][s].correct / viewSteps[v][s].total : 0,
      }));
      meta[accKey] = { yRange: [0, 1] };

      result[rwKey] = steps.map((s) => {
        const rws = viewSteps[v][s].rewards;
        return { x: fmtIter(s), y: rws.reduce((a, b) => a + b, 0) / rws.length };
      });

      meta[accKey] = {
        ...meta[accKey],
        icon: '🏆',
        color: PALETTE[vi % PALETTE.length],
      };
      meta[rwKey] = {
        icon: '🎯',
        color: PALETTE[(vi + 1) % PALETTE.length],
      };
    });

    // ── Per-type charts (accuracy & reward over time) ──
    const typeSteps: Record<
      string,
      Record<number, { rewards: number[]; correct: number; total: number }>
    > = {};
    rows.forEach((r) => {
      const t = r.type;
      if (!t) return;
      const s = Math.floor(r.iteration ?? 0);
      if (!typeSteps[t]) typeSteps[t] = {};
      if (!typeSteps[t][s]) typeSteps[t][s] = { rewards: [], correct: 0, total: 0 };
      const b = typeSteps[t][s];
      b.rewards.push(r.reward ?? 0);
      b.total++;
      if (r.correct) b.correct++;
    });

    const typeNames = Object.keys(typeSteps).sort();
    typeNames.forEach((t, ti) => {
      const steps = Object.keys(typeSteps[t])
        .map(Number)
        .sort((a, b) => a - b);
      if (steps.length < 1) return;

      const accKey = `type:${t}_accuracy`;
      const rwKey = `type:${t}_reward`;

      result[accKey] = steps.map((s) => ({
        x: fmtIter(s),
        y: typeSteps[t][s].total > 0 ? typeSteps[t][s].correct / typeSteps[t][s].total : 0,
      }));
      meta[accKey] = { yRange: [0, 1] };

      result[rwKey] = steps.map((s) => {
        const rws = typeSteps[t][s].rewards;
        return { x: fmtIter(s), y: rws.reduce((a, b) => a + b, 0) / rws.length };
      });

      meta[accKey] = {
        ...meta[accKey],
        icon: '📋',
        color: PALETTE[(ti + 4) % PALETTE.length],
      };
      meta[rwKey] = {
        icon: '🎯',
        color: PALETTE[(ti + 5) % PALETTE.length],
      };
    });

    return { metricData: result, metricMeta: meta };
  }, [series, allKeys, rows]);

  /* ═══ Group all keys into sections ═══ */
  const sections = useMemo(() => {
    const allMetricKeys = new Set([...allKeys]);
    for (const k of Object.keys(metricData)) {
      allMetricKeys.add(k);
    }
    const allKeysArr = [...allMetricKeys];

    const known = Object.keys(METRIC_CFG);
    const heroKeys = allKeysArr.filter((k) => METRIC_CFG[k]?.hero);
    const knownKeys = allKeysArr.filter((k) => !METRIC_CFG[k]?.hero && known.includes(k));
    const unknownKeys = allKeysArr.filter((k) => !known.includes(k));
    const ordered = [...heroKeys, ...knownKeys, ...unknownKeys];

    const grouped: { id: string; label: string; keys: string[] }[] = [];
    const assigned = new Set<string>();

    for (const rule of SECTION_RULES) {
      const keys = ordered.filter((k) => !assigned.has(k) && rule.match(k) && metricData[k]);
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
        Training metrics and rollout analytics in a grid layout. Includes{' '}
        <strong>auto-discovered</strong> step metrics, <strong>rollout-derived</strong> charts
        (accuracy, rewards, forced rate, token counts, scaffold reliance), and{' '}
        <strong>per-view/type</strong> breakdowns. The{' '}
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
            metricMeta={metricMeta}
            highlightX={curIterLabel}
            keyOffset={offset}
          />
        );
      })}
    </div>
  );
}
