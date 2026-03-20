/**
 * Persona description analysis utilities.
 *
 * Detects language/script of text segments and classifies persona descriptions
 * found within rollout segments.
 */

import type { Segment } from '../types';

/* ═══ Script / Language types ═══ */

export type ScriptKind = 'latin' | 'devanagari' | 'arabic' | 'mixed' | 'unknown';

export type LanguageLabel = 'roman_urdu' | 'hindi' | 'english' | 'urdu' | 'roman_hindi' | 'unknown';

export interface PersonaResult {
  /** Original text of the persona description */
  text: string;
  /** Detected primary script */
  script: ScriptKind;
  /** Detected language */
  language: LanguageLabel;
  /** Human-readable language label */
  languageLabel: string;
  /** Whether this persona meets extraction criteria (non-English, non-standard-Urdu) */
  valid: boolean;
  /** Reason for valid/invalid classification */
  reason: string;
  /** Index of the source segment */
  segmentIndex: number;
  /** Segment tag */
  tag: string;
  /** Confidence score 0-1 */
  confidence: number;
  /** Detected indicator words/patterns */
  indicators: string[];
}

export interface PersonaSummary {
  total: number;
  valid: number;
  invalid: number;
  byLanguage: Record<string, number>;
  byScript: Record<string, number>;
  personas: PersonaResult[];
}

/* ═══ Unicode range helpers ═══ */

const DEVANAGARI_RE = /[\u0900-\u097F]/;
const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
const LATIN_RE = /[a-zA-Z]/;

/** Count characters in each script range */
function scriptCounts(text: string): { latin: number; devanagari: number; arabic: number } {
  let latin = 0,
    devanagari = 0,
    arabic = 0;
  for (const ch of text) {
    if (LATIN_RE.test(ch)) latin++;
    else if (DEVANAGARI_RE.test(ch)) devanagari++;
    else if (ARABIC_RE.test(ch)) arabic++;
  }
  return { latin, devanagari, arabic };
}

/** Determine the primary script of a text */
export function detectScript(text: string): ScriptKind {
  const c = scriptCounts(text);
  const total = c.latin + c.devanagari + c.arabic;
  if (total === 0) return 'unknown';

  const latinPct = c.latin / total;
  const devPct = c.devanagari / total;
  const arabicPct = c.arabic / total;

  if (devPct > 0.5) return 'devanagari';
  if (arabicPct > 0.5) return 'arabic';
  if (latinPct > 0.5) return 'latin';
  return 'mixed';
}

/* ═══ Language indicator word lists ═══ */

/** Common Roman Urdu/Hindi words (romanized) — case-insensitive */
const ROMAN_URDU_HINDI_WORDS = new Set([
  'main',
  'mein',
  'hoon',
  'hain',
  'hai',
  'aur',
  'ek',
  'ke',
  'ki',
  'ka',
  'ko',
  'se',
  'jo',
  'ye',
  'wo',
  'hum',
  'tum',
  'apni',
  'apna',
  'apne',
  'mera',
  'meri',
  'tera',
  'teri',
  'koi',
  'kuch',
  'nahi',
  'nahin',
  'kya',
  'kaise',
  'kaisa',
  'kaisi',
  'bahut',
  'bohot',
  'bhi',
  'lekin',
  'magar',
  'liye',
  'wala',
  'wali',
  'wale',
  'chahte',
  'chahti',
  'chahta',
  'karna',
  'karni',
  'karte',
  'karti',
  'sakta',
  'sakti',
  'sakte',
  'milna',
  'dosti',
  'pasand',
  'khushi',
  'zindagi',
  'pati',
  'patni',
  'logon',
  'naye',
  'humein',
  'thoda',
  'chalte',
  'chalti',
]);

/** Score how many Roman Urdu/Hindi indicator words appear */
function romanUrduHindiScore(text: string): { score: number; indicators: string[] } {
  const words = text.toLowerCase().split(/\s+/);
  const indicators: string[] = [];
  for (const w of words) {
    const clean = w.replace(/[^a-z]/g, '');
    if (clean && ROMAN_URDU_HINDI_WORDS.has(clean)) {
      indicators.push(clean);
    }
  }
  const score = words.length > 0 ? indicators.length / words.length : 0;
  return { score, indicators };
}

