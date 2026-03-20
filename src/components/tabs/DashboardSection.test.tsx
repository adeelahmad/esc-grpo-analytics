import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DashboardSection from './DashboardSection';
import type { ChartPoint } from '../../types';

const metricData: Record<string, ChartPoint[]> = {
  loss: [
    { x: '0', y: 1.0 },
    { x: '1', y: 0.5 },
  ],
  accuracy: [
    { x: '0', y: 0.5 },
    { x: '1', y: 0.9 },
  ],
  kl: [
    { x: '0', y: 0.01 },
    { x: '1', y: 0.02 },
  ],
};

describe('DashboardSection', () => {
  it('renders section title', () => {
    render(
      <DashboardSection
        title="Charts"
        metrics={['loss', 'accuracy']}
        metricData={metricData}
        highlightX={null}
        keyOffset={0}
      />,
    );
    expect(screen.getByText(/Charts/)).toBeTruthy();
  });

  it('renders correct metric count', () => {
    render(
      <DashboardSection
        title="Charts"
        metrics={['loss', 'accuracy']}
        metricData={metricData}
        highlightX={null}
        keyOffset={0}
      />,
    );
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('renders chart cards for each metric', () => {
    render(
      <DashboardSection
        title="Charts"
        metrics={['loss', 'accuracy']}
        metricData={metricData}
        highlightX={null}
        keyOffset={0}
      />,
    );
    expect(screen.getByText('loss')).toBeTruthy();
    expect(screen.getByText('accuracy')).toBeTruthy();
  });

  it('collapses on header click', () => {
    render(
      <DashboardSection
        title="Charts"
        metrics={['loss']}
        metricData={metricData}
        highlightX={null}
        keyOffset={0}
      />,
    );
    expect(screen.getByText('loss')).toBeTruthy();

    fireEvent.click(screen.getByText(/Charts/));
    expect(screen.queryByText('loss')).toBeNull();
  });

  it('re-expands on second click', () => {
    render(
      <DashboardSection
        title="Charts"
        metrics={['loss']}
        metricData={metricData}
        highlightX={null}
        keyOffset={0}
      />,
    );

    const header = screen.getByText(/Charts/);
    fireEvent.click(header);
    fireEvent.click(header);
    expect(screen.getByText('loss')).toBeTruthy();
  });

  it('skips metrics with no data', () => {
    render(
      <DashboardSection
        title="Charts"
        metrics={['loss', 'nonexistent']}
        metricData={metricData}
        highlightX={null}
        keyOffset={0}
      />,
    );
    expect(screen.getByText('loss')).toBeTruthy();
    expect(screen.queryByText('nonexistent')).toBeNull();
  });

  it('shows pagination for many metrics', () => {
    // Create 20 metrics (PAGE_SIZE=18)
    const manyMetrics: Record<string, ChartPoint[]> = {};
    const keys: string[] = [];
    for (let i = 0; i < 20; i++) {
      const key = `metric_${i}`;
      keys.push(key);
      manyMetrics[key] = [{ x: '0', y: i }];
    }

    render(
      <DashboardSection
        title="Many"
        metrics={keys}
        metricData={manyMetrics}
        highlightX={null}
        keyOffset={0}
      />,
    );
    expect(screen.getByText('Prev')).toBeTruthy();
    expect(screen.getByText('Next')).toBeTruthy();
    expect(screen.getByText('Page 1 of 2')).toBeTruthy();
  });

  it('passes metricMeta through to chart cards', () => {
    const { container } = render(
      <DashboardSection
        title="Charts"
        metrics={['loss']}
        metricData={metricData}
        metricMeta={{ loss: { icon: '🔥', color: '#ff0000' } }}
        highlightX={null}
        keyOffset={0}
      />,
    );
    expect(container.textContent).toContain('🔥');
  });
});
