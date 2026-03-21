import { CB } from '../../constants/colors';
import { exportCSV, exportJSONL } from '../../utils/export';
import { useAppState, useAppDispatch } from '../../context/AppContext';

interface SidebarFooterProps {
  fileRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function SidebarFooter({ fileRef, onFileChange }: SidebarFooterProps) {
  const { rows, selRows } = useAppState();
  const dispatch = useAppDispatch();

  return (
    <div
      style={{
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        borderTop: '1px solid #cbd5e1',
        background: '#fff',
      }}
    >
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="file"
          accept=".jsonl,.json,.txt"
          ref={fileRef as React.RefObject<HTMLInputElement>}
          onChange={onFileChange}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            flex: 1,
            padding: '6px 0',
            background: '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: 6,
            cursor: 'pointer',
            color: '#334155',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          + Load
        </button>
        <button
          onClick={() => dispatch({ type: 'RESET' })}
          style={{
            padding: '6px 12px',
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: 6,
            cursor: 'pointer',
            color: '#b91c1c',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          Reset
        </button>
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
        Export
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => exportCSV(rows, selRows)}
          style={{
            flex: 1,
            padding: '6px 0',
            background: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: 6,
            cursor: 'pointer',
            color: '#166534',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          CSV{selRows.length ? ` (${selRows.length})` : ''}
        </button>
        <button
          onClick={() => exportJSONL(rows, selRows)}
          style={{
            flex: 1,
            padding: '6px 0',
            background: '#fffbeb',
            border: '1px solid #fde047',
            borderRadius: 6,
            cursor: 'pointer',
            color: '#854d0e',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          JSONL{selRows.length ? ` (${selRows.length})` : ''}
        </button>
      </div>
      <button
        onClick={() => dispatch({ type: 'SET_EXPORTING', exporting: true })}
        style={{
          width: '100%',
          padding: '8px 0',
          background: CB.blue,
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          color: 'white',
          fontSize: 12,
          fontWeight: 700,
          boxShadow: '0 2px 4px rgba(0,119,187,0.2)',
        }}
      >
        🖨️ Print / Save as PDF
      </button>
      {selRows.length > 0 && (
        <button
          onClick={() => dispatch({ type: 'SET_SEL_ROWS', selRows: [] })}
          style={{
            width: '100%',
            padding: '4px 0',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#64748b',
            fontSize: 10,
            fontWeight: 600,
            textDecoration: 'underline',
          }}
        >
          Clear selection
        </button>
      )}
    </div>
  );
}
