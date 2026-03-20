import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SparkLine from './SparkLine';
import type { ChartPoint } from '../../types';

const pts: ChartPoint[] = [
  { x: '0', y: 0.1 },
  { x: '1', y: 0.5 },
  { x: '2', y: 0.9 },
];

describe('SparkLine', () => {
  it('renders nothing for empty points', () => {
    const { container } = render(<SparkLine points={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders svg with path for valid points', () => {
    const { container } = render(<SparkLine points={pts} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    const path = container.querySelector('path');
    expect(path).toBeTruthy();
    expect(path!.getAttribute('d')).toMatch(/^M/);
  });

  it('renders circles for each data point', () => {
    const { container } = render(<SparkLine points={pts} />);
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(pts.length);
  });

  it('renders label when provided', () => {
    render(<SparkLine points={pts} label="Test Label" />);
    expect(screen.getByText('Test Label')).toBeTruthy();
  });

  it('renders highlight marker when highlightX matches', () => {
    const { container } = render(<SparkLine points={pts} highlightX="1" />);
    // Highlight adds extra circles (ring + dot) and a rect label
    const circles = container.querySelectorAll('circle');
    // 3 data points + 2 highlight circles = 5
    expect(circles.length).toBe(5);
  });

  it('does not render highlight for non-matching highlightX', () => {
    const { container } = render(<SparkLine points={pts} highlightX="99" />);
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(3);
  });

  it('renders zone rects when zones provided', () => {
    const { container } = render(
      <SparkLine
        points={pts}
        zones={[{ min: 0.2, max: 0.8, color: '#ff0000', label: 'danger' }]}
      />,
    );
    const rects = container.querySelectorAll('rect');
    // 1 zone rect + potentially highlight rects
    expect(rects.length).toBeGreaterThanOrEqual(1);
  });

  it('respects custom yRange', () => {
    const { container } = render(<SparkLine points={pts} yRange={[0, 1]} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });
});
