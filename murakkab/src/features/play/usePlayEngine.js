import { useEffect, useRef, useCallback } from 'react';

const BASE_MS = 850;

/**
 * Manages the simulation tick loop.
 * Calls onTick(nextM) each interval, respecting speed/paused/slowUntil.
 * Calls onFinish() when the scenario ends.
 */
export function usePlayEngine({ running, paused, m, maxM, speed, slowUntil, newsUntil, onTick, onFinish }) {
  const timerRef = useRef(null);
  const stateRef = useRef({});

  // Keep a live ref to avoid stale closures
  stateRef.current = { paused, m, maxM, speed, slowUntil, newsUntil, onTick, onFinish };

  const scheduleNext = useCallback(() => {
    clearTimeout(timerRef.current);
    const s = stateRef.current;
    if (s.paused) return;

    const slow = s.m < s.slowUntil || s.m < s.newsUntil;
    const ms = slow ? BASE_MS * 2 : BASE_MS / s.speed;

    timerRef.current = setTimeout(() => {
      const st = stateRef.current;
      if (st.paused) return;
      if (st.m >= st.maxM) { st.onFinish(); return; }
      st.onTick(st.m + 1);
    }, ms);
  }, []);

  useEffect(() => {
    if (!running) { clearTimeout(timerRef.current); return; }
    scheduleNext();
    return () => clearTimeout(timerRef.current);
  }, [running, paused, m, speed, scheduleNext]);

  const pause = useCallback(() => { clearTimeout(timerRef.current); }, []);
  const resume = useCallback(() => scheduleNext(), [scheduleNext]);

  return { pause, resume, scheduleNext };
}
