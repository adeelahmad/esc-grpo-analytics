import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import ScatterPlot from './ScatterPlot';
import type { ChartPoint } from '../../types';

const pts: ChartPoint[] = [
  { x: 100, y: 0.5, ok: true, label: 'Row 1' },
  { x: 200, y: 0.8, ok: false, label: 'Row 2' },
  { x: 300, y: 0.3, ok: true, label: 'Row 3' },
];

describe('ScatterPlot', () => {
  it('renders nothing for empty points', () => {
    const { container } = render(<ScatterPlot points={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders svg with circles for each point', () => {
    const { container } = render(<ScatterPlot points={pts} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(pts.length);
  });

  it('renders title when provided', () => {
    const { container } = render(<ScatterPlot points={pts} title="Test Scatter" />);
    expect(container.textContent).toContain('Test Scatter');
  });

  it('renders trend line when enabled with enough points', () => {
    const { container } = render(<ScatterPlot points={pts} trendLine />);
    const lines = container.querySelectorAll('line');
    // axis lines (2) + grid lines (5) + trend line (1)
    const dashLines = Array.from(lines).filter((l) => l.getAttribute('stroke-dasharray') === '6,3');
    expect(dashLines.length).toBe(1);
  });

  it('shows R² label with trend line', () => {
    const { container } = render(<ScatterPlot points={pts} trendLine />);
    expect(container.textContent).toMatch(/R²=/);
  });

  it('renders axis labels', () => {
    const { container } = render(<ScatterPlot points={pts} xLabel="Tokens" yLabel="Reward" />);
    expect(container.textContent).toContain('Tokens');
    expect(container.textContent).toContain('Reward');
  });
});
