import React from 'react';
import { CB } from '../../constants/colors';

export type SyncMode = 'proportional' | 'synchronized' | 'independent';

interface StreamControlBarProps {
  active: boolean;
  paused: boolean;
  done: boolean;
  speed: number;
  visibleTokens: number;
  totalTokens: number;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onStop: () => void;
  onSetSpeed: (tps: number) => void;
  multiMember?: boolean;
  syncMode?: SyncMode;
  onSyncModeChange?: (mode: SyncMode) => void;
}

function btnStyle(bg: string): React.CSSProperties {
  return {
    padding: '4px 12px',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    background: bg,
    color: '#fff',
    border: 'none',
    borderRadius: 4,
  };
}

const SYNC_LABELS: Record<SyncMode, { label: string; help: string }> = {
  proportional: { label: 'Proportional', help: 'All members finish together' },
  synchronized: { label: 'Sync Tokens', help: 'Same token count for all' },
  independent: { label: 'Independent', help: 'Each member at own pace' },
};

export default function StreamControlBar({
  active,
  paused,
  done,
  speed,
  visibleTokens,
  totalTokens,
  onPlay,
  onPause,
  onResume,
  onReset,
  onStop,
  onSetSpeed,
  multiMember,
  syncMode = 'proportional',
  onSyncModeChange,
}: StreamControlBarProps) {
  const pct = totalTokens > 0 ? (visibleTokens / totalTokens) * 100 : 0;

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: '#0f172a',
        border: '1px solid #334155',
        borderRadius: 8,
        padding: '10px 16px',
        marginBottom: 12,
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        flexWrap: 'wrap',
        boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
      }}
    >
      {/* Play / Pause */}
      {!active && !done && (
        <button onClick={onPlay} style={btnStyle(CB.green)}>
          &#x25B6; Play
        </button>
      )}
      {done && (
        <button onClick={onReset} style={btnStyle(CB.blue)}>
          &#x21BB; Replay
        </button>
      )}
      {active && paused && (
        <button onClick={onResume} style={btnStyle(CB.blue)}>
          &#x25B6; Resume
        </button>
      )}
      {active && !paused && (
        <button onClick={onPause} style={btnStyle('#64748b')}>
          &#x23F8; Pause
        </button>
      )}

      {/* Reset */}
      {(active || done) && (
        <button onClick={onReset} style={btnStyle('#475569')}>
          &#x23EE;
        </button>
      )}

      {/* Stop — show all */}
      {active && (
        <button onClick={onStop} style={btnStyle('#991b1b')}>
          &#x25A0; Show All
        </button>
      )}

      {/* Speed slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>Speed</span>
        <input
          type="range"
          min={5}
          max={200}
          step={5}
          value={speed}
          onChange={(e) => onSetSpeed(Number(e.target.value))}
          style={{ width: 80, accentColor: CB.cyan }}
        />
        <span
          style={{
            fontSize: 10,
            color: '#94a3b8',
            fontWeight: 600,
            minWidth: 48,
            fontFamily: 'var(--font-mono)',
          }}
        >
          {speed} t/s
        </span>
      </div>

      {/* Sync mode toggle (multi-member only) */}
      {multiMember && onSyncModeChange && (
        <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {(Object.keys(SYNC_LABELS) as SyncMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => onSyncModeChange(mode)}
              title={SYNC_LABELS[mode].help}
              style={{
                padding: '3px 8px',
                fontSize: 9,
                fontWeight: 700,
                cursor: 'pointer',
                background: syncMode === mode ? CB.cyan : '#334155',
                color: syncMode === mode ? '#0f172a' : '#94a3b8',
                border: 'none',
                borderRadius: 3,
              }}
            >
              {SYNC_LABELS[mode].label}
            </button>
          ))}
        </div>
      )}

      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#e2e8f0',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {visibleTokens.toLocaleString()}/{totalTokens.toLocaleString()}
        </span>
        <div
          style={{
            width: 100,
            height: 6,
            background: '#334155',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              background: `linear-gradient(90deg,${CB.blue},${CB.cyan})`,
              borderRadius: 3,
              transition: 'width 0.1s linear',
            }}
          />
        </div>
        {done && <span style={{ fontSize: 10, color: '#4ade80', fontWeight: 700 }}>DONE</span>}
      </div>
    </div>
  );
}
