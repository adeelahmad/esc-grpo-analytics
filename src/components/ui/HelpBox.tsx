import type { HelpBoxProps } from '../../types';

export default function HelpBox({ children }: HelpBoxProps) {
  return (
    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12, lineHeight: 1.6, color: '#1e40af' }}>
      <span style={{ fontWeight: 700, marginRight: 6 }}>💡</span>{children}
    </div>
  );
}
