import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Rollout } from '../../types';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { useStreamAnimation } from '../../hooks/useStreamAnimation';
import { filterRelevant } from '../../utils/segments';
import { getTotalTokenCount } from '../../utils/tokenize';
import { CB } from '../../constants/colors';
import StreamLane from '../stream/StreamLane';
import StreamControlBar from '../stream/StreamControlBar';
import type { SyncMode } from '../stream/StreamControlBar';
import HelpBox from '../ui/HelpBox';

interface StreamTabProps {
  row: Rollout;
  rows: Rollout[];
}

/** Get sibling rollouts sharing the same prompt. */
function getSiblings(rows: Rollout[], selRow: number) {
  const cur = rows[selRow];
  if (!cur) return [];
  const prompt = cur.prompt || cur.prompt_text || '';
  return rows.map((r, i) => ({ r, i })).filter(({ r }) => (r.prompt || r.prompt_text) === prompt);
}

export default function StreamTab({ row, rows }: StreamTabProps) {
  const { sel, streamRequest } = useAppState();
  const dispatch = useAppDispatch();

  const [multiMode, setMultiMode] = useState(false);
  const [syncMode, setSyncMode] = useState<SyncMode>('proportional');
  const [memberIndices, setMemberIndices] = useState<number[]>([]);

  // Detect stream request from context
  useEffect(() => {
    if (streamRequest) {
      if (streamRequest.queue.length > 1) {
        setMultiMode(true);
        setMemberIndices(streamRequest.queue);
      } else {
        setMultiMode(false);
        setMemberIndices([streamRequest.target]);
      }
      dispatch({ type: 'CLEAR_STREAM_REQUEST' });
    }
  }, [streamRequest, dispatch]);

  // Get siblings for multi-member mode
  const siblings = useMemo(() => getSiblings(rows, sel), [rows, sel]);

  // Determine which members to show
  const activeMembers = useMemo(() => {
    if (multiMode && memberIndices.length > 1) {
      return memberIndices.map((i) => rows[i]).filter(Boolean);
    }
    return [row];
  }, [multiMode, memberIndices, rows, row]);

  // Compute segments + token counts per member
  const memberData = useMemo(
    () =>
      activeMembers.map((r) => {
        const segs = filterRelevant(r.segments || []);
        const tokenCount = getTotalTokenCount(segs);
        return { rollout: r, segments: segs, tokenCount };
      }),
    [activeMembers],
  );

  // Master total — used for sync modes
  const maxTokens = useMemo(
    () => Math.max(1, ...memberData.map((m) => m.tokenCount)),
    [memberData],
  );
  const totalForMaster = syncMode === 'proportional' ? maxTokens : maxTokens;

  // Single master animation hook (drives all lanes in sync/proportional modes)
  const master = useStreamAnimation(totalForMaster);

  // Auto-play when a stream request comes in
  const [autoPlayed, setAutoPlayed] = useState(false);
  useEffect(() => {
    if (memberData.length > 0 && !autoPlayed && streamRequest === null) {
      // Don't auto-play on initial tab load unless stream request triggered it
    }
  }, [memberData, autoPlayed, streamRequest]);

  // Handle stream request auto-play
  useEffect(() => {
    if (memberIndices.length > 0 && !master.active && !master.done) {
      master.play();
      setAutoPlayed(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberIndices]);

  // Compute visible tokens per lane based on sync mode
  const getVisibleTokens = useCallback(
    (laneTokenCount: number): number => {
      if (syncMode === 'proportional') {
        // Map master progress proportionally so all lanes finish together
        const progress = maxTokens > 0 ? master.visibleTokens / maxTokens : 0;
        return Math.min(Math.floor(progress * laneTokenCount), laneTokenCount);
      }
      if (syncMode === 'synchronized') {
        // Same absolute token count for all
        return Math.min(master.visibleTokens, laneTokenCount);
      }
      // 'independent' — same as synchronized for now with single master
      return Math.min(master.visibleTokens, laneTokenCount);
    },
    [syncMode, master.visibleTokens, maxTokens],
  );

  const isStreaming = master.active && !master.paused;

  // Build lane label
  const laneLabel = (r: Rollout, _idx: number) => {
    const m = r.metadata || {};
    const vn = (m._view_name as string) || '?';
    const ok = r.correct ? '\u2713' : '\u2717';
    const rw = (r.reward ?? 0).toFixed(3);
    const adv = (r.advantage ?? 0).toFixed(3);
    return `${vn.toUpperCase()} \u00b7 R:${rw} \u00b7 A:${adv} ${ok}`;
  };

  const laneColor = (r: Rollout) => (r.correct ? CB.green : CB.red);

  const n = memberData.length;
  const cols = n > 1 ? `repeat(${Math.min(n, 4)}, 1fr)` : '1fr';

  return (
    <div style={{ paddingBottom: 40 }}>
      <HelpBox>
        <strong>Stream View</strong> animates text generation <strong>word-by-word</strong>, like
        watching real LLM inference. Colors indicate segment roles: scaffold (blue), generated
        (green), forced (orange), etc. Use the controls to adjust speed (tokens/sec), pause, or
        compare group members side-by-side.
      </HelpBox>

      {/* Mode toggle */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => {
            setMultiMode(false);
            setMemberIndices([sel]);
          }}
          style={{
            padding: '6px 16px',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            background: !multiMode ? CB.blue : '#334155',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
          }}
        >
          Single Member
        </button>
        {siblings.length > 1 && (
          <button
            onClick={() => {
              setMultiMode(true);
              setMemberIndices(siblings.map((s) => s.i));
            }}
            style={{
              padding: '6px 16px',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              background: multiMode ? `linear-gradient(135deg,${CB.blue},${CB.purple})` : '#334155',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
            }}
          >
            Compare {siblings.length} Members
          </button>
        )}

        {/* Quick play if not already active */}
        {!master.active && !master.done && (
          <button
            onClick={master.play}
            style={{
              padding: '6px 16px',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              background: `linear-gradient(135deg,${CB.green},${CB.cyan})`,
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              marginLeft: 'auto',
            }}
          >
            &#x25B6; Start Stream
          </button>
        )}
      </div>

      {/* Control bar */}
      {(master.active || master.done) && (
        <StreamControlBar
          active={master.active}
          paused={master.paused}
          done={master.done}
          speed={master.speed}
          visibleTokens={master.visibleTokens}
          totalTokens={totalForMaster}
          onPlay={master.play}
          onPause={master.pause}
          onResume={master.resume}
          onReset={master.reset}
          onStop={master.stop}
          onSetSpeed={master.setSpeed}
          multiMember={multiMode && n > 1}
          syncMode={syncMode}
          onSyncModeChange={setSyncMode}
        />
      )}

      {/* Stream lanes */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: cols,
          gap: 8,
          minHeight: 400,
          maxHeight: 'calc(100vh - 280px)',
        }}
      >
        {memberData.map((md, i) => (
          <StreamLane
            key={i}
            segments={md.segments}
            visibleTokens={
              master.active || master.done ? getVisibleTokens(md.tokenCount) : md.tokenCount
            }
            label={n > 1 ? laneLabel(md.rollout, i) : undefined}
            headerColor={n > 1 ? laneColor(md.rollout) : undefined}
            streaming={isStreaming}
          />
        ))}
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          marginTop: 12,
          justifyContent: 'center',
        }}
      >
        {[
          { role: 'system', color: CB.slate, label: 'System/Prompt' },
          { role: 'scaffold', color: CB.blue, label: 'Scaffold' },
          { role: 'generated', color: CB.green, label: 'Generated' },
          { role: 'answer', color: CB.yellow, label: 'Answer' },
          { role: 'forced', color: CB.orange, label: 'Forced' },
          { role: 'prefix', color: CB.purple, label: 'Prefix' },
          { role: 'injected', color: CB.cyan, label: 'Injected' },
        ].map((item) => (
          <div
            key={item.role}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 10,
              background: '#1e293b',
              padding: '4px 8px',
              borderRadius: 4,
              border: '1px solid #334155',
              color: '#94a3b8',
            }}
          >
            <div
              style={{
                width: 4,
                height: 14,
                background: item.color,
                borderRadius: 1,
              }}
            />
            <span style={{ fontWeight: 600 }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
