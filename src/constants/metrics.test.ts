import { describe, it, expect } from 'vitest';
import { METRIC_CFG, PALETTE } from './metrics';

describe('METRIC_CFG', () => {
  it('has hero metric weight_angle_avg', () => {
    expect(METRIC_CFG.weight_angle_avg).toBeDefined();
    expect(METRIC_CFG.weight_angle_avg.hero).toBe(true);
    expect(METRIC_CFG.weight_angle_avg.unit).toBe('°');
    expect(METRIC_CFG.weight_angle_avg.zones).toHaveLength(2);
  });

  it('has rollout-derived metrics', () => {
    expect(METRIC_CFG.accuracy).toBeDefined();
    expect(METRIC_CFG.reward_per_step).toBeDefined();
    expect(METRIC_CFG.forced_rate).toBeDefined();
    expect(METRIC_CFG.scaffold_ratio).toBeDefined();
    expect(METRIC_CFG.length_vs_reward).toBeDefined();
  });

  it('has training step metrics', () => {
    expect(METRIC_CFG.loss).toBeDefined();
    expect(METRIC_CFG.kl).toBeDefined();
    expect(METRIC_CFG.grad_norm).toBeDefined();
    expect(METRIC_CFG.entropy).toBeDefined();
  });

  it('all configs have icon and color', () => {
    for (const [key, cfg] of Object.entries(METRIC_CFG)) {
      expect(cfg.icon, `${key} missing icon`).toBeDefined();
      expect(cfg.color, `${key} missing color`).toBeDefined();
    }
  });
});

describe('PALETTE', () => {
  it('has at least 10 colors', () => {
    expect(PALETTE.length).toBeGreaterThanOrEqual(10);
  });

  it('contains valid hex colors', () => {
    for (const c of PALETTE) {
      expect(c).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});
