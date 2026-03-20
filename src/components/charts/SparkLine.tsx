import { memo } from 'react';
import { CB } from '../../constants/colors';
import { safeMin, safeMax } from '../../utils/math';
import type { ChartPoint, ChartZone } from '../../types';

interface SparkLineProps {
  points: ChartPoint[];
  width?: number;
  height?: number;
  label?: string;
  unit?: string;
  color?: string;
  zones?: ChartZone[];
  yRange?: [number, number];
  highlightX?: string | number | null;
}

export default memo(function SparkLine({
  points,
  width = 680,
  height = 120,
  label,
  unit = '',
  color = CB.blue,
  zones,
  yRange,
  highlightX,
}: SparkLineProps) {
  if (!points.length) return null;

  const P = 36,
    PR = 12,
    PT = 12,
    PB = 22;
  const vals = points.map((p) => p.y);
  const yMin = yRange ? yRange[0] : safeMin(vals);
  const yMax = yRange ? yRange[1] : safeMax(vals);
  const rng = yMax - yMin || 1;
  const xS = (width - P - PR) / Math.max(points.length - 1, 1);
  const px = (i: number) => P + i * xS;
  const py = (v: number) => PT + (yMax - v) * ((height - PT - PB) / rng);
  const d = points
    .map((p, i) => `${i ? 'L' : 'M'} ${px(i).toFixed(1)} ${py(p.y).toFixed(1)}`)
    .join(' ');
  const hlIdx = highlightX != null ? points.findIndex((p) => p.x === highlightX) : -1;
  const gridY = Array.from({ length: 5 }, (_, i) => yMin + (rng * i) / 4);

  return (
    <div style={{ marginBottom: 6 }}>
      {label && (
        <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 4 }}>{label}</div>
      )}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{
          width: '100%',
          height,
          background: '#f8fafc',
          borderRadius: 6,
          border: '1px solid #e2e8f0',
        }}
      >
        {gridY.map((v, i) => (
          <g key={i}>
            <line
              x1={P}
              y1={py(v)}
              x2={width - PR}
              y2={py(v)}
              stroke="#e5e7eb"
              strokeWidth={0.5}
              strokeDasharray={i === 0 || i === 4 ? 'none' : '3,3'}
            />
            <text x={P - 4} y={py(v) + 3} fontSize={8} fill="#94a3b8" textAnchor="end">
              {v < 0.01 && v > 0 ? v.toExponential(1) : v.toFixed(v < 1 ? 4 : 2)}
            </text>
          </g>
        ))}
        {zones?.map((z, i) => (
          <rect
            key={i}
            x={P}
            y={py(Math.min(z.max, yMax))}
            width={width - P - PR}
            height={Math.max(0, py(Math.max(z.min, yMin)) - py(Math.min(z.max, yMax)))}
            fill={z.color}
            opacity={0.12}
          />
        ))}
        {zones?.map((z, i) => (
          <text
            key={'zl' + i}
            x={width - PR - 2}
            y={py((z.min + z.max) / 2) + 3}
            fontSize={7}
            fill={z.color}
            textAnchor="end"
            opacity={0.7}
          >
            {z.label}
          </text>
        ))}
        <path d={d} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={px(i)}
            cy={py(p.y)}
            r={points.length < 80 ? 2.5 : 1.2}
            fill={color}
            stroke="white"
            strokeWidth={0.8}
          >
            <title>
              step {p.x}: {p.y.toFixed(6)}
              {unit}
            </title>
          </circle>
        ))}
        {points
          .filter(
            (_, i) =>
              i % Math.max(1, Math.floor(points.length / 8)) === 0 || i === points.length - 1,
          )
          .map((p, i) => (
            <text
              key={'x' + i}
              x={px(points.indexOf(p))}
              y={height - 4}
              fontSize={8}
              fill="#94a3b8"
              textAnchor="middle"
            >
              {p.x}
            </text>
          ))}
        {hlIdx >= 0 &&
          (() => {
            const hp = points[hlIdx];
            return (
              <g>
                <line
                  x1={px(hlIdx)}
                  y1={PT}
                  x2={px(hlIdx)}
                  y2={height - PB}
                  stroke={CB.magenta}
                  strokeWidth={1.5}
                  strokeDasharray="4,2"
                  opacity={0.7}
                />
                <circle
                  cx={px(hlIdx)}
                  cy={py(hp.y)}
                  r={6}
                  fill="none"
                  stroke={CB.magenta}
                  strokeWidth={2.5}
                />
                <circle cx={px(hlIdx)} cy={py(hp.y)} r={2.5} fill={CB.magenta} />
                <rect
                  x={px(hlIdx) - 28}
                  y={py(hp.y) - 18}
                  width={56}
                  height={14}
                  rx={3}
                  fill={CB.magenta}
                  opacity={0.9}
                />
                <text
                  x={px(hlIdx)}
                  y={py(hp.y) - 8}
                  fontSize={8}
                  fill="white"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  YOU: {hp.y < 0.01 && hp.y > 0 ? hp.y.toExponential(1) : hp.y.toFixed(4)}
                </text>
              </g>
            );
          })()}
      </svg>
    </div>
  );
});
