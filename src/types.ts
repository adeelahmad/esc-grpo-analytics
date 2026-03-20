import type { ReactNode } from 'react';

/* ═══ Core data shapes (inferred from JSONL rollout format) ═══ */

export interface Segment {
  tag?: string;
  source?: string;
  token_count?: number;
  masked?: boolean;
  truncated?: boolean;
  text?: string;
  context_before?: string;
  _idx?: number;
}

export interface TokenChange {
  token_id: number;
  segment_index: number;
  token_index: number;
  before_weight: number;
  after_weight: number;
  multiplier: number;
  effective_multiplier: number;
  change_type?: string;
  match_reason?: string;
}

export interface RolloutMetadata {
  _view_name?: string;
  _view_is_naked?: boolean;
  _esc_forced_answer?: boolean;
  _esc_shaped_reward?: number;
  _esc_member_idx?: number;
  _esc_n_eff?: number;
  _esc_n_eff_max?: number;
  _is_weights?: number[];
  token_changes?: TokenChange[];
  reward_multiplier?: number;
  weight_angle_avg?: number;
  step?: Record<string, unknown>;
  steps_trained?: number;
  epochs?: number;
  batch_size?: number;
  config_name?: string;
  learning_rate?: number;
  [key: string]: unknown;
}

export interface TokenCounts {
  generated?: number;
  total_completion?: number;
  [key: string]: number | undefined;
}

export interface Rollout {
  iteration?: number;
  correct?: boolean;
  reward?: number;
  advantage?: number;
  type?: string;
  prompt?: string;
  prompt_text?: string;
  target_answer?: string;
  generated_answer?: string;
  generated_completion?: string;
  metadata?: RolloutMetadata;
  segments?: Segment[];
  token_counts?: TokenCounts;
  step?: Record<string, unknown>;
  [key: string]: unknown;
}

/* ═══ UI state types ═══ */

export type TabKey = 'overview' | 'scaffold' | 'tokens' | 'group' | 'trends' | 'dashboard' | 'raw';
export type SidebarView = 'list' | 'batch';
export type ThemeSetting = 'system' | 'light' | 'dark';
export type ColorMode = 'hybrid' | 'proximity' | 'role';
export type SortMode = 'index' | 'weight_asc' | 'weight_desc' | 'mult_desc';
export type CorrectFilter = 'all' | 'yes' | 'no';
export type LegendKey =
  | 'system'
  | 'masked'
  | 'modified'
  | 'forced'
  | 'trainable_hi'
  | 'trainable_lo'
  | null;

export interface AppSettings {
  autoSave: boolean;
  theme: ThemeSetting;
  fontSize: number;
}

export interface FilterState {
  view: string;
  correct: CorrectFilter;
  type: string;
  member: string;
  step: string;
}

export interface FilterOptions {
  views: string[];
  types: string[];
  members: string[];
  steps: string[];
}

/* ═══ Chart types ═══ */

export interface ChartPoint {
  x: string | number;
  y: number;
  ok?: boolean;
  label?: string;
}

export interface ChartZone {
  min: number;
  max: number;
  color: string;
  label: string;
}

/* ═══ Metric config ═══ */

export interface MetricConfig {
  icon?: string;
  color?: string;
  hero?: boolean;
  unit?: string;
  help?: string;
  zones?: ChartZone[];
}

/* ═══ Role visual config ═══ */

export interface RoleVisual {
  bg: string;
  lt: string;
  lbl: string;
  ic: string;
  stripe: boolean;
}

export interface SourceVisual {
  bg: string;
  bd: string;
  label: string;
}

/* ═══ Forced stats ═══ */

export interface ForcedStats {
  count: number;
  toks: number;
  masked: boolean;
  partial: boolean;
  injected: boolean;
}

/* ═══ Tooltip data ═══ */

export type TooltipData =
  | {
      type: 'segment';
      tag?: string;
      source?: string;
      token_count?: number;
      masked?: boolean;
      text?: string;
    }
  | {
      type: 'token';
      pos: number;
      w: number;
      role?: string;
      masked?: boolean | null;
      hasChange?: boolean;
    }
  | { type: 'change'; c: TokenChange };

export interface TooltipPos {
  x: number;
  y: number;
}

/* ═══ Batch tree ═══ */

export interface BatchTypeNode {
  type: string;
  rowIndices: number[];
  correct: number;
  forced: number;
}

export interface BatchSubNode {
  sub: number;
  types: Record<string, BatchTypeNode>;
  rows: number[];
  correct: number;
  total: number;
  forced: number;
}

export interface BatchStepNode {
  step: number;
  subs: Record<number, BatchSubNode>;
  rows: number[];
  correct: number;
  total: number;
  rewards: number[];
  forced: number;
}

/* ═══ Token detail inspector ═══ */

export interface TokenDetail {
  pos: number;
  w: number;
  change: TokenChange | null;
  ri: RoleMapEntry | undefined;
}

export interface RoleMapEntry {
  role: string;
  masked: boolean;
  tag: string;
  rv: RoleVisual;
  seg: Segment;
}

/* ═══ Component prop helpers ═══ */

export interface ChipProps {
  label: string;
  value: string | number;
  bg?: string;
  color?: string;
}

export interface PanelProps {
  title: string;
  children: ReactNode;
  mb?: number;
  bc?: string;
}

export interface HelpBoxProps {
  children: ReactNode;
}
