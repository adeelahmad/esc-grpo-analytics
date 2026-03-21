import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react';
import type { Rollout, TabKey, SidebarView, AppSettings, FilterState, ChangeInfo } from '../types';

/* ═══ State shape ═══ */
export interface AppState {
  rows: Rollout[];
  sel: number;
  tab: TabKey;
  selRows: number[];
  compareMode: boolean;
  sidebarView: SidebarView;
  showSettings: boolean;
  raw: string;
  filters: FilterState;
  settings: AppSettings;
  treeOpen: Record<string, boolean>;
  changeInfo: ChangeInfo | null;
}

export const INITIAL_FILTERS: FilterState = {
  view: 'all',
  correct: 'all',
  type: 'all',
  member: 'all',
  step: 'all',
};

export const INITIAL_SETTINGS: AppSettings = {
  autoSave: true,
  theme: 'system',
  fontSize: 13,
  rolloutUrl: (import.meta.env.VITE_ROLLOUTS_PATH as string) ?? '',
  pollInterval: Number(import.meta.env.VITE_POLL_INTERVAL) || 10,
  sortNewestFirst: true,
};

const INITIAL_STATE: AppState = {
  rows: [],
  sel: 0,
  tab: 'overview',
  selRows: [],
  compareMode: false,
  sidebarView: 'list',
  showSettings: false,
  raw: '',
  filters: INITIAL_FILTERS,
  settings: INITIAL_SETTINGS,
  treeOpen: {},
  changeInfo: null,
};

/* ═══ Actions ═══ */
export type AppAction =
  | { type: 'SET_ROWS'; rows: Rollout[] }
  | { type: 'REFRESH_ROWS'; rows: Rollout[] }
  | { type: 'SET_SEL'; sel: number }
  | { type: 'SET_TAB'; tab: TabKey }
  | { type: 'SET_RAW'; raw: string }
  | { type: 'TOGGLE_SEL'; index: number }
  | { type: 'SET_SEL_ROWS'; selRows: number[] }
  | { type: 'SET_COMPARE'; on: boolean }
  | { type: 'SET_SIDEBAR_VIEW'; view: SidebarView }
  | { type: 'SET_SHOW_SETTINGS'; show: boolean }
  | { type: 'SET_FILTER'; key: keyof FilterState; value: string }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'SET_SETTINGS'; settings: AppSettings }
  | { type: 'UPDATE_SETTING'; key: keyof AppSettings; value: AppSettings[keyof AppSettings] }
  | { type: 'TOGGLE_TREE'; key: string }
  | { type: 'CLEAR_CHANGE_INFO' }
  | { type: 'RESET' };

function computeAggregates(rows: Rollout[]) {
  if (!rows.length) return { meanReward: 0, accuracy: 0 };
  const total = rows.reduce((s, r) => s + (r.reward ?? 0), 0);
  const correct = rows.filter((r) => r.correct).length;
  return { meanReward: total / rows.length, accuracy: correct / rows.length };
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_ROWS':
      return { ...state, rows: action.rows, sel: 0, tab: 'overview', selRows: [] };
    case 'REFRESH_ROWS': {
      const sel = action.rows.length > state.sel ? state.sel : 0;
      let changeInfo: ChangeInfo | null = null;
      if (state.rows.length > 0 && action.rows.length > state.rows.length) {
        const indices = new Set<number>();
        for (let j = state.rows.length; j < action.rows.length; j++) indices.add(j);
        changeInfo = {
          newRowIndices: indices,
          prevAggregates: computeAggregates(state.rows),
          timestamp: Date.now(),
        };
      }
      return { ...state, rows: action.rows, sel, changeInfo };
    }
    case 'SET_SEL':
      return { ...state, sel: action.sel };
    case 'SET_TAB':
      return { ...state, tab: action.tab };
    case 'SET_RAW':
      return { ...state, raw: action.raw };
    case 'TOGGLE_SEL': {
      const i = action.index;
      const selRows = state.selRows.includes(i)
        ? state.selRows.filter((x) => x !== i)
        : [...state.selRows, i];
      return { ...state, selRows };
    }
    case 'SET_SEL_ROWS':
      return { ...state, selRows: action.selRows };
    case 'SET_COMPARE':
      return { ...state, compareMode: action.on };
    case 'SET_SIDEBAR_VIEW':
      return { ...state, sidebarView: action.view };
    case 'SET_SHOW_SETTINGS':
      return { ...state, showSettings: action.show };
    case 'SET_FILTER':
      return { ...state, filters: { ...state.filters, [action.key]: action.value } };
    case 'CLEAR_FILTERS':
      return { ...state, filters: INITIAL_FILTERS };
    case 'SET_SETTINGS':
      return { ...state, settings: action.settings };
    case 'UPDATE_SETTING':
      return {
        ...state,
        settings: { ...state.settings, [action.key]: action.value } as AppSettings,
      };
    case 'TOGGLE_TREE':
      return {
        ...state,
        treeOpen: { ...state.treeOpen, [action.key]: !state.treeOpen[action.key] },
      };
    case 'CLEAR_CHANGE_INFO':
      return { ...state, changeInfo: null };
    case 'RESET':
      return { ...INITIAL_STATE, settings: state.settings };
    default:
      return state;
  }
}

/* ═══ Context ═══ */
const AppStateContext = createContext<AppState>(INITIAL_STATE);
const AppDispatchContext = createContext<Dispatch<AppAction>>(() => {});

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>{children}</AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

export const useAppState = () => useContext(AppStateContext);
export const useAppDispatch = () => useContext(AppDispatchContext);
