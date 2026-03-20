import React, { useState, useMemo, useCallback } from 'react';
import type { Segment, TokenChange, TooltipData, TooltipPos, RoleMapEntry, TokenDetail, ColorMode, SortMode, LegendKey } from '../../types';
import { CB, segRole, RV, proxGrad, wColor, getSegBg } from '../../constants/colors';
import { safeMax, safeMin } from '../../utils/math';
import Chip from '../ui/Chip';
import Panel from '../ui/Panel';
import HelpBox from '../ui/HelpBox';
import Tooltip from '../ui/Tooltip';
import CanvasHeatmap from '../charts/CanvasHeatmap';

interface TokenTabProps {
  weights: number[];
  changes: TokenChange[];
  segments: Segment[];
}

export default function TokenTab({ weights, changes, segments }: TokenTabProps) {
  const [tt, setTt] = useState<TooltipData | null>(null);
  const [ttPos, setTtPos] = useState<TooltipPos>({ x: 0, y: 0 });
  const [hovIdx, setHovIdx] = useState<number | null>(null);
  const [hovGrid, setHovGrid] = useState<number | null>(null);
  const [detail, setDetail] = useState<TokenDetail | null>(null);
  const [cMode, setCMode] = useState<ColorMode>("hybrid");
  const [fWtMin, setFWtMin] = useState<string>("");
  const [fWtMax, setFWtMax] = useState<string>("");
  const [fChangesOnly, setFChangesOnly] = useState<boolean>(false);
  const [fSource, setFSource] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortMode>("index");
  const [legendHover, setLegendHover] = useState<LegendKey>(null);

  const roleMap = useMemo<(RoleMapEntry | undefined)[]>(() => {
    const m = new Array<RoleMapEntry | undefined>(weights.length || 0);
    let cur = 0;
    (segments || []).forEach(seg => {
      const role = segRole(seg), rv = RV[role] || RV.other, count = seg.token_count || 0;
      for (let t = 0; t < count && (cur + t) < m.length; t++)
        m[cur + t] = { role, masked: !!seg.masked, tag: seg.tag || "", rv, seg };
      cur += count;
    });
    return m;
  }, [segments, weights.length]);

  const changesMap = useMemo<Map<number, TokenChange>>(() => {
    const m = new Map<number, TokenChange>();
    (changes || []).forEach(c => { if (c.token_index != null) m.set(c.token_index, c); });
    return m;
  }, [changes]);

  const sources = useMemo<string[]>(() => {
    const s = new Set<string>();
    (segments || []).forEach(seg => { const r = segRole(seg); s.add(r); });
    return [...s];
  }, [segments]);

  const filteredTokens = useMemo<number[]>(() => {
    const wMin = fWtMin !== "" ? parseFloat(fWtMin) : null;
    const wMax = fWtMax !== "" ? parseFloat(fWtMax) : null;
    let indices = weights.map((_, i) => i);
    if (wMin != null) indices = indices.filter(i => weights[i] >= wMin);
    if (wMax != null) indices = indices.filter(i => weights[i] <= wMax);
    if (fChangesOnly) indices = indices.filter(i => changesMap.has(i));
    if (fSource !== "all") indices = indices.filter(i => { const ri = roleMap[i]; return ri && ri.role === fSource; });
    if (sortBy === "weight_asc") indices.sort((a, b) => weights[a] - weights[b]);
    else if (sortBy === "weight_desc") indices.sort((a, b) => weights[b] - weights[a]);
    else if (sortBy === "mult_desc") indices.sort((a, b) => { const ca = changesMap.get(a), cb = changesMap.get(b); return (cb?.effective_multiplier ?? 0) - (ca?.effective_multiplier ?? 0); });
    return indices;
  }, [weights, fWtMin, fWtMax, fChangesOnly, fSource, sortBy, roleMap, changesMap]);

  const MAX = 800;
  const tokensActive = sortBy !== "index" || fWtMin !== "" || fWtMax !== "" || fChangesOnly || fSource !== "all";
  const displayTokens = tokensActive ? filteredTokens.slice(0, MAX) : weights.map((_, i) => i).slice(0, MAX);

  const stats = useMemo(() => {
    if (!weights.length) return null;
    const avg = weights.reduce((a, b) => a + b, 0) / weights.length;
    const std = Math.sqrt(weights.reduce((a, b) => a + (b - avg) ** 2, 0) / weights.length);
    return {
      avg, std,
      max: safeMax(weights),
      min: safeMin(weights),
      hi: weights.reduce((a, w) => a + (w >= 1.8 ? 1 : 0), 0),
      lo: weights.reduce((a, w) => a + (w < 0.5 ? 1 : 0), 0),
      clamp: weights.reduce((a, w) => a + (w >= 3.59 ? 1 : 0), 0),
      total: weights.length
    };
  }, [weights]);

  const showTt = useCallback((e: React.MouseEvent, i: number, w: number): void => {
    const ri = roleMap[i], hasC = changesMap.has(i);
    setTtPos({ x: e.clientX, y: e.clientY });
    setTt({ type: "token", pos: i, w, role: ri ? (RV[ri.role] || RV.other).lbl : "?", masked: ri ? ri.masked : null, hasChange: hasC });
    setHovGrid(i);
  }, [roleMap, changesMap]);

  const showCh = useCallback((e: React.MouseEvent, c: TokenChange, idx: number): void => {
    setTtPos({ x: e.clientX, y: e.clientY });
    setTt({ type: "change", c });
    setHovIdx(idx);
  }, []);

  const clear = useCallback((): void => {
    setTt(null);
    setHovIdx(null);
    setHovGrid(null);
  }, []);

  const legendMatch = (i: number): boolean => {
    if (!legendHover) return true;
    const ri = roleMap[i], w = weights[i], hasC = changesMap.has(i);
    if (legendHover === "system") return ri?.role === "system";
    if (legendHover === "masked") return !!ri?.masked && ri?.role !== "system" && ri?.role !== "forced";
    if (legendHover === "modified") return hasC;
    if (legendHover === "forced") return ri?.role === "forced";
    if (legendHover === "trainable_hi") return !ri?.masked && w >= 1.8;
    if (legendHover === "trainable_lo") return !ri?.masked && w < 0.5;
    return true;
  };

  return <div style={{ paddingBottom: 40 }}>
    <Tooltip data={tt} pos={ttPos} />
    <HelpBox>
      Each cell = one token. Color encodes <strong>IS-weight</strong> (importance sampling).
      Green = high weight (≈ on-policy), red = low (off-policy drift).
      Cells with <strong>⚡</strong> had their weight modified by ESC shaping rules.
      Click any cell to lock the detail inspector. Use filters to find outliers.
    </HelpBox>

    {/* ── Weight Statistics ── */}
    {stats && <Panel title="Weight Statistics" bc={CB.blue}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Chip label="Total" value={stats.total} bg="#f1f5f9" color={CB.slate} />
        <Chip label="Mean" value={stats.avg.toFixed(4)} bg="#eff6ff" color={CB.blue} />
        <Chip label="Std" value={stats.std.toFixed(4)} bg="#eff6ff" color={CB.blue} />
        <Chip label="Min" value={stats.min.toFixed(4)} bg="#fee2e2" color={CB.red} />
        <Chip label="Max" value={stats.max.toFixed(4)} bg="#dcfce7" color={CB.green} />
        <Chip label="High (≥1.8)" value={stats.hi} bg="#dcfce7" color={CB.green} />
        <Chip label="Low (<0.5)" value={stats.lo} bg="#fee2e2" color={CB.red} />
        <Chip label="Clamped (≥3.59)" value={stats.clamp} bg="#fff7ed" color={CB.orange} />
      </div>
    </Panel>}

    {/* ── Filter & Sort Controls ── */}
    <Panel title="Filter & Sort Controls" bc={CB.purple}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>Weight min</div>
          <input type="number" step="0.1" value={fWtMin} onChange={e => setFWtMin(e.target.value)} placeholder="—" style={{ width: 70, padding: "4px 6px", borderRadius: 4, border: "1px solid #cbd5e1", fontSize: 11, fontFamily: "var(--font-mono)" }} />
        </div>
        <div>
          <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>Weight max</div>
          <input type="number" step="0.1" value={fWtMax} onChange={e => setFWtMax(e.target.value)} placeholder="—" style={{ width: 70, padding: "4px 6px", borderRadius: 4, border: "1px solid #cbd5e1", fontSize: 11, fontFamily: "var(--font-mono)" }} />
        </div>
        <div>
          <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>Source</div>
          <select value={fSource} onChange={e => setFSource(e.target.value)} style={{ padding: "4px 6px", borderRadius: 4, border: "1px solid #cbd5e1", fontSize: 11 }}>
            <option value="all">All</option>
            {sources.map(s => <option key={s} value={s}>{(RV[s] || RV.other).lbl}</option>)}
          </select>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#475569", fontWeight: 600, cursor: "pointer" }}>
          <input type="checkbox" checked={fChangesOnly} onChange={e => setFChangesOnly(e.target.checked)} /> ⚡ Modified only
        </label>
        <div>
          <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>Sort</div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as SortMode)} style={{ padding: "4px 6px", borderRadius: 4, border: "1px solid #cbd5e1", fontSize: 11 }}>
            <option value="index">Position</option>
            <option value="weight_asc">Weight ↑</option>
            <option value="weight_desc">Weight ↓</option>
            <option value="mult_desc">Multiplier ↓</option>
          </select>
        </div>
        {tokensActive && <div style={{ fontSize: 10, color: CB.purple, fontWeight: 700, background: "#faf5ff", padding: "4px 8px", borderRadius: 4, border: "1px solid #e9d5ff" }}>
          {filteredTokens.length} / {weights.length} tokens
        </div>}
      </div>
    </Panel>

    {/* ── Weight profile (sampled) ── */}
    {weights.length > 0 && <Panel title={`Weight profile (sampled — ${weights.length} tokens)`} bc={CB.teal}>
      <div style={{ height: 60, display: "flex", alignItems: "flex-end", gap: 1, background: "#f8fafc", borderRadius: 6, padding: "8px 4px 4px", border: "1px solid #e2e8f0" }}>
        {(() => {
          const step = Math.max(1, Math.floor(weights.length / 200));
          const sampled: number[] = [];
          for (let i = 0; i < weights.length; i += step) sampled.push(weights[i]);
          const mx = safeMax(sampled) || 1;
          return sampled.map((w, i) => <div key={i} style={{ flex: 1, minWidth: 1, background: wColor(w), height: `${(w / mx) * 100}%`, borderRadius: "2px 2px 0 0", opacity: 0.85 }} />);
        })()}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#94a3b8", marginTop: 4 }}>
        <span>token 0</span>
        <span>token {weights.length - 1}</span>
      </div>
    </Panel>}

    {/* ── Interactive token grid ── */}
    <Panel title="Interactive token grid" bc={CB.green}>
      {/* Heatmap */}
      <div style={{ marginBottom: 10 }}>
        <CanvasHeatmap weights={weights} height={28} />
      </div>

      {/* Color mode buttons */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {(["hybrid", "proximity", "role"] as ColorMode[]).map(m => <button key={m} onClick={() => setCMode(m)} style={{
          padding: "4px 10px", borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: "pointer",
          border: cMode === m ? "2px solid " + CB.blue : "1px solid #cbd5e1",
          background: cMode === m ? "#eff6ff" : "#f8fafc",
          color: cMode === m ? CB.blue : "#64748b",
          textTransform: "uppercase"
        }}>{m}</button>)}
      </div>

      {/* Token grid cells */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 2, maxHeight: 400, overflowY: "auto", background: "#f8fafc", padding: 6, borderRadius: 6, border: "1px solid #e2e8f0" }}>
        {displayTokens.map(i => {
          const w = weights[i], ri = roleMap[i], hasC = changesMap.has(i);
          const dimmed = !legendMatch(i);
          let bg: string;
          if (cMode === "proximity") bg = proxGrad(w);
          else if (cMode === "role") bg = ri ? ri.rv.bg : "#9ca3af";
          else bg = ri ? getSegBg(ri.seg, w) : wColor(w);
          return <div key={i}
            onMouseEnter={e => showTt(e, i, w)}
            onMouseMove={e => setTtPos({ x: e.clientX, y: e.clientY })}
            onMouseLeave={clear}
            onClick={() => setDetail({ pos: i, w, change: changesMap.get(i) || null, ri })}
            style={{
              width: 18, height: 18, borderRadius: 3, cursor: "pointer",
              background: bg,
              border: hovGrid === i ? "2px solid #fff" : hasC ? "1.5px solid " + CB.orange : "1px solid rgba(0,0,0,0.1)",
              boxShadow: hovGrid === i ? "0 0 6px rgba(0,0,0,0.3)" : "none",
              opacity: dimmed ? 0.15 : 1,
              position: "relative" as const,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 7, color: "#fff", fontWeight: 700, textShadow: "0 0 2px rgba(0,0,0,0.5)"
            }}>
            {hasC && "⚡"}
          </div>;
        })}
      </div>

      {/* Overflow message */}
      {displayTokens.length >= MAX && <div style={{ fontSize: 10, color: "#94a3b8", textAlign: "center", marginTop: 6, fontStyle: "italic" }}>
        Showing first {MAX} of {tokensActive ? filteredTokens.length : weights.length} tokens. Use filters to narrow down.
      </div>}

      {/* Interactive legend */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10, justifyContent: "center" }}>
        {([
          { key: "system" as LegendKey, color: CB.slate, label: "System/Prompt" },
          { key: "masked" as LegendKey, color: "#94a3b8", label: "Masked (no loss)" },
          { key: "modified" as LegendKey, color: CB.orange, label: "⚡ Modified" },
          { key: "forced" as LegendKey, color: "#f97316", label: "Forced answer" },
          { key: "trainable_hi" as LegendKey, color: CB.green, label: "Trainable ≥1.8" },
          { key: "trainable_lo" as LegendKey, color: CB.red, label: "Trainable <0.5" },
        ]).map(l => <div key={l.key}
          onMouseEnter={() => setLegendHover(l.key)}
          onMouseLeave={() => setLegendHover(null)}
          style={{
            display: "flex", alignItems: "center", gap: 4, fontSize: 10,
            background: legendHover === l.key ? "#e0f2fe" : "#f1f5f9",
            padding: "4px 8px", borderRadius: 4,
            border: legendHover === l.key ? "1px solid " + CB.cyan : "1px solid #e2e8f0",
            cursor: "pointer", fontWeight: 600, color: "#475569"
          }}>
          <div style={{ width: 10, height: 10, background: l.color, borderRadius: 2 }} />
          {l.label}
        </div>)}
      </div>
    </Panel>

    {/* ── Token Inspector ── */}
    {detail && <Panel title={`Token Inspector — #${detail.pos}`} bc={CB.cyan}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {/* Attributes */}
        <div style={{ background: "#f8fafc", padding: 10, borderRadius: 6, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 6, textTransform: "uppercase" }}>Attributes</div>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 10px", fontSize: 11 }}>
            <span style={{ color: "#94a3b8", fontWeight: 500 }}>Position:</span>
            <span style={{ fontWeight: 600, color: "#0f172a", fontFamily: "var(--font-mono)" }}>{detail.pos}</span>
            <span style={{ color: "#94a3b8", fontWeight: 500 }}>Weight:</span>
            <span style={{ fontWeight: 600, color: wColor(detail.w), fontFamily: "var(--font-mono)" }}>{detail.w.toFixed(6)}</span>
            <span style={{ color: "#94a3b8", fontWeight: 500 }}>Proximity:</span>
            <span style={{ fontWeight: 600, color: "#0f172a", fontFamily: "var(--font-mono)" }}>{((detail.w / 3.6) * 100).toFixed(1)}%</span>
            <span style={{ color: "#94a3b8", fontWeight: 500 }}>Role:</span>
            <span style={{ fontWeight: 600, color: detail.ri ? detail.ri.rv.bg : "#94a3b8" }}>{detail.ri ? detail.ri.rv.lbl : "?"}</span>
            <span style={{ color: "#94a3b8", fontWeight: 500 }}>Masked:</span>
            <span style={{ fontWeight: 600, color: detail.ri?.masked ? CB.red : CB.green }}>{detail.ri ? (detail.ri.masked ? "⊘ YES" : "✓ NO") : "?"}</span>
            <span style={{ color: "#94a3b8", fontWeight: 500 }}>Tag:</span>
            <span style={{ fontWeight: 600, color: "#475569" }}>{detail.ri?.tag || "—"}</span>
          </div>
        </div>
        {/* Change attributes */}
        <div style={{ background: detail.change ? "#fff7ed" : "#f8fafc", padding: 10, borderRadius: 6, border: detail.change ? "1px solid #fed7aa" : "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: detail.change ? CB.orange : "#64748b", marginBottom: 6, textTransform: "uppercase" }}>
            {detail.change ? "⚡ Modification" : "No Modification"}
          </div>
          {detail.change ? <React.Fragment>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 10px", fontSize: 11 }}>
              <span style={{ color: "#94a3b8", fontWeight: 500 }}>Token ID:</span>
              <span style={{ fontWeight: 600, fontFamily: "var(--font-mono)" }}>{detail.change.token_id}</span>
              <span style={{ color: "#94a3b8", fontWeight: 500 }}>Before:</span>
              <span style={{ fontWeight: 600, color: CB.red, fontFamily: "var(--font-mono)" }}>{detail.change.before_weight.toFixed(6)}</span>
              <span style={{ color: "#94a3b8", fontWeight: 500 }}>After:</span>
              <span style={{ fontWeight: 600, color: CB.green, fontFamily: "var(--font-mono)" }}>{detail.change.after_weight.toFixed(6)}</span>
              <span style={{ color: "#94a3b8", fontWeight: 500 }}>Multiplier:</span>
              <span style={{ fontWeight: 600, color: CB.yellow, fontFamily: "var(--font-mono)" }}>{detail.change.multiplier}</span>
              <span style={{ color: "#94a3b8", fontWeight: 500 }}>Eff. Mult:</span>
              <span style={{ fontWeight: 600, color: CB.orange, fontFamily: "var(--font-mono)" }}>{detail.change.effective_multiplier.toFixed(6)}</span>
              <span style={{ color: "#94a3b8", fontWeight: 500 }}>Type:</span>
              <span style={{ fontWeight: 600, color: CB.purple }}>{detail.change.change_type || "—"}</span>
              {detail.change.match_reason && <>
                <span style={{ color: "#94a3b8", fontWeight: 500 }}>Reason:</span>
                <span style={{ fontWeight: 600, color: CB.cyan }}>{detail.change.match_reason}</span>
              </>}
            </div>
            <div style={{ marginTop: 8, padding: "4px 8px", borderRadius: 4, background: "#fef3c7", fontSize: 10, color: "#92400e", fontWeight: 600, textAlign: "center", border: "1px dashed #fbbf24" }}>
              Δ = {(detail.change.after_weight - detail.change.before_weight).toFixed(6)}
            </div>
          </React.Fragment> : <div style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>This token was not modified by ESC shaping.</div>}
        </div>
      </div>
      {/* Dismiss button */}
      <div style={{ textAlign: "center", marginTop: 8 }}>
        <button onClick={() => setDetail(null)} style={{ padding: "4px 16px", borderRadius: 4, border: "1px solid #cbd5e1", background: "#f8fafc", fontSize: 10, fontWeight: 600, color: "#64748b", cursor: "pointer" }}>
          Dismiss
        </button>
      </div>
    </Panel>}

    {/* ── Modification Log ── */}
    {changes && changes.length > 0 && <Panel title={`Modification Log (${changes.length} changes)`} bc={CB.orange}>
      {/* Grid header */}
      <div style={{ display: "grid", gridTemplateColumns: "50px 50px 80px 80px 70px 80px 80px 1fr", gap: 4, fontSize: 9, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4, padding: "0 4px" }}>
        <span>Idx</span><span>TokID</span><span>Before</span><span>After</span><span>Mult</span><span>Eff Mult</span><span>Type</span><span>Reason</span>
      </div>
      {/* Change rows */}
      <div style={{ maxHeight: 300, overflowY: "auto" }}>
        {changes.map((c, idx) => <div key={idx}
          onMouseEnter={e => showCh(e, c, idx)}
          onMouseMove={e => setTtPos({ x: e.clientX, y: e.clientY })}
          onMouseLeave={clear}
          onClick={() => setDetail({ pos: c.token_index, w: weights[c.token_index] ?? 0, change: c, ri: roleMap[c.token_index] })}
          style={{
            display: "grid",
            gridTemplateColumns: "50px 50px 80px 80px 70px 80px 80px 1fr",
            gap: 4, fontSize: 10, padding: "4px 4px", borderRadius: 4, cursor: "pointer",
            fontFamily: "var(--font-mono)",
            background: hovIdx === idx ? "#fff7ed" : idx % 2 === 0 ? "#f8fafc" : "#fff",
            border: hovIdx === idx ? "1px solid #fed7aa" : "1px solid transparent"
          }}>
          <span style={{ fontWeight: 600, color: "#475569" }}>{c.token_index}</span>
          <span style={{ color: "#64748b" }}>{c.token_id}</span>
          <span style={{ color: CB.red, fontWeight: 600 }}>{c.before_weight.toFixed(4)}</span>
          <span style={{ color: CB.green, fontWeight: 600 }}>{c.after_weight.toFixed(4)}</span>
          <span style={{ color: CB.yellow, fontWeight: 600 }}>{c.multiplier}</span>
          <span style={{ color: CB.orange, fontWeight: 600 }}>{c.effective_multiplier.toFixed(4)}</span>
          <span style={{ color: CB.purple, fontWeight: 500 }}>{c.change_type || "—"}</span>
          <span style={{ color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.match_reason || "—"}</span>
        </div>)}
      </div>
    </Panel>}
  </div>;
}
