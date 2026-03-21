import { useState, useEffect, useRef, useCallback } from 'react';
import type { Dispatch } from 'react';
import type { AppAction } from '../context/AppContext';

export interface AnimationControls {
  active: boolean;
  paused: boolean;
  visibleCount: number;
  speed: number;
  queuePos: number;
  queueLen: number;
  totalSegments: number;
  done: boolean;
  play: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  stop: () => void;
  skipToNext: () => void;
  setSpeed: (ms: number) => void;
}

export function useAnimationState(
  totalSegments: number,
  queue: number[],
  dispatch: Dispatch<AppAction>,
): AnimationControls {
  const [active, setActive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const [speed, setSpeedState] = useState(400);
  const [queuePos, setQueuePos] = useState(0);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queueRef = useRef(queue);
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Timer tick
  useEffect(() => {
    if (!active || paused || done) {
      clearTimer();
      return;
    }
    if (visibleCount >= totalSegments) {
      // Current rollout done — advance queue or finish
      timerRef.current = setTimeout(() => {
        if (queuePos < queueRef.current.length - 1) {
          const nextPos = queuePos + 1;
          setQueuePos(nextPos);
          setVisibleCount(0);
          dispatch({ type: 'SET_SEL', sel: queueRef.current[nextPos] });
        } else {
          setDone(true);
        }
      }, 500);
      return;
    }
    timerRef.current = setTimeout(() => {
      setVisibleCount((v: number) => v + 1);
    }, speed);
    return clearTimer;
  }, [active, paused, done, visibleCount, totalSegments, speed, queuePos, dispatch, clearTimer]);

  const play = useCallback(() => {
    setDone(false);
    setPaused(false);
    setVisibleCount(0);
    setQueuePos(0);
    setActive(true);
  }, []);

  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);

  const reset = useCallback(() => {
    clearTimer();
    setDone(false);
    setPaused(false);
    setVisibleCount(0);
    setQueuePos(0);
    if (queueRef.current.length > 0) {
      dispatch({ type: 'SET_SEL', sel: queueRef.current[0] });
    }
    setActive(true);
  }, [clearTimer, dispatch]);

  const stop = useCallback(() => {
    clearTimer();
    setActive(false);
    setPaused(false);
    setDone(false);
    setVisibleCount(0);
    setQueuePos(0);
  }, [clearTimer]);

  const skipToNext = useCallback(() => {
    if (queuePos < queueRef.current.length - 1) {
      clearTimer();
      const nextPos = queuePos + 1;
      setQueuePos(nextPos);
      setVisibleCount(0);
      setDone(false);
      dispatch({ type: 'SET_SEL', sel: queueRef.current[nextPos] });
    }
  }, [queuePos, clearTimer, dispatch]);

  const setSpeed = useCallback((ms: number) => setSpeedState(ms), []);

  // Cleanup on unmount
  useEffect(() => clearTimer, [clearTimer]);

  return {
    active,
    paused,
    visibleCount,
    speed,
    queuePos,
    queueLen: queue.length,
    totalSegments,
    done,
    play,
    pause,
    resume,
    reset,
    stop,
    skipToNext,
    setSpeed,
  };
}
