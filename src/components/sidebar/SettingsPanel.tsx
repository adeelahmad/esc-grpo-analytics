import { CB } from '../../constants/colors';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { storage } from '../../utils/storage';

interface SettingsPanelProps {
  dk: (l: string, d: string) => string;
}

export default function SettingsPanel({ dk }: SettingsPanelProps) {
  const { settings, rows } = useAppState();
  const dispatch = useAppDispatch();

  const update = (key: keyof typeof settings, value: (typeof settings)[keyof typeof settings]) =>
    dispatch({ type: 'UPDATE_SETTING', key, value });

  const clearStorage = async () => {
    try {
      await storage.remove('esc-data');
      alert('Saved data cleared.');
    } catch (e: any) {
      alert('Clear failed: ' + e.message);
    }
  };

  return (
    <div
      style={{
        padding: '10px 12px',
        borderBottom: '1px solid ' + dk('e2e8f0', '334155'),
        background: dk('fff', '1e293b'),
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: dk('475569', '94a3b8'),
          textTransform: 'uppercase',
        }}
      >
        ⚙ Settings
      </div>
      {/* Auto-save toggle */}
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          fontSize: 11,
          color: dk('334155', 'e2e8f0'),
        }}
      >
        <input
          type="checkbox"
          checked={settings.autoSave}
          onChange={(e) => update('autoSave', e.target.checked)}
          style={{ width: 14, height: 14, accentColor: CB.blue }}
        />
        <div>
          <div style={{ fontWeight: 600 }}>💾 Auto-save data</div>
          <div style={{ fontSize: 9, color: dk('94a3b8', '64748b') }}>
            Persist loaded JSONL across sessions
          </div>
        </div>
      </label>
      {settings.autoSave && rows.length > 0 && (
        <button
          onClick={clearStorage}
          style={{
            padding: '4px 10px',
            fontSize: 10,
            fontWeight: 600,
            cursor: 'pointer',
            background: '#fef2f2',
            color: CB.red,
            border: '1px solid #fca5a5',
            borderRadius: 4,
          }}
        >
          🗑 Clear saved data
        </button>
      )}
      {/* Theme */}
      <div style={{ fontSize: 10, fontWeight: 600, color: dk('475569', '94a3b8'), marginTop: 2 }}>
        Theme
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {(
          [
            ['system', 'System'],
            ['light', '☀️ Light'],
            ['dark', '🌙 Dark'],
          ] as const
        ).map(([v, l]) => (
          <button
            key={v}
            onClick={() => update('theme', v)}
            style={{
              flex: 1,
              padding: '4px 0',
              borderRadius: 4,
              fontSize: 10,
              cursor: 'pointer',
              fontWeight: 600,
              background: settings.theme === v ? CB.blue : dk('f1f5f9', '334155'),
              color: settings.theme === v ? '#fff' : dk('475569', '94a3b8'),
              border: settings.theme === v ? 'none' : '1px solid ' + dk('cbd5e1', '475569'),
            }}
          >
            {l}
          </button>
        ))}
      </div>
      {/* Font size */}
      <div style={{ fontSize: 10, fontWeight: 600, color: dk('475569', '94a3b8'), marginTop: 2 }}>
        Font Size
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {(
          [
            [11, 'S'],
            [13, 'M'],
            [15, 'L'],
            [17, 'XL'],
          ] as const
        ).map(([v, l]) => (
          <button
            key={v}
            onClick={() => update('fontSize', v)}
            style={{
              flex: 1,
              padding: '4px 0',
              borderRadius: 4,
              fontSize: 10,
              cursor: 'pointer',
              fontWeight: 600,
              background: settings.fontSize === v ? CB.blue : dk('f1f5f9', '334155'),
              color: settings.fontSize === v ? '#fff' : dk('475569', '94a3b8'),
              border: settings.fontSize === v ? 'none' : '1px solid ' + dk('cbd5e1', '475569'),
            }}
          >
            {l}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 9, color: dk('94a3b8', '64748b'), fontStyle: 'italic' }}>
        Settings persist across sessions.
      </div>
    </div>
  );
}
