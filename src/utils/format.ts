/* Step/substep formatting */
export const fmtIter = (v: number | null | undefined): string => {
  if (v == null) return '—';
  const s = Math.floor(v);
  const sub = Math.round((v - s) * 10);
  return sub > 0 ? `${s}.${sub}` : `${s}`;
};

export const iterParts = (v: number | null | undefined): { step: number; sub: number } => {
  if (v == null) return { step: 0, sub: 0 };
  const s = Math.floor(v);
  const sub = Math.round((v - s) * 10);
  return { step: s, sub };
};
