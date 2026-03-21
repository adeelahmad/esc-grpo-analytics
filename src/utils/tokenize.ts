import type { SegmentWithIdx } from './segments';
import type { SegmentRole } from '../constants/colors';
import { segRole } from '../constants/colors';

/** A single displayable token with its segment context. */
export interface StreamToken {
  text: string;
  segIdx: number;
  role: SegmentRole;
  masked: boolean;
  isFirstInSeg: boolean;
  tag: string;
  source: string;
}

/**
 * Flatten segments into individual word-level tokens.
 * Splits each segment's text by whitespace-preserving regex and distributes
 * chunks across the segment's token_count for realistic streaming granularity.
 */
export function flattenSegmentsToTokens(segments: SegmentWithIdx[]): StreamToken[] {
  const result: StreamToken[] = [];
  segments.forEach((seg, segIdx) => {
    const text = seg.text || '';
    const role = segRole(seg);
    const masked = !!seg.masked;
    const tag = seg.tag || '';
    const source = seg.source || '';
    // Split into word-level tokens preserving trailing whitespace
    const chunks = text.match(/\S+\s*/g) || [text || ' '];
    const tokenCount = seg.token_count || chunks.length;
    const chunkPerToken = chunks.length / Math.max(1, tokenCount);
    for (let t = 0; t < tokenCount; t++) {
      const chunkStart = Math.floor(t * chunkPerToken);
      const chunkEnd = Math.floor((t + 1) * chunkPerToken);
      const tokenText = chunks.slice(chunkStart, chunkEnd).join('');
      result.push({
        text: tokenText || '',
        segIdx,
        role,
        masked,
        isFirstInSeg: t === 0,
        tag,
        source,
      });
    }
  });
  return result;
}

/** Get total token count across segments. */
export function getTotalTokenCount(segments: SegmentWithIdx[]): number {
  return segments.reduce((sum, s) => sum + (s.token_count || 1), 0);
}
