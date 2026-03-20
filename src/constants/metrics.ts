import type { MetricConfig } from '../types';
import { CB } from './colors';

export const METRIC_CFG: Record<string, MetricConfig> = {
  weight_angle_avg: {
    icon: '🧭',
    color: CB.magenta,
    hero: true,
    unit: '°',
    help: 'Rotation angle = how much LoRA weights rotated from base. Sub-degree monotonic = healthy. Green zone 0.5–0.7° is optimal. Red ≥1.9° = death zone.',
    zones: [
      { min: 0.5, max: 0.7, color: CB.green, label: 'sweet 0.5–0.7°' },
      { min: 1.9, max: 3.0, color: CB.red, label: 'death ≥1.9°' },
    ],
  },
  loss: {
    icon: '📉',
    color: CB.red,
    help: 'Training loss. Should decrease over time. Spikes may indicate learning rate issues or data problems.',
  },
  kl: {
    icon: '📊',
    color: CB.orange,
    help: 'KL divergence from reference model. If this spikes while reward also spikes, the model may have collapsed. Healthy: bounded and stable.',
  },
  kl_div: {
    icon: '📊',
    color: CB.orange,
    help: 'KL divergence (alternative key). Same interpretation as kl.',
  },
  approx_kl: {
    icon: '📊',
    color: '#c2410c',
    help: 'Approximate KL divergence (PPO-style). Should stay bounded — large values mean the policy update was too aggressive.',
  },
  grad_norm: {
    icon: '⚡',
    color: CB.yellow,
    help: 'Gradient norm. Spikes = exploding gradients. Flat at clip value = gradient clipping is active. Gradually decreasing = healthy convergence.',
  },
  mean_reward: {
    icon: '🎯',
    color: CB.green,
    help: 'Average reward across the batch at this step. Should trend upward over training.',
  },
  reward_std: {
    icon: '📏',
    color: CB.teal,
    help: 'Standard deviation of rewards within the batch. High variance = model performance is inconsistent. Should stabilize over time.',
  },
  entropy: {
    icon: '🌀',
    color: CB.purple,
    help: 'Policy entropy. Dropping = more confident (watch for mode collapse). Stable = healthy diverse generation. Rising = confused.',
  },
  learning_rate: {
    icon: '🔬',
    color: CB.cyan,
    help: 'Learning rate at this step. If using a scheduler, this shows warmup/decay. Sudden changes affect all other metrics.',
  },
  lr: { icon: '🔬', color: CB.cyan, help: 'Learning rate (short key).' },
  tok_per_sec: {
    icon: '🚀',
    color: CB.blue,
    help: 'Training throughput in tokens/second. Drops may indicate memory pressure or longer sequences.',
  },
  clip_fraction: {
    icon: '✂️',
    color: '#b45309',
    help: 'Fraction of samples where the policy ratio was clipped (PPO). High values mean the policy is trying to change too fast.',
  },
  value_loss: {
    icon: '💰',
    color: '#7c3aed',
    help: 'Value function loss (PPO/GRPO). Should decrease as the value head learns to predict returns.',
  },
  policy_loss: {
    icon: '📜',
    color: '#0369a1',
    help: 'Policy gradient loss. The primary optimization signal. Noisy but should trend in the right direction.',
  },
  explained_var: {
    icon: '📐',
    color: CB.teal,
    help: 'Explained variance of the value function. 1.0 = perfect prediction. Negative = worse than baseline.',
  },
  perplexity: {
    icon: '❓',
    color: '#dc2626',
    help: 'Model perplexity. Lower = more confident predictions. Should decrease over training.',
  },
  progress: { icon: '📈', color: '#16a34a', help: 'Training progress indicator.' },
};

export const PALETTE = [
  CB.blue,
  CB.orange,
  CB.green,
  CB.red,
  CB.cyan,
  CB.magenta,
  CB.purple,
  CB.yellow,
  CB.teal,
  '#7c3aed',
  '#0369a1',
  '#b45309',
  '#dc2626',
  '#16a34a',
  '#6b7280',
];
