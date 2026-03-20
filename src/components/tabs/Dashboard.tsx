import { useMemo } from 'react';
import type { Rollout, ChartPoint } from '../../types';
import { CB } from '../../constants/colors';
import { METRIC_CFG, PALETTE } from '../../constants/metrics';
import { safeMax, safeMin } from '../../utils/math';
import { fmtIter } from '../../utils/format';
import Chip from '../ui/Chip';
import Panel from '../ui/Panel';
import HelpBox from '../ui/HelpBox';
import SparkLine from '../charts/SparkLine';

interface DashboardProps {
  rows: Rollout[];
  row: Rollout;
}

export default function Dashboard({ rows, row }: DashboardProps) {
  const curIterLabel = row ? fmtIter(row.iteration) : null;

  const { series, allKeys } = useMemo(() => {
    const seen = new Set<string>();
    const pts: Record<string, any>[] = [];
    const keySet = new Set<string>();

    rows.forEach((r) => {
      const it = r.iteration ?? 0;
      const k = it.toFixed(2);
      if (seen.has(k)) return;
      seen.add(k);
      const st = (r.step || r.metadata?.step || {}) as Record<string, unknown>;
      const m = r.metadata || {};
      const point: Record<string, any> = { iter: it, label: fmtIter(it) };

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

    pts.sort((a, b) => a.iter - b.iter);
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
    return result;
  }, [series, allKeys]);

  const accuracy = useMemo(() => {
    const m: Record<number, { c: number; t: number }> = {};
    rows.forEach((r) => {
      const s = Math.floor(r.iteration ?? 0);
      if (!m[s]) m[s] = { c: 0, t: 0 };
      m[s].t++;
      if (r.correct) m[s].c++;
    });
    return Object.entries(m)
      .sort(([a], [b]) => +a - +b)
      .map(([s, v]) => ({ x: fmtIter(+s), y: v.c / v.t }));
  }, [rows]);

  const angleVals = (metricData.weight_angle_avg || []).map((p) => p.y);
  const aStats = angleVals.length
    ? {
        min: safeMin(angleVals),
        max: safeMax(angleVals),
        avg: angleVals.reduce((a, b) => a + b, 0) / angleVals.length,
        last: angleVals[angleVals.length - 1],
        first: angleVals[0],
        mono: angleVals.every((v, i) => i === 0 || v >= angleVals[i - 1] - 0.001),
        sweet: angleVals.filter((v) => v >= 0.5 && v <= 0.7).length,
        death: angleVals.filter((v) => v >= 1.9).length,
      }
    : null;

  const orderedKeys = useMemo(() => {
    const known = Object.keys(METRIC_CFG);
    const heroKeys = allKeys.filter((k) => METRIC_CFG[k]?.hero);
    const knownKeys = allKeys.filter((k) => !METRIC_CFG[k]?.hero && known.includes(k));
    const unknownKeys = allKeys.filter((k) => !known.includes(k));
    return [...heroKeys, ...knownKeys, ...unknownKeys];
  }, [allKeys]);

  if (!series.length) return null;

  return (
    <div>
      <HelpBox>
        All metrics below are <strong>auto-discovered</strong> from the step/metadata fields in your
        JSONL. The <span style={{ color: CB.magenta, fontWeight: 700 }}>magenta marker</span> shows
        the currently selected rollout.
      </HelpBox>

      {aStats && (
        <Panel
          title={`${METRIC_CFG.weight_angle_avg.icon} Rotation Angle (weight_angle_avg)`}
          bc={CB.magenta}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            <Chip
              label="Current"
              value={aStats.last.toFixed(4) + '°'}
              bg="#fdf2f8"
              color={CB.magenta}
            />
            <Chip
              label="Start"
              value={aStats.first.toFixed(4) + '°'}
              bg="#f1f5f9"
              color={CB.slate}
            />
            <Chip label="Min" value={aStats.min.toFixed(4) + '°'} bg="#f0fdf4" color={CB.green} />
            <Chip
              label="Max"
              value={aStats.max.toFixed(4) + '°'}
              bg={aStats.max >= 1.9 ? '#fef2f2' : '#f0fdf4'}
              color={aStats.max >= 1.9 ? CB.red : CB.green}
            />
            <Chip
              label="Monotonic"
              value={aStats.mono ? 'Yes' : 'No'}
              bg={aStats.mono ? '#f0fdf4' : '#fef2f2'}
              color={aStats.mono ? CB.green : CB.red}
            />
            <Chip
              label="In sweet"
              value={`${aStats.sweet}/${angleVals.length}`}
              bg="#f0fdf4"
              color={CB.green}
            />
            <Chip
              label="In death"
              value={`${aStats.death}/${angleVals.length}`}
              bg={aStats.death ? '#fef2f2' : '#f0fdf4'}
              color={aStats.death ? CB.red : CB.green}
            />
          </div>
          <SparkLine
            points={metricData.weight_angle_avg}
            color={CB.magenta}
            label="weight_angle_avg"
            unit="°"
            zones={METRIC_CFG.weight_angle_avg.zones}
            highlightX={curIterLabel}
          />
        </Panel>
      )}

      {orderedKeys
        .filter((k) => k !== 'weight_angle_avg')
        .map((key, idx) => {
          const cfg = METRIC_CFG[key];
          const color = cfg?.color || PALETTE[idx % PALETTE.length];
          const pts = metricData[key];
          if (!pts) return null;
          return (
            <Panel key={key} title={`${cfg?.icon || '📊'} ${key}`} bc={color}>
              {cfg?.help && <HelpBox>{cfg.help}</HelpBox>}
              <SparkLine
                points={pts}
                color={color}
                label={key}
                unit={cfg?.unit}
                zones={cfg?.zones}
                highlightX={curIterLabel}
              />
            </Panel>
          );
        })}

      <Panel title="🎯 Accuracy (per-step)" bc={CB.green}>
        <SparkLine
          points={accuracy}
          color={CB.green}
          label="accuracy"
          yRange={[0, 1]}
          highlightX={curIterLabel}
        />
      </Panel>
    </div>
  );
}
