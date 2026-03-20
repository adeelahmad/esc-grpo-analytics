import { CB } from '../../constants/colors';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { useDataLoader } from '../../hooks/useDataLoader';

interface EmptyStateProps {
  dk: (l: string, d: string) => string;
}

export default function EmptyState({ dk }: EmptyStateProps) {
  const { raw } = useAppState();
  const dispatch = useAppDispatch();
  const { fileRef, parse, handleFile } = useDataLoader();

  return (
    <div style={{ padding: 40, maxWidth: 800, margin: '0 auto', fontFamily: 'var(--font-sans)', background: dk('f1f5f9', '0f172a'), color: dk('0f172a', 'f1f5f9') }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, marginTop: 0, color: CB.blue }}>ESC-GRPO Rollout Inspector</h2>
      <p style={{ fontSize: 14, color: '#475569', marginBottom: 24 }}>Load a <code>.jsonl</code> file or paste text. Each line = one JSON training row.</p>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap', background: '#f8fafc', padding: 20, borderRadius: 8, border: '1px dashed #cbd5e1' }}>
        <input type="file" accept=".jsonl,.json,.txt" ref={fileRef} onChange={handleFile} style={{ display: 'none' }} />
        <button onClick={() => fileRef.current?.click()} style={{ padding: '10px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 700, background: CB.blue, color: 'white', border: 'none', borderRadius: 6, boxShadow: '0 2px 4px rgba(0,119,187,0.2)' }}>Open .jsonl file</button>
        <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 500 }}>— OR PASTE BELOW —</span>
      </div>
      <textarea
        value={raw}
        onChange={e => dispatch({ type: 'SET_RAW', raw: e.target.value })}
        placeholder='{"type":"math","reward":1.0,...}'
        style={{ width: '100%', height: 250, fontFamily: 'var(--font-mono)', fontSize: 12, padding: 16, border: '1px solid #cbd5e1', borderRadius: 8, boxSizing: 'border-box', resize: 'vertical', background: '#fff', color: '#0f172a', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)' }}
      />
      <div style={{ display: 'flex', gap: 16, marginTop: 16, alignItems: 'center' }}>
        <button onClick={() => parse(raw)} style={{ padding: '10px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 700, background: CB.green, color: 'white', border: 'none', borderRadius: 6 }}>Load</button>
        <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{raw.trim().split('\n').filter(l => l.trim()).length} lines</span>
      </div>
    </div>
  );
}
