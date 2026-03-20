/* Safe array aggregation — prevents call-stack-exceeded on 10k+ arrays */
export const safeMax = (a: number[]): number => a.reduce((m, v) => (v > m ? v : m), -Infinity);
export const safeMin = (a: number[]): number => a.reduce((m, v) => (v < m ? v : m), Infinity);
