import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardChartCard from './DashboardChartCard';
import type { ChartPoint } from '../../types';

const pts: ChartPoint[] = [
  { x: '0', y: 0.1 },
  { x: '1', y: 0.5 },
  { x: '2', y: 0.9 },
];

describe('DashboardChartCard', () => {
  it('renders metric key as title', () => {
    render(
      <DashboardChartCard metricKey="accuracy" points={pts} highlightX={null} colorIndex={0} />,
    );
    expect(screen.getByText('accuracy')).toBeTruthy();
  });

  it('renders last value', () => {
    const { container } = render(
      <DashboardChartCard metricKey="loss" points={pts} highlightX={null} colorIndex={0} />,
    );
    // Last point value 0.9 → "0.9000"
    expect(container.textContent).toContain('0.9000');
  });

  it('renders sparkline chart by default', () => {
    const { container } = render(
      <DashboardChartCard metricKey="loss" points={pts} highlightX={null} colorIndex={0} />,
    );
    expect(container.querySelector('path')).toBeTruthy();
  });

  it('renders scatter chart when scatter=true', () => {
    const scatterPts: ChartPoint[] = [
      { x: 100, y: 0.5 },
      { x: 200, y: 0.8 },
      { x: 300, y: 0.3 },
    ];
    const { container } = render(
      <DashboardChartCard
        metricKey="length_vs_reward"
        points={scatterPts}
        highlightX={null}
        colorIndex={0}
        scatter
        xLabel="Tokens"
        yLabel="Reward"
      />,
    );
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(scatterPts.length);
  });

  it('uses icon override when provided', () => {
    const { container } = render(
      <DashboardChartCard
        metricKey="custom_metric"
        points={pts}
        highlightX={null}
        colorIndex={0}
        iconOverride="🎯"
      />,
    );
    expect(container.textContent).toContain('🎯');
  });

  it('uses METRIC_CFG icon for known metrics', () => {
    const { container } = render(
      <DashboardChartCard metricKey="loss" points={pts} highlightX={null} colorIndex={0} />,
    );
    expect(container.textContent).toContain('📉');
  });

  it('formats small last values in exponential notation', () => {
    const smallPts: ChartPoint[] = [{ x: '0', y: 0.005 }];
    const { container } = render(
      <DashboardChartCard metricKey="test" points={smallPts} highlightX={null} colorIndex={0} />,
    );
    expect(container.textContent).toMatch(/5\.00e-3/);
  });
});
