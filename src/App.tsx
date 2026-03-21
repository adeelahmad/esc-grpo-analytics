import { useMemo, useCallback, useEffect } from 'react';
import { AppProvider, useAppState, useAppDispatch } from './context/AppContext';
import {
  useLoadPersistedData,
  useAutoSaveRows,
  usePersistSettings,
} from './hooks/usePersistedSettings';
import { useAutoFetch } from './hooks/useAutoFetch';
import { useDocumentTitle } from './hooks/useDocumentTitle';
import { useFilteredRows } from './hooks/useFilteredRows';
import { useBatchTree } from './hooks/useBatchTree';
import { useDataLoader } from './hooks/useDataLoader';
import { isForced } from './utils/data';
import GlobalStyles from './components/layout/GlobalStyles';
import EmptyState from './components/layout/EmptyState';
import Sidebar from './components/sidebar/Sidebar';
import TabBar, { TABS } from './components/layout/TabBar';
import PrintHeader from './components/layout/PrintHeader';
import CompareView from './components/layout/CompareView';
import OverviewTab from './components/tabs/OverviewTab';
import ScaffoldTab from './components/tabs/ScaffoldTab';
import TokenTab from './components/tabs/TokenTab';
import GroupTab from './components/tabs/GroupTab';
import TrendsTab from './components/tabs/TrendsTab';
import WandbDashboardTab from './components/tabs/WandbDashboardTab';

function AppInner() {
  const { rows, sel, tab, compareMode, settings, exporting } = useAppState();
  const dispatch = useAppDispatch();

  useLoadPersistedData();
  useAutoSaveRows();
  usePersistSettings();
  useAutoFetch();
  useDocumentTitle();

  const { filteredIndices, filterOpts, activeFilters } = useFilteredRows();
  const batchTree = useBatchTree(filteredIndices);
  const { fileRef, handleFile } = useDataLoader();

  const isDark = useMemo(() => {
    if (settings.theme === 'dark') return true;
    if (settings.theme === 'light') return false;
    return typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme:dark)').matches
      : false;
  }, [settings.theme]);

  const dk = useCallback((l: string, d: string) => (isDark ? `#${d}` : `#${l}`), [isDark]);

  const themeVars = { background: dk('f1f5f9', '0f172a'), color: dk('0f172a', 'f1f5f9') };

  useEffect(() => {
    if (!exporting) return;
    const frame = requestAnimationFrame(() => {
      window.print();
      dispatch({ type: 'SET_EXPORTING', exporting: false });
    });
    return () => cancelAnimationFrame(frame);
  }, [exporting, dispatch]);

  if (!rows.length) {
    return (
      <>
        <GlobalStyles isDark={isDark} />
        <EmptyState dk={dk} />
      </>
    );
  }

  const row = rows[sel];
  const meta = (row?.metadata || {}) as Record<string, any>;

  return (
    <>
      <GlobalStyles isDark={isDark} />
      <div
        style={{
          display: 'flex',
          height: '100vh',
          overflow: 'hidden',
          fontFamily: 'var(--font-sans)',
          fontSize: settings.fontSize,
          ...themeVars,
        }}
      >
        <Sidebar
          filteredIndices={filteredIndices}
          filterOpts={filterOpts}
          activeFilters={activeFilters}
          batchTree={batchTree}
          dk={dk}
          fileRef={fileRef}
          onFileChange={handleFile}
        />
        {row && (
          <div
            data-main=""
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              background: dk('f1f5f9', '0f172a'),
            }}
          >
            <TabBar activeFilters={activeFilters} filteredCount={filteredIndices.length} dk={dk} />
            <PrintHeader />
            <div
              data-content=""
              style={{ flex: 1, overflowY: 'auto', padding: compareMode ? 10 : 20 }}
            >
              {compareMode && !exporting ? (
                <CompareView />
              ) : (
                <div style={{ maxWidth: exporting ? 'none' : 1400, margin: '0 auto' }}>
                  {(exporting ? TABS.map((t) => t.id) : [tab]).map((tabId, idx) => (
                    <div
                      key={tabId}
                      className={exporting && idx > 0 ? 'export-tab-section' : undefined}
                    >
                      {exporting && (
                        <h2
                          className="export-tab-header"
                          style={{
                            fontSize: 18,
                            fontWeight: 700,
                            margin: idx === 0 ? '0 0 12px' : '0 0 12px',
                            padding: '12px 0 8px',
                            borderBottom: `2px solid ${dk('cbd5e1', '334155')}`,
                            color: dk('0f172a', 'f1f5f9'),
                          }}
                        >
                          {TABS.find((t) => t.id === tabId)?.lbl}
                        </h2>
                      )}
                      {tabId === 'overview' && <OverviewTab row={row} rows={rows} />}
                      {tabId === 'scaffold' && <ScaffoldTab row={row} />}
                      {tabId === 'tokens' && (
                        <TokenTab
                          weights={meta._is_weights || []}
                          changes={meta.token_changes || []}
                          segments={row.segments || []}
                        />
                      )}
                      {tabId === 'group' && (
                        <GroupTab
                          rows={rows}
                          selRow={sel}
                          setSelRow={(i: number) => dispatch({ type: 'SET_SEL', sel: i })}
                          onCompare={(idxs: number[]) => {
                            dispatch({ type: 'SET_SEL_ROWS', selRows: idxs.slice(0, 4) });
                            dispatch({ type: 'SET_COMPARE', on: true });
                          }}
                        />
                      )}
                      {tabId === 'trends' && <TrendsTab rows={rows} />}
                      {tabId === 'dashboard' && <WandbDashboardTab rows={rows} row={row} />}
                      {tabId === 'raw' && (
                        <pre
                          style={{
                            fontSize: 11,
                            background: '#1e293b',
                            padding: 16,
                            borderRadius: 8,
                            overflow: 'auto',
                            whiteSpace: 'pre-wrap',
                            color: '#f8fafc',
                            lineHeight: 1.6,
                            border: '1px solid #0f172a',
                            maxHeight: '100%',
                            margin: 0,
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
                          }}
                        >
                          {JSON.stringify(row, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
