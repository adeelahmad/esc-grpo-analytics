import React, { useState, useMemo, useCallback } from 'react';
import { Player } from '@remotion/player';
import type { Rollout } from '../types';
import { filterRelevant } from '../utils/segments';
import { getTotalTokens } from '../remotion/StreamScene';
import { CB } from '../constants/colors';
import RolloutVideo from '../remotion/RolloutVideo';
import GroupVideo from '../remotion/GroupVideo';
import { calcGroupDuration } from '../remotion/GroupVideo';
import {
  VIDEO_FPS,
  RESOLUTION,
  DEFAULT_TOKENS_PER_SEC,
  rolloutDurationFrames,
  type ResolutionKey,
} from '../remotion/constants';

interface VideoExportPanelProps {
  rollouts: Rollout[];
  onClose: () => void;
}

export default function VideoExportPanel({ rollouts, onClose }: VideoExportPanelProps) {
  const [resolution, setResolution] = useState<ResolutionKey>('1080p');
  const [tokPerSec, setTokPerSec] = useState(DEFAULT_TOKENS_PER_SEC);
  const [rendering, setRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);

  const isSingle = rollouts.length === 1;
  const res = RESOLUTION[resolution];

  const durationInFrames = useMemo(() => {
    if (isSingle) {
      const segs = filterRelevant(rollouts[0].segments || []);
      const totalTokens = getTotalTokens(segs);
      return Math.max(1, rolloutDurationFrames(totalTokens, tokPerSec));
    }
    return Math.max(1, calcGroupDuration(rollouts, tokPerSec));
  }, [rollouts, tokPerSec, isSingle]);

  const handleRender = useCallback(async () => {
    setRendering(true);
    setRenderProgress(0);

    try {
      const payload = {
        compositionId: isSingle ? 'RolloutVideo' : 'GroupVideo',
        inputProps: isSingle
          ? { rollout: rollouts[0], tokPerSec }
          : { rollouts, tokPerSec },
        resolution,
        fps: VIDEO_FPS,
        durationInFrames,
      };

      const resp = await fetch('/__render-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`Render failed: ${errText}`);
      }

      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rollout_${isSingle ? 'single' : 'group'}_${resolution}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert(
        `Video rendering requires the render server.\n\nUse the CLI instead:\n  npm run render:video -- --input <file.jsonl>\n\nOr use Remotion Studio:\n  npm run remotion:studio`,
      );
    } finally {
      setRendering(false);
      setRenderProgress(0);
    }
  }, [isSingle, rollouts, tokPerSec, resolution, durationInFrames]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          maxWidth: 960,
          width: '95vw',
          maxHeight: '95vh',
          overflow: 'auto',
          padding: 24,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>
            Export Video — {isSingle ? '1 Rollout' : `${rollouts.length} Rollouts`}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: '#64748b',
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Preview Player */}
        <div
          style={{
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            marginBottom: 16,
            background: '#0f172a',
          }}
        >
          {isSingle ? (
            <Player
              component={RolloutVideo}
              inputProps={{ rollout: rollouts[0], tokPerSec }}
              durationInFrames={durationInFrames}
              compositionWidth={res.width}
              compositionHeight={res.height}
              fps={VIDEO_FPS}
              style={{ width: '100%', aspectRatio: `${res.width}/${res.height}` }}
              controls
              autoPlay={false}
            />
          ) : (
            <Player
              component={GroupVideo}
              inputProps={{ rollouts, tokPerSec }}
              durationInFrames={durationInFrames}
              compositionWidth={res.width}
              compositionHeight={res.height}
              fps={VIDEO_FPS}
              style={{ width: '100%', aspectRatio: `${res.width}/${res.height}` }}
              controls
              autoPlay={false}
            />
          )}
        </div>

        {/* Controls */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap',
            alignItems: 'center',
            marginBottom: 16,
            padding: '12px 16px',
            background: '#f8fafc',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
          }}
        >
          {/* Resolution */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Resolution</label>
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value as ResolutionKey)}
              style={{
                padding: '4px 8px',
                borderRadius: 4,
                border: '1px solid #cbd5e1',
                fontSize: 12,
                background: '#fff',
              }}
            >
              <option value="720p">720p (1280x720)</option>
              <option value="1080p">1080p (1920x1080)</option>
            </select>
          </div>

          {/* Speed (tokens per second) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Speed</label>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={tokPerSec}
              onChange={(e) => setTokPerSec(Number(e.target.value))}
              style={{ width: 100, accentColor: CB.blue }}
            />
            <span style={{ fontSize: 11, color: '#475569', fontWeight: 600, minWidth: 60 }}>
              {tokPerSec} tok/s
            </span>
          </div>

          {/* Duration info */}
          <div style={{ fontSize: 11, color: '#64748b', marginLeft: 'auto' }}>
            {(durationInFrames / VIDEO_FPS).toFixed(1)}s · {durationInFrames} frames @{VIDEO_FPS}fps
          </div>
        </div>

        {/* Export buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              background: '#f1f5f9',
              color: '#475569',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleRender}
            disabled={rendering}
            style={{
              padding: '8px 24px',
              fontSize: 13,
              fontWeight: 700,
              cursor: rendering ? 'wait' : 'pointer',
              background: rendering
                ? '#94a3b8'
                : `linear-gradient(135deg,${CB.blue},${CB.cyan})`,
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              boxShadow: rendering ? 'none' : '0 2px 8px rgba(0,119,187,0.3)',
              opacity: rendering ? 0.7 : 1,
            }}
          >
            {rendering ? `Rendering… ${Math.round(renderProgress * 100)}%` : 'Render & Download MP4'}
          </button>
        </div>

        {/* Rendering progress */}
        {rendering && (
          <div
            style={{
              marginTop: 12,
              height: 4,
              background: '#e2e8f0',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${renderProgress * 100}%`,
                height: '100%',
                background: `linear-gradient(90deg,${CB.blue},${CB.cyan})`,
                borderRadius: 2,
                transition: 'width 0.3s',
              }}
            />
          </div>
        )}

        {/* CLI hint */}
        <div
          style={{
            marginTop: 12,
            padding: '8px 12px',
            background: '#f8fafc',
            borderRadius: 6,
            border: '1px dashed #cbd5e1',
            fontSize: 11,
            color: '#64748b',
          }}
        >
          <strong>CLI rendering:</strong>{' '}
          <code style={{ background: '#e2e8f0', padding: '1px 4px', borderRadius: 3 }}>
            npm run render:video -- --input rollouts.jsonl
          </code>{' '}
          for higher quality offline rendering via Remotion CLI.
        </div>
      </div>
    </div>
  );
}
