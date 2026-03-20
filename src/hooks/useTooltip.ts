import { useState, useCallback } from 'react';
import type { TooltipData, TooltipPos } from '../types';

export function useTooltip() {
  const [tt, setTt] = useState<TooltipData | null>(null);
  const [ttPos, setTtPos] = useState<TooltipPos>({ x: 0, y: 0 });

  const showTooltip = useCallback((e: React.MouseEvent, data: TooltipData) => {
    setTtPos({ x: e.clientX, y: e.clientY });
    setTt(data);
  }, []);

  const updatePos = useCallback((e: React.MouseEvent) => {
    setTtPos({ x: e.clientX, y: e.clientY });
  }, []);

  const hideTooltip = useCallback(() => {
    setTt(null);
  }, []);

  return { tt, ttPos, setTt, setTtPos, showTooltip, updatePos, hideTooltip };
}
