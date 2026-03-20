import { useMemo } from 'react';
import type { Rollout, ChartPoint } from '../../types';
import { CB } from '../../constants/colors';
import { fmtIter } from '../../utils/format';
import { isForced, forcedStats } from '../../utils/data';
import { safeMax, safeMin } from '../../utils/math';
import Chip from '../ui/Chip';
import Panel from '../ui/Panel';
import HelpBox from '../ui/HelpBox';
import SparkLine from '../charts/SparkLine';
import ScatterPlot from '../charts/ScatterPlot';

interface StepBucket {
  step: number;
  rewards: number[];
  correct: number;
  total: number;
  forced: number;
}

interface ViewBucket {
  view: string;
  rewards: number[];
  correct: number;
  total: number;
  advantages: number[];
  forced: number;
}

interface RuleStat {
  reason: string;
  count: number;
  totalDelta: number;
  avgEff: number;
  effSum: number;
}

interface LengthRewardPoint {
  x: number;
  y: number;
  ok: boolean | undefined;
  label: string;
}

interface KLRewardPoint {
  x: string;
  kl: number | null;
  rw: number | null;
}

interface ViewWinRate {
  view: string;
  wins: number;
  losses: number;
  total: number;
  forced: number;
  avgAdv: number;
  advSum: number;
  rewards: number[];
  winRate: number;
  avgReward: number;
}

