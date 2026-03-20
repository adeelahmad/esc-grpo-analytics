import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import WandbDashboardTab from './WandbDashboardTab';
import type { Rollout } from '../../types';

function makeRows(n: number): Rollout[] {
  return Array.from({ length: n }, (_, i) => ({
    iteration: Math.floor(i / 4),
    correct: i % 3 !== 0,
    reward: 0.1 * (i % 5),
    advantage: 0.05 * (i % 3),
    type: i % 2 === 0 ? 'math' : 'code',
    metadata: {
      _view_name: i % 2 === 0 ? 'naked' : 'full',
      _esc_forced_answer: i === 0,
      step: {
        loss: 1.0 - i * 0.01,
        kl: 0.01 + i * 0.001,
        grad_norm: 0.5,
      },
    },
    token_counts: { generated: 100 + i * 10, total_completion: 200 + i * 10 },
    segments: [
      { tag: 'scaffold', token_count: 50 },
      { tag: 'cycle1', token_count: 100 + i * 10 },
    ],
  }));
}

describe('WandbDashboardTab', () => {
  it('renders nothing when rows is empty', () => {
    const { container } = render(<WandbDashboardTab rows={[]} row={{} as Rollout} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders help box', () => {
    const rows = makeRows(8);
    render(<WandbDashboardTab rows={rows} row={rows[0]} />);
    expect(screen.getByText(/Training metrics/)).toBeTruthy();
  });

  it('renders Charts section with step metrics', () => {
    const rows = makeRows(8);
    render(<WandbDashboardTab rows={rows} row={rows[0]} />);
    expect(screen.getAllByText(/Charts/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders Rollouts section with derived metrics', () => {
    const rows = makeRows(8);
    render(<WandbDashboardTab rows={rows} row={rows[0]} />);
    expect(screen.getByText(/Rollouts/i)).toBeTruthy();
  });

  it('renders per-view section when views exist', () => {
    const rows = makeRows(8);
    render(<WandbDashboardTab rows={rows} row={rows[0]} />);
    expect(screen.getByText(/View/)).toBeTruthy();
    // Should have per-view metric keys
    expect(screen.getByText('view:naked_accuracy')).toBeTruthy();
    expect(screen.getByText('view:full_accuracy')).toBeTruthy();
  });

  it('renders per-type section when types exist', () => {
    const rows = makeRows(8);
    render(<WandbDashboardTab rows={rows} row={rows[0]} />);
    expect(screen.getByText(/^Type$/)).toBeTruthy();
    expect(screen.getByText('type:math_accuracy')).toBeTruthy();
    expect(screen.getByText('type:code_accuracy')).toBeTruthy();
  });

  it('renders KL Divergence section', () => {
    const rows = makeRows(8);
    render(<WandbDashboardTab rows={rows} row={rows[0]} />);
    expect(screen.getByText(/KL Divergence/i)).toBeTruthy();
  });

  it('computes accuracy correctly', () => {
    const rows: Rollout[] = [
      { iteration: 0, correct: true, reward: 1, metadata: { step: { loss: 0.5 } } },
      { iteration: 0, correct: false, reward: 0, metadata: { step: { loss: 0.5 } } },
      { iteration: 0, correct: true, reward: 1, metadata: { step: { loss: 0.5 } } },
    ];
    const { container } = render(<WandbDashboardTab rows={rows} row={rows[0]} />);
    // accuracy = 2/3 = 0.6667
    expect(container.textContent).toContain('0.6667');
  });

  it('includes length_vs_reward scatter when token data exists', () => {
    const rows = makeRows(12);
    render(<WandbDashboardTab rows={rows} row={rows[0]} />);
    expect(screen.getByText('length_vs_reward')).toBeTruthy();
  });

  it('renders forced_rate metric when forced answers exist', () => {
    const rows = makeRows(8);
    render(<WandbDashboardTab rows={rows} row={rows[0]} />);
    expect(screen.getByText('forced_rate')).toBeTruthy();
  });
});
