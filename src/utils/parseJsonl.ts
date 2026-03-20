import type { Rollout } from '../types';

export function parseJsonl(text: string): Rollout[] {
  return text
    .trim()
    .split('\n')
    .flatMap((l) => {
      try {
        return [JSON.parse(l.trim()) as Rollout];
      } catch {
        return [];
      }
    });
}
