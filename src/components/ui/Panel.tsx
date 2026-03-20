import type { PanelProps } from '../../types';

export default function Panel({ title, children, mb = 14, bc = '#3b82f6' }: PanelProps) {
  return (
    <div style={{ marginBottom: mb, background: 'var(--color-background-primary)', borderRadius: 8, padding: 12, border: '1px solid var(--color-border-tertiary)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 10, paddingLeft: 8, borderLeft: `3px solid ${bc}`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</div>
      {children}
    </div>
  );
}
