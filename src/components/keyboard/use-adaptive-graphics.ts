"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createAdaptiveQuality, GRAPHICS_LEVELS, INITIAL_GRAPHICS_LEVEL, type GraphicsSettings } from "./adaptive-graphics";

export function useAdaptiveGraphics(ready: boolean) {
  const [level, setLevel] = useState(INITIAL_GRAPHICS_LEVEL);
  const [manual, setManual] = useState<GraphicsSettings | null>(null);
  const [resetVersion, setResetVersion] = useState(0);
  const activeUntil = useRef(0);
  const wake = useRef<(() => void) | null>(null);
  const controller = useRef(createAdaptiveQuality());
  const markActive = useCallback(() => {
    activeUntil.current = performance.now() + 250;
    wake.current?.();
  }, []);

  useEffect(() => {
    if (!ready || manual) return;
    let frame = 0;
    let previous = 0;
    let elapsed = 0;
    let samples: number[] = [];
    let warmUntil = performance.now() + 5000;
    const quality = controller.current;
    const clearWindow = () => { previous = 0; elapsed = 0; samples = []; };
    const schedule = () => {
      if (!frame && !document.hidden) frame = requestAnimationFrame(tick);
    };
    const tick = (now: number) => {
      frame = 0;
      if (document.hidden || now > activeUntil.current) {
        clearWindow();
        quality.resetSamples();
        return;
      }
      if (now < warmUntil) {
        clearWindow();
        quality.resetSamples();
      } else {
        if (previous) {
          const interval = now - previous;
          elapsed += interval;
          samples.push(interval);
        }
        previous = now;
        if (elapsed >= 2000 && samples.length) {
          samples.sort((a, b) => a - b);
          const next = quality.observe({ mean: elapsed / samples.length, p95: samples[Math.ceil(samples.length * 0.95) - 1] });
          clearWindow();
          if (next !== null) {
            setLevel(next);
            warmUntil = now + 3000;
          }
        }
      }
      schedule();
    };
    const visibility = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      clearWindow();
      quality.resetSamples();
      warmUntil = performance.now() + 3000;
      schedule();
    };
    wake.current = schedule;
    schedule();
    document.addEventListener("visibilitychange", visibility);
    return () => {
      cancelAnimationFrame(frame);
      wake.current = null;
      document.removeEventListener("visibilitychange", visibility);
      quality.resetSamples();
    };
  }, [ready, manual, resetVersion]);

  const reset = useCallback(() => {
    controller.current = createAdaptiveQuality();
    setLevel(INITIAL_GRAPHICS_LEVEL);
    setManual(null);
    setResetVersion((version) => version + 1);
  }, []);
  return {
    settings: manual ?? GRAPHICS_LEVELS[level],
    automatic: manual === null,
    level,
    setManual,
    reset,
    markActive,
  };
}
