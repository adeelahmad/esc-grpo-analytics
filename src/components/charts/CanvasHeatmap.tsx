import { useRef, useEffect, memo } from 'react';
import { safeMin, safeMax } from '../../utils/math';

interface CanvasHeatmapProps {
  weights: number[];
  height?: number;
}

export default memo(function CanvasHeatmap({ weights, height = 28 }: CanvasHeatmapProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv || !weights.length) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const W = cv.width,
      H = cv.height;
    const mi = safeMin(weights),
      mx = safeMax(weights),
      rng = mx - mi || 1;
    ctx.clearRect(0, 0, W, H);
    const step = W / weights.length;
    weights.forEach((v, i) => {
      const n = Math.max(0, Math.min(1, (v - mi) / rng));
      ctx.fillStyle = `hsl(${n * 130},${70 + n * 15}%,${25 + n * 35}%)`;
      ctx.fillRect(i * step, 0, Math.ceil(step) + 1, H);
    });
  }, [weights]);

  if (!weights.length) return null;
  const mi = safeMin(weights),
    mx = safeMax(weights);

  return (
    <div>
      <canvas
        ref={ref}
        width={Math.min(weights.length * 2, 1200)}
        height={height}
        style={{ width: '100%', height, borderRadius: 4, display: 'block' }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 9,
          color: 'var(--color-text-secondary)',
          marginTop: 4,
          fontWeight: 500,
        }}
      >
        <span>min:{mi.toFixed(3)}</span>
        <span>{weights.length} tokens</span>
        <span>max:{mx.toFixed(3)}</span>
      </div>
    </div>
  );
});