/** Check if text is likely standard English */
function isLikelyEnglish(text: string): boolean {
  const words = text.toLowerCase().split(/\s+/);
  const { indicators } = romanUrduHindiScore(text);
  // If very few Roman Urdu indicators relative to word count, likely English
  return indicators.length <= 1 && words.length > 3;
}

/* ═══ Language detection ═══ */

export function detectLanguage(
  text: string,
  script: ScriptKind,
): { language: LanguageLabel; label: string; confidence: number; indicators: string[] } {
  if (script === 'devanagari') {
    return { language: 'hindi', label: 'Hindi (Devanagari)', confidence: 0.95, indicators: [] };
  }

  if (script === 'arabic') {
    return { language: 'urdu', label: 'Urdu (Nastaliq)', confidence: 0.9, indicators: [] };
  }

  if (script === 'latin') {
    const { score, indicators } = romanUrduHindiScore(text);
    if (score >= 0.15 && indicators.length >= 2) {
      return {
        language: 'roman_urdu',
        label: 'Roman Urdu/Hindi',
        confidence: Math.min(0.5 + score, 0.95),
        indicators,
      };
    }
    if (isLikelyEnglish(text)) {
      return { language: 'english', label: 'English', confidence: 0.85, indicators: [] };
    }
    return { language: 'unknown', label: 'Unknown (Latin)', confidence: 0.3, indicators: [] };
  }

  return { language: 'unknown', label: 'Unknown', confidence: 0.2, indicators: [] };
}

/* ═══ Extraction criteria ═══ */

/**
 * A persona is "valid" for extraction if it is:
 * - Roman Urdu/Hindi (Latin script) → VALID
 * - Hindi (Devanagari script) → VALID
 * - English → INVALID
 * - Standard Urdu (Arabic/Nastaliq script) → INVALID
 */
function classifyValidity(lang: LanguageLabel): { valid: boolean; reason: string } {
  switch (lang) {
    case 'roman_urdu':
    case 'roman_hindi':
      return { valid: true, reason: 'Roman Urdu/Hindi in Latin script meets extraction criteria' };
    case 'hindi':
      return { valid: true, reason: 'Hindi in Devanagari script meets extraction criteria' };
    case 'english':
      return { valid: false, reason: 'English is excluded from extraction' };
    case 'urdu':
      return { valid: false, reason: 'Standard Urdu (Arabic script) is excluded from extraction' };
    default:
      return { valid: false, reason: 'Unable to classify language with sufficient confidence' };
  }
}

/* ═══ Main analysis function ═══ */

/** Minimum text length to consider as a potential persona */
const MIN_PERSONA_LEN = 20;

/**
 * Analyze rollout segments for persona descriptions.
 * Extracts text from segments with content and performs
 * language/script detection on each.
 */
export function analyzePersonas(segments: Segment[]): PersonaSummary {
  const personas: PersonaResult[] = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const text = (seg.text || '').trim();
    if (text.length < MIN_PERSONA_LEN) continue;

    const script = detectScript(text);
    const { language, label, confidence, indicators } = detectLanguage(text, script);
    const { valid, reason } = classifyValidity(language);

    personas.push({
      text,
      script,
      language,
      languageLabel: label,
      valid,
      reason,
      segmentIndex: i,
      tag: seg.tag || '(none)',
      confidence,
      indicators,
    });
  }

  const byLanguage: Record<string, number> = {};
  const byScript: Record<string, number> = {};
  for (const p of personas) {
    byLanguage[p.languageLabel] = (byLanguage[p.languageLabel] || 0) + 1;
    byScript[p.script] = (byScript[p.script] || 0) + 1;
  }

  return {
    total: personas.length,
    valid: personas.filter((p) => p.valid).length,
    invalid: personas.filter((p) => !p.valid).length,
    byLanguage,
    byScript,
    personas,
  };
}
