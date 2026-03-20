import { memo } from 'react';
import type { ChartPoint } from '../../types';
import { METRIC_CFG, PALETTE } from '../../constants/metrics';
import SparkLine from '../charts/SparkLine';

interface DashboardChartCardProps {
  metricKey: string;
  points: ChartPoint[];
  highlightX: string | number | null;
  colorIndex: number;
}

export default memo(function DashboardChartCard({
  metricKey,
  points,
  highlightX,
  colorIndex,
}: DashboardChartCardProps) {
  const cfg = METRIC_CFG[metricKey];
  const color = cfg?.color || PALETTE[colorIndex % PALETTE.length];
  const last = points[points.length - 1]?.y;

  return (
    <div
      style={{
        background: 'var(--color-background-primary, #fff)',
        border: '1px solid var(--color-border-tertiary, #e2e8f0)',
        borderRadius: 8,
        padding: 10,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 4,
        }}
      >
        <span style={{ fontSize: 12, flexShrink: 0 }}>{cfg?.icon || '📊'}</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}
        >
          {metricKey}
        </span>
        {last != null && (
          <span
            style={{
              fontSize: 10,
              fontFamily: 'monospace',
              color: 'var(--color-text-secondary, #64748b)',
              flexShrink: 0,
            }}
          >
            {last < 0.01 && last > 0 ? last.toExponential(2) : last.toFixed(4)}
          </span>
        )}
      </div>
      <SparkLine
        points={points}
        color={color}
        height={80}
        width={400}
        unit={cfg?.unit}
        zones={cfg?.zones}
        highlightX={highlightX}
      />
    </div>
  );
});
