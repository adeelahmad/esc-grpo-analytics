import type { Rollout } from '../src/types';

/** Generate a minimal JSONL dataset for e2e tests */
export function generateTestData(n = 16): string {
  const rows: Rollout[] = Array.from({ length: n }, (_, i) => ({
    iteration: Math.floor(i / 4) + i * 0.1,
    correct: i % 3 !== 0,
    reward: 0.1 * (i % 5),
    advantage: 0.05 * (i % 3),
    type: i % 2 === 0 ? 'math' : 'code',
    prompt: `What is ${i} + ${i}?`,
    generated_answer: `${i * 2}`,
    target_answer: `${i * 2}`,
    metadata: {
      _view_name: i % 2 === 0 ? 'naked' : 'full',
      _esc_forced_answer: i === 0,
      step: {
        loss: 1.0 - i * 0.02,
        kl: 0.01 + i * 0.002,
        grad_norm: 0.5 + Math.random() * 0.1,
        mean_reward: 0.1 * (i % 5),
      },
    },
    token_counts: { generated: 100 + i * 10, total_completion: 200 + i * 10 },
    segments: [
      { tag: 'scaffold', token_count: 50, source: 'injected' },
      { tag: 'cycle1', token_count: 100 + i * 10, source: 'generated' },
      { tag: 'answer', token_count: 20, source: 'generated' },
    ],
  }));
  return rows.map((r) => JSON.stringify(r)).join('\n');
}
