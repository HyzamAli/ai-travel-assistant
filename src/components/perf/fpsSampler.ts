import { useCallback, useEffect, useRef } from 'react';
import {
  runOnJS,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';

const SAMPLE_INTERVAL_MS = 1000;
const BAD_FRAME_THRESHOLD_MS = 22.2;
const JS_BUSY_THRESHOLD_MS = 100;
const SUMMARY_RING_SIZE = 3600;

export function usePerfFpsSampler() {
  const fps = useSharedValue('—');
  const badFrameCount = useSharedValue(0);
  const jsBusy = useSharedValue(0);
  const sessionActive = useSharedValue(false);

  const frameCount = useSharedValue(0);
  const totalMs = useSharedValue(0);
  const windowStart = useSharedValue(0);

  // Ring buffer lives on the JS thread — worklet pushes via runOnJS.
  // A shared-value array would not reliably sync mutations between runtimes.
  const ringBufferRef = useRef<Float64Array>(
    new Float64Array(SUMMARY_RING_SIZE),
  );
  const ringHeadRef = useRef(0);
  const ringCountRef = useRef(0);
  const ringWorstRef = useRef(0);

  const commitSample = useCallback((sample: number) => {
    const head = ringHeadRef.current;
    ringBufferRef.current[head] = sample;
    ringHeadRef.current = (head + 1) % SUMMARY_RING_SIZE;
    if (ringCountRef.current < SUMMARY_RING_SIZE) {
      ringCountRef.current += 1;
    }
    if (sample > ringWorstRef.current) {
      ringWorstRef.current = sample;
    }
  }, []);

  useFrameCallback(({ timestamp, timeSincePreviousFrame }) => {
    if (timeSincePreviousFrame === null) {
      windowStart.value = timestamp;
      return;
    }

    if (timeSincePreviousFrame > BAD_FRAME_THRESHOLD_MS) {
      badFrameCount.value += 1;
    }

    if (sessionActive.value) {
      runOnJS(commitSample)(timeSincePreviousFrame);
    }

    frameCount.value += 1;
    totalMs.value += timeSincePreviousFrame;
    if (windowStart.value === 0) {
      windowStart.value = timestamp;
    }

    if (timestamp - windowStart.value >= SAMPLE_INTERVAL_MS) {
      const calculatedFps = Math.round(
        (frameCount.value * 1000) / Math.max(totalMs.value, 1),
      );
      fps.value = `${calculatedFps} UI`;
      frameCount.value = 0;
      totalMs.value = 0;
      windowStart.value = timestamp;
    }
  }, true);

  useEffect(() => {
    let lastTick: number | null = null;
    let rafId: number;

    const loop = (timestamp: number) => {
      if (lastTick !== null) {
        const next = timestamp - lastTick > JS_BUSY_THRESHOLD_MS ? 1 : 0;
        if (next !== jsBusy.value) {
          jsBusy.value = next;
        }
      }
      lastTick = timestamp;
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [jsBusy]);

  const resetBadFrameCount = () => {
    badFrameCount.value = 0;
  };

  const startSummarySession = () => {
    sessionActive.value = true;
  };

  const stopSummarySession = () => {
    sessionActive.value = false;
  };

  const resetSummarySession = useCallback(() => {
    ringBufferRef.current = new Float64Array(SUMMARY_RING_SIZE);
    ringHeadRef.current = 0;
    ringCountRef.current = 0;
    ringWorstRef.current = 0;
  }, []);

  const getSummaryStats = useCallback(() => {
    const count = ringCountRef.current;
    if (count === 0) {
      return { p50: '—', p95: '—', worst: '—' };
    }
    const snapshot = Array.from(ringBufferRef.current.slice(0, count));
    snapshot.sort((a, b) => a - b);
    const p50 = snapshot[Math.floor((count - 1) * 0.5)];
    const p95 = snapshot[Math.min(count - 1, Math.floor((count - 1) * 0.95))];
    return {
      p50: `${Math.round(p50)}ms`,
      p95: `${Math.round(p95)}ms`,
      worst: `${Math.round(ringWorstRef.current)}ms`,
    };
  }, []);

  return {
    fps,
    badFrameCount,
    jsBusy,
    resetBadFrameCount,
    startSummarySession,
    stopSummarySession,
    resetSummarySession,
    getSummaryStats,
  } as const;
}
