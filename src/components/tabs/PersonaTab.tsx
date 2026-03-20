import { useMemo, useState } from 'react';
import type { Rollout } from '../../types';
import { CB } from '../../constants/colors';
import { analyzePersonas, type PersonaResult, type PersonaSummary } from '../../utils/persona';
import Chip from '../ui/Chip';
import Panel from '../ui/Panel';

/* ═══ Script & language badge colors ═══ */

const SCRIPT_COLORS: Record<string, { bg: string; color: string }> = {
  latin: { bg: '#dbeafe', color: CB.blue },
  devanagari: { bg: '#fef3c7', color: '#92400e' },
  arabic: { bg: '#e0e7ff', color: '#3730a3' },
  mixed: { bg: '#f3e8ff', color: CB.purple },
  unknown: { bg: '#f1f5f9', color: CB.slate },
};

const LANG_COLORS: Record<string, { bg: string; color: string }> = {
  roman_urdu: { bg: '#dcfce7', color: CB.green },
  hindi: { bg: '#fef3c7', color: '#92400e' },
  english: { bg: '#e0f2fe', color: CB.blue },
  urdu: { bg: '#e0e7ff', color: '#3730a3' },
  roman_hindi: { bg: '#dcfce7', color: CB.green },
  unknown: { bg: '#f1f5f9', color: CB.slate },
};

/* ═══ Validity badge ═══ */

function ValidBadge({ valid }: { valid: boolean }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 700,
        background: valid ? '#dcfce7' : '#fee2e2',
        color: valid ? CB.green : CB.red,
        border: `1px solid ${valid ? '#bbf7d0' : '#fecaca'}`,
      }}
    >
      {valid ? 'VALID' : 'INVALID'}
    </span>
  );
}

/* ═══ Confidence bar ═══ */

function ConfBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const hue = value > 0.7 ? 142 : value > 0.4 ? 45 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div
        style={{
          width: 60,
          height: 6,
          borderRadius: 3,
          background: '#e2e8f0',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: 3,
            background: `hsl(${hue}, 70%, 45%)`,
          }}
        />
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, color: '#64748b' }}>{pct}%</span>
    </div>
  );
}

/* ═══ Persona card ═══ */