export default function TrendsTab({ rows }: { rows: Rollout[] }) {
  const byStep = useMemo(() => {
    const m: Record<string, StepBucket> = {};
    rows.forEach(r => {
      const s = Math.floor(r.iteration ?? 0);
      if (!m[s]) m[s] = { step: s, rewards: [], correct: 0, total: 0, forced: 0 };
      m[s].rewards.push(r.reward ?? 0);
      m[s].total++;
      if (r.correct) m[s].correct++;
      if (isForced(r)) m[s].forced++;
    });
    return (Object.values(m) as StepBucket[]).sort((a, b) => a.step - b.step);
  }, [rows]);

  const byView = useMemo(() => {
    const m: Record<string, ViewBucket> = {};
    rows.forEach(r => {
      const v = (r.metadata || {} as any)._view_name || "unknown";
      if (!m[v]) m[v] = { view: v, rewards: [], correct: 0, total: 0, advantages: [], forced: 0 };
      m[v].rewards.push(r.reward ?? 0);
      m[v].advantages.push(r.advantage ?? 0);
      m[v].total++;
      if (r.correct) m[v].correct++;
      if (isForced(r)) m[v].forced++;
    });
    return Object.values(m) as ViewBucket[];
  }, [rows]);

  const totalForced = rows.filter(r => isForced(r)).length;
  const forcedRate = rows.length > 0 ? totalForced / rows.length : 0;

  const ruleStats = useMemo(() => {
    const m: Record<string, RuleStat> = {};
    rows.forEach(r => {
      ((r.metadata || {} as any)?.token_changes || []).forEach((c: any) => {
        const reason = c.match_reason || "(no reason)";
        if (!m[reason]) m[reason] = { reason, count: 0, totalDelta: 0, avgEff: 0, effSum: 0 };
        m[reason].count++;
        m[reason].totalDelta += (c.after_weight ?? 0) - (c.before_weight ?? 0);
        m[reason].effSum += (c.effective_multiplier ?? 0);
      });
    });
    Object.values(m).forEach((v: any) => { v.avgEff = v.count > 0 ? v.effSum / v.count : 0; });
    return (Object.values(m) as RuleStat[]).sort((a, b) => b.count - a.count);
  }, [rows]);

  const lengthReward = useMemo(() => {
    return rows.map((r, i) => {
      const tc = r.token_counts || {};
      const genTok = tc.generated ?? tc.total_completion ?? 0;
      return { x: genTok, y: r.reward ?? 0, ok: r.correct, label: `Row ${i + 1}` } as LengthRewardPoint;
    }).filter(p => p.x > 0);
  }, [rows]);

  const scaffoldTrend = useMemo(() => {
    const seen = new Set<string>(), pts: ChartPoint[] = [];
    rows.forEach(r => {
      const iter = r.iteration ?? 0, k = iter.toFixed(2);
      if (seen.has(k)) return; seen.add(k);
      const segs = r.segments || [];
      const scafTok = segs.filter(s => (s.tag || "").startsWith("scaffold")).reduce((a, s) => a + (s.token_count || 0), 0);
      const genTok = segs.filter(s => (s.tag || "").startsWith("cycle") || s.tag === "thinking").reduce((a, s) => a + (s.token_count || 0), 0);
      const ratio = scafTok > 0 ? genTok / scafTok : genTok > 0 ? 999 : 0;
      pts.push({ x: fmtIter(iter), y: ratio });
    });
    pts.sort((a, b) => parseFloat(String(a.x)) - parseFloat(String(b.x)));
    return pts;
  }, [rows]);

  const klRewardDual = useMemo(() => {
    const seen = new Set<string>(), pts: KLRewardPoint[] = [];
    rows.forEach(r => {
      const iter = r.iteration ?? 0, k = iter.toFixed(2);
      if (seen.has(k)) return; seen.add(k);
      const st = (r.step || r.metadata?.step || {}) as Record<string, any>;
      const kl = st.kl ?? null;
      const rw = st.mean_reward ?? r.reward ?? null;
      if (kl != null || rw != null) pts.push({ x: fmtIter(iter), kl, rw });
    });
    pts.sort((a, b) => parseFloat(a.x) - parseFloat(b.x));
    return pts;
  }, [rows]);

  const viewWinRates = useMemo(() => {
    const m: Record<string, any> = {};
    rows.forEach(r => {
      const v = (r.metadata || {} as any)._view_name || "unknown";
      const forced = !!(r.metadata || {} as any)._esc_forced_answer;
      if (!m[v]) m[v] = { view: v, wins: 0, losses: 0, total: 0, forced: 0, avgAdv: 0, advSum: 0, rewards: [], winRate: 0, avgReward: 0 };
      m[v].total++;
      if (r.correct) m[v].wins++; else m[v].losses++;
      if (forced) m[v].forced++;
      m[v].advSum += (r.advantage ?? 0);
      m[v].rewards.push(r.reward ?? 0);
    });
    Object.values(m).forEach((v: any) => {
      v.avgAdv = v.total > 0 ? v.advSum / v.total : 0;
      v.winRate = v.total > 0 ? v.wins / v.total : 0;
      v.avgReward = v.total > 0 ? v.rewards.reduce((a: number, b: number) => a + b, 0) / v.total : 0;
    });
    return (Object.values(m) as ViewWinRate[]).sort((a, b) => b.winRate - a.winRate);
  }, [rows]);

  const totalChanges = ruleStats.reduce((a, r) => a + r.count, 0);

  /* --- Derived chart data --- */
  const stepRewardPts: ChartPoint[] = byStep.map((s: StepBucket) => ({
    x: String(s.step),
    y: s.rewards.reduce((a: number, b: number) => a + b, 0) / s.rewards.length,
  }));
  const stepAccPts: ChartPoint[] = byStep.map((s: StepBucket) => ({
    x: String(s.step),
    y: s.total > 0 ? s.correct / s.total : 0,
  }));
  const forcedPerStep: ChartPoint[] = byStep.filter((s: StepBucket) => s.forced > 0).map((s: StepBucket) => ({
    x: String(s.step),
    y: s.forced / s.total,
  }));

  const klPts: ChartPoint[] = klRewardDual.filter((p: KLRewardPoint) => p.kl != null).map((p: KLRewardPoint) => ({ x: p.x, y: p.kl as number }));
  const rwPts: ChartPoint[] = klRewardDual.filter((p: KLRewardPoint) => p.rw != null).map((p: KLRewardPoint) => ({ x: p.x, y: p.rw as number }));

  const hasKL = klPts.length > 1;

  /* KL-reward correlation */
  const klRwCorr = useMemo(() => {
    const pairs = klRewardDual.filter((p: KLRewardPoint) => p.kl != null && p.rw != null);
    if (pairs.length < 3) return null;
    const xs = pairs.map((p: KLRewardPoint) => p.kl as number);
    const ys = pairs.map((p: KLRewardPoint) => p.rw as number);
    const n = pairs.length;
    const sx = xs.reduce((a: number, b: number) => a + b, 0);
    const sy = ys.reduce((a: number, b: number) => a + b, 0);
    const sxy = pairs.reduce((a: number, p: KLRewardPoint, i: number) => a + xs[i] * ys[i], 0);
    const sxx = xs.reduce((a: number, v: number) => a + v * v, 0);
    const syy = ys.reduce((a: number, v: number) => a + v * v, 0);
    const denom = Math.sqrt((n * sxx - sx * sx) * (n * syy - sy * sy));
    return denom > 0 ? (n * sxy - sx * sy) / denom : 0;
  }, [klRewardDual]);

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* 1. HelpBox */}
      <HelpBox>
        <strong>Trends & RL Analytics</strong> — aggregated views across all rollouts.
        Step-level accuracy, reward curves, forced-answer rates, scaffold reliance, KL divergence tracking,
        and per-view win rates. Use these to diagnose training dynamics and spot regressions.
      </HelpBox>

      {/* 2. Forced Answer Summary */}
      {totalForced > 0 && (
        <Panel title="💉 Forced Answer Summary" bc="#f97316">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            <Chip label="Total Forced" value={totalForced} bg="#fff7ed" color="#c2410c" />
            <Chip label="Forced Rate" value={`${(forcedRate * 100).toFixed(1)}%`} bg={forcedRate > 0.3 ? '#fef2f2' : '#fff7ed'} color={forcedRate > 0.3 ? CB.red : '#c2410c'} />
            <Chip label="Total Rows" value={rows.length} bg="#f1f5f9" color={CB.slate} />
          </div>
          {forcedPerStep.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#9a3412', marginBottom: 4, textTransform: 'uppercase' }}>Forced rate per step</div>
              <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 60, background: '#f8fafc', borderRadius: 6, padding: '6px 8px', border: '1px solid #e2e8f0' }}>
                {forcedPerStep.map((p, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div style={{
                      width: '100%',
                      maxWidth: 28,
                      height: Math.max(4, p.y * 48),
                      background: p.y > 0.5 ? CB.red : p.y > 0.2 ? CB.orange : CB.yellow,
                      borderRadius: 3,
                      transition: 'height 0.2s',
                    }} title={`Step ${p.x}: ${(p.y * 100).toFixed(1)}%`} />
                    <div style={{ fontSize: 7, color: '#94a3b8' }}>{p.x}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>
      )}

      {/* 3. Step Aggregates */}
      <Panel title="📊 Step Aggregates" bc={CB.blue}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <Chip label="Steps" value={byStep.length} bg="#eff6ff" color={CB.blue} />
          <Chip label="Avg Reward" value={rows.length > 0 ? (rows.reduce((a, r) => a + (r.reward ?? 0), 0) / rows.length).toFixed(3) : '—'} bg="#f0fdf4" color={CB.green} />
          <Chip label="Accuracy" value={rows.length > 0 ? `${(rows.filter(r => r.correct).length / rows.length * 100).toFixed(1)}%` : '—'} bg="#f0fdf4" color={CB.green} />
          <Chip label="Total Rows" value={rows.length} bg="#f1f5f9" color={CB.slate} />
        </div>
        {stepRewardPts.length > 1 && (
          <SparkLine points={stepRewardPts} color={CB.blue} label="Mean reward per step" />
        )}
        {stepAccPts.length > 1 && (
          <SparkLine points={stepAccPts} color={CB.green} label="Accuracy per step" yRange={[0, 1]} />
        )}
        {byStep.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
            {byStep.map((s: StepBucket) => {
              const acc = s.total > 0 ? s.correct / s.total : 0;
              const avgR = s.rewards.reduce((a: number, b: number) => a + b, 0) / s.rewards.length;
              return (
                <div key={s.step} style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 6,
                  padding: '6px 10px',
                  minWidth: 80,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: CB.blue }}>Step {s.step}</div>
                  <div style={{ fontSize: 11, color: '#334155' }}>{s.total} rows · {(acc * 100).toFixed(0)}% acc</div>
                  <div style={{ fontSize: 10, color: avgR > 0 ? CB.green : CB.red, fontWeight: 600 }}>R̄ {avgR.toFixed(3)}</div>
                  {s.forced > 0 && <div style={{ fontSize: 9, color: '#c2410c' }}>💉 {s.forced} forced</div>}
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* 4. Rule Effectiveness */}
      {ruleStats.length > 0 && (
        <Panel title="⚙️ Rule Effectiveness" bc={CB.purple}>
          <div style={{ fontSize: 10, color: '#64748b', marginBottom: 8 }}>
            {totalChanges} token changes across {ruleStats.length} rules
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {ruleStats.map((r: RuleStat) => {
              const pct = totalChanges > 0 ? r.count / totalChanges : 0;
              return (
                <div key={r.reason} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 10, color: '#334155', minWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }} title={r.reason}>
                    {r.reason}
                  </div>
                  <div style={{ flex: 1, height: 14, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden', position: 'relative' as const }}>
                    <div style={{
                      width: `${pct * 100}%`,
                      height: '100%',
                      background: r.totalDelta > 0 ? CB.green : r.totalDelta < 0 ? CB.red : CB.grey,
                      borderRadius: 4,
                      transition: 'width 0.3s',
                    }} />
                  </div>
                  <div style={{ fontSize: 9, color: '#64748b', minWidth: 60, textAlign: 'right' as const, fontFamily: 'var(--font-mono)' }}>
                    {r.count} ({(pct * 100).toFixed(1)}%)
                  </div>
                  <div style={{ fontSize: 9, color: r.avgEff > 1 ? CB.green : r.avgEff < 1 ? CB.orange : '#64748b', minWidth: 50, textAlign: 'right' as const, fontFamily: 'var(--font-mono)' }}>
                    ×{r.avgEff.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {/* 5. Length vs Reward */}
      {lengthReward.length > 2 && (
        <Panel title="📏 Length vs Reward" bc={CB.cyan}>
          <ScatterPlot
            points={lengthReward as ChartPoint[]}
            xLabel="Generated tokens"
            yLabel="Reward"
            title="Token length vs reward — looking for reward hacking"
            color={CB.cyan}
            trendLine
          />
        </Panel>
      )}

      {/* 6. Scaffold Reliance */}
      {scaffoldTrend.length > 1 && (
        <Panel title="🔧 Scaffold Reliance" bc={CB.orange}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <Chip label="Start Ratio" value={scaffoldTrend[0].y === 999 ? '∞' : scaffoldTrend[0].y.toFixed(2)} bg="#fff7ed" color={CB.orange} />
            <Chip label="End Ratio" value={scaffoldTrend[scaffoldTrend.length - 1].y === 999 ? '∞' : scaffoldTrend[scaffoldTrend.length - 1].y.toFixed(2)} bg="#fff7ed" color={CB.orange} />
            <Chip label="Points" value={scaffoldTrend.length} bg="#f1f5f9" color={CB.slate} />
          </div>
          <SparkLine
            points={scaffoldTrend}
            color={CB.orange}
            label="Generated / Scaffold token ratio over time"
          />
        </Panel>
      )}

      {/* 7. KL vs Reward Dual Track */}
      {klRewardDual.length > 1 && hasKL && (
        <Panel title="📈 KL vs Reward Dual Track" bc={CB.magenta}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            {klRwCorr != null && (
              <>
                <Chip label="Correlation" value={klRwCorr.toFixed(3)} bg={Math.abs(klRwCorr) > 0.7 ? '#fef2f2' : '#f0fdf4'} color={Math.abs(klRwCorr) > 0.7 ? CB.red : CB.green} />
                <Chip label="Signal" value={Math.abs(klRwCorr) > 0.7 ? '⚠️ HIGH' : Math.abs(klRwCorr) > 0.4 ? '⚡ MOD' : '✓ LOW'} bg={Math.abs(klRwCorr) > 0.7 ? '#fef2f2' : '#f0fdf4'} color={Math.abs(klRwCorr) > 0.7 ? CB.red : CB.green} />
              </>
            )}
            <Chip label="KL Points" value={klPts.length} bg="#fdf4ff" color={CB.magenta} />
            <Chip label="Reward Points" value={rwPts.length} bg="#eff6ff" color={CB.blue} />
          </div>
          <SparkLine points={klPts} color={CB.magenta} label="KL divergence" />
          <SparkLine points={rwPts} color={CB.blue} label="Mean reward" />
        </Panel>
      )}

      {/* 8. View Win Rates */}
      {viewWinRates.length > 1 && (
        <Panel title="🏆 View Win Rates" bc={CB.green}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {viewWinRates.map((v: ViewWinRate) => (
              <div key={v.view} style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '8px 12px',
                minWidth: 120,
                flex: '1 1 140px',
                maxWidth: 220,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.view}</div>
                <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden', marginBottom: 4 }}>
                  <div style={{
                    width: `${v.winRate * 100}%`,
                    height: '100%',
                    background: v.winRate > 0.6 ? CB.green : v.winRate > 0.3 ? CB.yellow : CB.red,
                    borderRadius: 4,
                    transition: 'width 0.3s',
                  }} />
                </div>
                <div style={{ fontSize: 10, color: '#475569' }}>
                  {(v.winRate * 100).toFixed(1)}% win · {v.total} rows
                </div>
                <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>
                  R̄ {v.avgReward.toFixed(3)} · Adv̄ {v.avgAdv.toFixed(3)}
                </div>
                {v.forced > 0 && <div style={{ fontSize: 9, color: '#c2410c', marginTop: 2 }}>💉 {v.forced} forced</div>}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* 9. View/Config Summary */}
      <Panel title={`View/Config Summary (${byView.length} types)`} bc={CB.cyan}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>{byView.map(v => {
          const avgR = v.rewards.reduce((a, b) => a + b, 0) / v.rewards.length;
          const avgA = v.advantages.reduce((a, b) => a + b, 0) / v.advantages.length;
          return <div key={v.view} style={{ background: v.view.includes("naked") ? "#fff7ed" : "#eff6ff", padding: 14, borderRadius: 8, border: `1px solid ${v.view.includes("naked") ? "#fed7aa" : "#bfdbfe"}`, minWidth: 180, boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: v.view.includes("naked") ? CB.orange : CB.blue, marginBottom: 8, textTransform: "uppercase" }}>{v.view}</div>
            <div style={{ fontSize: 12, color: "#334155", display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>n:</span><strong>{v.total}</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Accuracy:</span><strong>{Math.round(100 * v.correct / v.total)}%</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #cbd5e1", paddingTop: 4, marginTop: 2 }}><span>Avg R:</span><span style={{ color: avgR > 0 ? CB.green : CB.red, fontWeight: 700 }}>{avgR.toFixed(3)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Avg A:</span><span style={{ color: avgA > 0 ? CB.green : CB.red, fontWeight: 700 }}>{avgA.toFixed(3)}</span></div>
            </div>
          </div>;
        })}</div>
      </Panel>

      {/* 10. Batch View */}
      <Panel title="Batch View (by substep)" bc={CB.yellow}>
        {(() => {
          const batchMap: Record<string, { r: Rollout; i: number }[]> = {};
          rows.forEach((r, i) => {
            const k = fmtIter(r.iteration);
            if (!batchMap[k]) batchMap[k] = [];
            batchMap[k].push({ r, i });
          });
          return <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{Object.entries(batchMap).sort(([a], [b]) => parseFloat(a) - parseFloat(b)).map(([k, items]) =>
            <div key={k} style={{ background: "#fff", padding: "10px 14px", borderRadius: 6, border: "1px solid #e2e8f0", minWidth: 160, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: CB.blue, marginBottom: 4 }}>Iter {k}</div>
              <div style={{ fontSize: 11, color: "#475569", marginBottom: 6 }}>{items.length} rows · <span style={{ color: CB.green, fontWeight: 600 }}>{items.filter(({ r }) => r.correct).length}✓</span>
                {items.length > 0 && <div style={{ marginTop: 2 }}>Avg R=<strong>{((items.reduce((a, { r }) => a + (r.reward ?? 0), 0)) / items.length).toFixed(3)}</strong></div>}
              </div>
              <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>{items.map(({ r, i }) =>
                <div key={i} style={{ width: 10, height: 10, borderRadius: 3, background: r.correct ? CB.green : CB.red, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.1)" }} title={`Row ${i + 1}: R=${(r.reward ?? 0).toFixed(3)}`} />
              )}</div>
            </div>
          )}</div>;
        })()}
      </Panel>
    </div>
  );
}
