import { useMemo } from 'react';
import type { Rollout, ChartPoint } from '../../types';
import { CB } from '../../constants/colors';
import { METRIC_CFG } from '../../constants/metrics';
import { fmtIter } from '../../utils/format';
import { isForced } from '../../utils/data';
import HelpBox from '../ui/HelpBox';
import DashboardSection from './DashboardSection';

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

  /* ═══ All metric chart data (step metrics + rollout-derived) ═══ */
  const metricData = useMemo(() => {
    const result: Record<string, ChartPoint[]> = {};

    // Step-level metrics from series
    allKeys.forEach((key) => {
      const pts = series
        .filter((p) => p[key] != null)
        .map((p) => ({ x: p.label as string, y: p[key] as number }));
      if (pts.length > 0) result[key] = pts;
    });

    // ── Rollout-derived: step-aggregated metrics ──
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
    if (accPts.length > 0) result.accuracy = accPts;

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
    const forcedPts = sortedSteps
      .map((s) => ({
        x: fmtIter(s),
        y: stepBuckets[s].total > 0 ? stepBuckets[s].forced / stepBuckets[s].total : 0,
      }))
      .filter((p) => p.y > 0 || sortedSteps.some((st) => stepBuckets[st].forced > 0));
    if (forcedPts.length > 0) result.forced_rate = forcedPts;

    // ── Rollout-derived: per-iteration metrics ──
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
      const meta = r.metadata || {};

      // Generated tokens
      const gen = tc.generated ?? tc.total_completion;
      if (gen != null) genTokPts.push({ x: label, y: gen });

      // Total tokens
      const total = tc.total_completion;
      if (total != null) totalTokPts.push({ x: label, y: total });

      // Scaffold ratio (generated / scaffold)
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

      // n_eff
      if (meta._esc_n_eff != null) {
        nEffPts.push({ x: label, y: meta._esc_n_eff as number });
      }

      // shaped_reward
      if (meta._esc_shaped_reward != null) {
        shapedPts.push({ x: label, y: meta._esc_shaped_reward as number });
      }
    });

    // Sort per-iteration series by iteration
    const sortByX = (pts: ChartPoint[]) =>
      pts.sort((a, b) => parseFloat(String(a.x)) - parseFloat(String(b.x)));

    if (genTokPts.length > 0) result.generated_tokens = sortByX(genTokPts);
    if (totalTokPts.length > 0) result.total_tokens = sortByX(totalTokPts);
    if (scaffoldRatioPts.length > 0) result.scaffold_ratio = sortByX(scaffoldRatioPts);
    if (nEffPts.length > 0) result.n_eff = sortByX(nEffPts);
    if (shapedPts.length > 0) result.shaped_reward = sortByX(shapedPts);

    return result;
  }, [series, allKeys, rows]);

  /* ═══ Group all keys into sections ═══ */
  const sections = useMemo(() => {
    // Collect all keys that have data
    const allMetricKeys = new Set([...allKeys]);
    for (const rk of ROLLOUT_KEYS) {
      if (metricData[rk]) allMetricKeys.add(rk);
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
        <strong>auto-discovered</strong> step metrics and <strong>rollout-derived</strong> charts
        (accuracy, rewards, forced rate, token counts, scaffold reliance). The{' '}
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
