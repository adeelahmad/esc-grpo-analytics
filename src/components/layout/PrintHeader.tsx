import { CB } from '../../constants/colors';
import { fmtIter } from '../../utils/format';
import { isForced } from '../../utils/data';
import { useAppState } from '../../context/AppContext';
import { TABS } from './TabBar';

export default function PrintHeader() {
  const { rows, sel, tab, exporting } = useAppState();
  const row = rows[sel];
  if (!row) return null;

  return (
    <div data-print-header="" style={{ padding: '12px 20px', borderBottom: '2px solid #0f172a' }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: CB.blue }}>
        ESC-GRPO Rollout Inspector
      </div>
      <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
        Row {sel + 1} of {rows.length} · Step {fmtIter(row.iteration)} ·{' '}
        {row.correct ? '✓ Correct' : '✗ Wrong'} · R:{(row.reward ?? 0).toFixed(3)}
        {isForced(row) ? ' · 💉 Forced Answer' : ''} ·{' '}
        {exporting ? 'Full Report (All Tabs)' : `Tab: ${TABS.find((t) => t.id === tab)?.lbl}`} ·
        Printed {new Date().toLocaleString()}
      </div>
    </div>
  );
}