function PersonaCard({ p, index }: { p: PersonaResult; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const sc = SCRIPT_COLORS[p.script] || SCRIPT_COLORS.unknown;
  const lc = LANG_COLORS[p.language] || LANG_COLORS.unknown;
  const preview = p.text.length > 120 ? p.text.slice(0, 120) + '...' : p.text;

  return (
    <div
      style={{
        background: 'var(--color-background-primary)',
        border: `1px solid ${p.valid ? '#bbf7d0' : '#fecaca'}`,
        borderLeft: `4px solid ${p.valid ? CB.green : CB.red}`,
        borderRadius: 8,
        padding: 14,
        marginBottom: 10,
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>#{index + 1}</span>
        <ValidBadge valid={p.valid} />
        <span
          style={{
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 600,
            background: sc.bg,
            color: sc.color,
          }}
        >
          {p.script.toUpperCase()}
        </span>
        <span
          style={{
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 600,
            background: lc.bg,
            color: lc.color,
          }}
        >
          {p.languageLabel}
        </span>
        <span
          style={{
            fontSize: 10,
            color: '#94a3b8',
            padding: '2px 6px',
            background: '#f8fafc',
            borderRadius: 4,
          }}
        >
          seg[{p.segmentIndex}] · {p.tag}
        </span>
        <div style={{ marginLeft: 'auto' }}>
          <ConfBar value={p.confidence} />
        </div>
      </div>

      {/* Text preview / full */}
      <div
        onClick={() => p.text.length > 120 && setExpanded(!expanded)}
        style={{
          background: '#f8fafc',
          padding: 10,
          borderRadius: 6,
          fontSize: 12,
          lineHeight: 1.7,
          fontFamily: 'var(--font-mono)',
          color: '#334155',
          border: '1px solid #e2e8f0',
          cursor: p.text.length > 120 ? 'pointer' : 'default',
          whiteSpace: 'pre-wrap',
          maxHeight: expanded ? 'none' : 80,
          overflow: 'hidden',
        }}
      >
        {expanded ? p.text : preview}
      </div>

      {/* Indicators */}
      {p.indicators.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>Indicators:</span>
          {p.indicators.map((w, i) => (
            <span
              key={i}
              style={{
                fontSize: 10,
                padding: '1px 6px',
                borderRadius: 3,
                background: '#ecfdf5',
                color: CB.green,
                fontFamily: 'var(--font-mono)',
              }}
            >
              {w}
            </span>
          ))}
        </div>
      )}

      {/* Reason */}
      <div style={{ marginTop: 6, fontSize: 10, color: '#64748b', fontStyle: 'italic' }}>
        {p.reason}
      </div>
    </div>
  );
}

/* ═══ Distribution bar chart ═══ */

function DistBar({
  data,
  colorMap,
}: {
  data: Record<string, number>;
  colorMap: Record<string, { bg: string; color: string }>;
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, v]) => v));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {entries.map(([label, count]) => {
        const c = colorMap[label] || { bg: '#f1f5f9', color: '#475569' };
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                minWidth: 100,
                fontSize: 11,
                fontWeight: 600,
                color: c.color,
                textAlign: 'right',
              }}
            >
              {label}
            </span>
            <div
              style={{
                flex: 1,
                height: 18,
                borderRadius: 4,
                background: '#f1f5f9',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${(count / max) * 100}%`,
                  height: '100%',
                  background: c.bg,
                  borderRadius: 4,
                  border: `1px solid ${c.color}33`,
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: 6,
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, color: c.color }}>{count}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══ Main tab ═══ */

type FilterMode = 'all' | 'valid' | 'invalid';

export default function PersonaTab({ row, rows }: { row: Rollout; rows: Rollout[] }) {
  const [filter, setFilter] = useState<FilterMode>('all');

  const summary: PersonaSummary = useMemo(
    () => analyzePersonas(row.segments || []),
    [row.segments],
  );

  const globalSummary = useMemo(() => {
    let totalValid = 0,
      totalInvalid = 0,
      totalPersonas = 0;
    const langCounts: Record<string, number> = {};

    for (const r of rows) {
      const s = analyzePersonas(r.segments || []);
      totalPersonas += s.total;
      totalValid += s.valid;
      totalInvalid += s.invalid;
      for (const [lang, cnt] of Object.entries(s.byLanguage)) {
        langCounts[lang] = (langCounts[lang] || 0) + cnt;
      }
    }
    return { totalPersonas, totalValid, totalInvalid, langCounts };
  }, [rows]);

  const filtered = summary.personas.filter((p) => {
    if (filter === 'valid') return p.valid;
    if (filter === 'invalid') return !p.valid;
    return true;
  });

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Summary chips */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <Chip
          label="Segments"
          value={String((row.segments || []).length)}
          bg="#f0f9ff"
          color={CB.blue}
        />
        <Chip label="Personas" value={String(summary.total)} bg="#faf5ff" color={CB.purple} />
        <Chip label="Valid" value={String(summary.valid)} bg="#dcfce7" color={CB.green} />
        <Chip label="Invalid" value={String(summary.invalid)} bg="#fee2e2" color={CB.red} />
        <Chip
          label="Dataset Total"
          value={String(globalSummary.totalPersonas)}
          bg="#fff7ed"
          color={CB.orange}
        />
        <Chip
          label="Dataset Valid"
          value={`${globalSummary.totalValid}/${globalSummary.totalPersonas}`}
          bg="#ecfdf5"
          color={CB.teal}
        />
      </div>

      {/* Distributions */}
      {summary.total > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <Panel title="Language Distribution" bc={CB.purple}>
            <DistBar data={summary.byLanguage} colorMap={LANG_COLORS} />
          </Panel>
          <Panel title="Script Distribution" bc={CB.blue}>
            <DistBar data={summary.byScript} colorMap={SCRIPT_COLORS} />
          </Panel>
        </div>
      )}

      {/* Global language dist across all rows */}
      {rows.length > 1 && Object.keys(globalSummary.langCounts).length > 0 && (
        <Panel title="Dataset-wide Language Distribution" bc={CB.orange}>
          <DistBar data={globalSummary.langCounts} colorMap={LANG_COLORS} />
        </Panel>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {(['all', 'valid', 'invalid'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 14px',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: filter === f ? 700 : 500,
              fontSize: 12,
              background:
                filter === f
                  ? f === 'valid'
                    ? '#dcfce7'
                    : f === 'invalid'
                      ? '#fee2e2'
                      : '#e0f2fe'
                  : '#f1f5f9',
              color:
                filter === f
                  ? f === 'valid'
                    ? CB.green
                    : f === 'invalid'
                      ? CB.red
                      : CB.blue
                  : '#64748b',
            }}
          >
            {f === 'all'
              ? `All (${summary.total})`
              : f === 'valid'
                ? `Valid (${summary.valid})`
                : `Invalid (${summary.invalid})`}
          </button>
        ))}
      </div>

      {/* Persona cards */}
      {filtered.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 40,
            color: '#94a3b8',
            fontSize: 13,
          }}
        >
          {summary.total === 0
            ? "No persona descriptions detected in this rollout's segments. Segments need text content of 20+ characters."
            : `No ${filter} personas found.`}
        </div>
      ) : (
        filtered.map((p, i) => <PersonaCard key={p.segmentIndex} p={p} index={i} />)
      )}
    </div>
  );
}
