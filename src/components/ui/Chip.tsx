import type { ChipProps } from '../../types';

export default function Chip({ label, value, bg = '#f1f5f9', color = '#374151' }: ChipProps) {
  return (
    <div style={{ background: bg, borderRadius: 8, padding: '6px 12px', textAlign: 'center', minWidth: 72, border: `1px solid ${color}33` }}>
      <div style={{ fontSize: 9, color: '#64748b', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>{label}</div>
      <div style={{ fontWeight: 600, fontSize: 13, color, fontFamily: 'var(--font-mono)' }}>{value}</div>
    </div>
  );
}
