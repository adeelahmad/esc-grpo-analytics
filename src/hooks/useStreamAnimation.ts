import { useState, useRef, useCallback, useEffect } from 'react';

export interface StreamControls {
  active: boolean;
  paused: boolean;
  visibleTokens: number;
  totalTokens: number;
  speed: number; // tokens per second
  done: boolean;
  play: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  stop: () => void;
  seekTo: (tokenIdx: number) => void;
  setSpeed: (tps: number) => void;
}

/**
 * Token-level streaming animation using requestAnimationFrame.
 * Uses a time-delta accumulator for smooth, jitter-free token reveal
 * at any speed from 1 to 200 tokens/sec.
 */
export function useStreamAnimation(totalTokens: number): StreamControls {
  const [active, setActive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [visibleTokens, setVisibleTokens] = useState(0);
  const [speed, setSpeedState] = useState(40); // tokens per second
  const [done, setDone] = useState(false);

  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);
  const visibleRef = useRef<number>(0);
  const speedRef = useRef<number>(40);
  const totalRef = useRef<number>(totalTokens);
  const tickRef = useRef<((now: number) => void) | null>(null);

  // Keep refs in sync
  useEffect(() => {
    totalRef.current = totalTokens;
  }, [totalTokens]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const cancelRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // Store tick in a ref to avoid self-reference issues with useCallback
  useEffect(() => {
    tickRef.current = (now: number) => {
      const dt = Math.min(now - lastTimeRef.current, 100); // cap to 100ms to avoid jumps
      lastTimeRef.current = now;
      accumulatorRef.current += (dt / 1000) * speedRef.current;

      const newTokens = Math.floor(accumulatorRef.current);
      if (newTokens > 0) {
        accumulatorRef.current -= newTokens;
        const next = Math.min(visibleRef.current + newTokens, totalRef.current);
        visibleRef.current = next;
        setVisibleTokens(next);

        if (next >= totalRef.current) {
          setDone(true);
          setActive(false);
          return; // stop the loop
        }
      }

      rafRef.current = requestAnimationFrame((t) => tickRef.current?.(t));
    };
  });

  // Start/stop the rAF loop based on active/paused state
  useEffect(() => {
    if (active && !paused && !done) {
      lastTimeRef.current = performance.now();
      accumulatorRef.current = 0;
      rafRef.current = requestAnimationFrame((t) => tickRef.current?.(t));
    } else {
      cancelRaf();
    }
    return cancelRaf;
  }, [active, paused, done, cancelRaf]);

  const play = useCallback(() => {
    visibleRef.current = 0;
    setVisibleTokens(0);
    setDone(false);
    setPaused(false);
    setActive(true);
  }, []);

  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);

  const reset = useCallback(() => {
    cancelRaf();
    visibleRef.current = 0;
    setVisibleTokens(0);
    setDone(false);
    setPaused(false);
    setActive(true);
  }, [cancelRaf]);

  const stop = useCallback(() => {
    cancelRaf();
    visibleRef.current = totalRef.current;
    setVisibleTokens(totalRef.current);
    setActive(false);
    setPaused(false);
    setDone(false);
  }, [cancelRaf]);

  const seekTo = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(idx, totalRef.current));
    visibleRef.current = clamped;
    setVisibleTokens(clamped);
    if (clamped >= totalRef.current) {
      setDone(true);
      setActive(false);
    }
  }, []);

  const setSpeed = useCallback((tps: number) => {
    setSpeedState(tps);
  }, []);

  // Cleanup on unmount
  useEffect(() => cancelRaf, [cancelRaf]);

  return {
    active,
    paused,
    visibleTokens,
    totalTokens,
    speed,
    done,
    play,
    pause,
    resume,
    reset,
    stop,
    seekTo,
    setSpeed,
  };
}
