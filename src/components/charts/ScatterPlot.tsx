import { memo } from 'react';
import { CB } from '../../constants/colors';
import { safeMin, safeMax } from '../../utils/math';
import type { ChartPoint } from '../../types';

interface ScatterPlotProps {
  points: ChartPoint[];
  width?: number;
  height?: number;
  xLabel?: string;
  yLabel?: string;
  title?: string;
  color?: string;
  trendLine?: boolean;
}

export default memo(function ScatterPlot({
  points, width = 680, height = 200, xLabel = '', yLabel = '',
  title, color = CB.blue, trendLine,
}: ScatterPlotProps) {
  if (!points.length) return null;

  const P = 44, PR = 16, PT = 16, PB = 28;
  const xs = points.map(p => p.x as number);
  const ys = points.map(p => p.y);
  const xMin = safeMin(xs), xMax = safeMax(xs), yMin = safeMin(ys), yMax = safeMax(ys);
  const xRng = xMax - xMin || 1, yRng = yMax - yMin || 1;
  const px = (v: number) => P + (v - xMin) / xRng * (width - P - PR);
  const py = (v: number) => PT + (yMax - v) / yRng * (height - PT - PB);

  let slope = 0, intercept = 0, r2 = 0;
  if (trendLine && points.length > 2) {
    const n = points.length;
    const sx = xs.reduce((a, b) => a + b, 0);
    const sy = ys.reduce((a, b) => a + b, 0);
    const sxy = points.reduce((a, p) => a + (p.x as number) * p.y, 0);
    const sxx = xs.reduce((a, v) => a + v * v, 0);
    slope = (n * sxy - sx * sy) / (n * sxx - sx * sx || 1);
    intercept = (sy - slope * sx) / n;
    const yMean = sy / n;
    const ssTot = ys.reduce((a, v) => a + (v - yMean) ** 2, 0);
    const ssRes = points.reduce((a, p) => a + (p.y - (slope * (p.x as number) + intercept)) ** 2, 0);
    r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  }

  return (
    <div style={{ marginBottom: 6 }}>
      {title && <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 4 }}>{title}</div>}
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height, background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
        <line x1={P} y1={PT} x2={P} y2={height - PB} stroke="#cbd5e1" strokeWidth={1} />
        <line x1={P} y1={height - PB} x2={width - PR} y2={height - PB} stroke="#cbd5e1" strokeWidth={1} />
        {Array.from({ length: 5 }, (_, i) => yMin + (yRng * i) / 4).map((v, i) => (
          <g key={i}>
            <line x1={P} y1={py(v)} x2={width - PR} y2={py(v)} stroke="#e5e7eb" strokeWidth={0.5} strokeDasharray="3,3" />
            <text x={P - 4} y={py(v) + 3} fontSize={8} fill="#94a3b8" textAnchor="end">{v.toFixed(v < 1 ? 3 : 1)}</text>
          </g>
        ))}
        {Array.from({ length: 5 }, (_, i) => xMin + (xRng * i) / 4).map((v, i) => (
          <text key={i} x={px(v)} y={height - 8} fontSize={8} fill="#94a3b8" textAnchor="middle">{v.toFixed(0)}</text>
        ))}
        {trendLine && points.length > 2 && (
          <line x1={px(xMin)} y1={py(slope * xMin + intercept)} x2={px(xMax)} y2={py(slope * xMax + intercept)}
            stroke={CB.red} strokeWidth={1.5} strokeDasharray="6,3" opacity={0.7} />
        )}
        {points.map((p, i) => (
          <circle key={i} cx={px(p.x as number)} cy={py(p.y)}
            r={points.length < 100 ? 4 : 2.5}
            fill={p.ok ? CB.green : p.ok === false ? CB.red : color}
            stroke="white" strokeWidth={0.8} opacity={0.8}>
            <title>{xLabel}={(p.x as number).toFixed(0)}, {yLabel}={p.y.toFixed(3)}{p.label ? ' · ' + p.label : ''}</title>
          </circle>
        ))}
        <text x={width / 2} y={height - 1} fontSize={9} fill="#64748b" textAnchor="middle" fontWeight={600}>{xLabel}</text>
        <text x={6} y={height / 2} fontSize={9} fill="#64748b" textAnchor="middle" fontWeight={600} transform={`rotate(-90,6,${height / 2})`}>{yLabel}</text>
        {trendLine && points.length > 2 && (
          <text x={width - PR - 4} y={PT + 12} fontSize={10} fill={CB.red} textAnchor="end" fontWeight={700}>
            R²={r2.toFixed(3)} {r2 > 0.7 ? '⚠️ SUSPICIOUS' : r2 > 0.4 ? '⚡ MODERATE' : '✓ LOW'}
          </text>
        )}
      </svg>
    </div>
  );
});
