"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { Application } from "@splinetool/runtime";
import { loadSplineScene } from "@/lib/load-spline-scene";

type SafeSplineProps = {
  scene: string;
  className?: string;
  style?: CSSProperties;
  onLoad?: (app: Application) => void;
  onError?: (error: unknown) => void;
  fallback?: ReactNode;
};

const SafeSpline = forwardRef<HTMLDivElement, SafeSplineProps>(function SafeSpline(
  { scene, className, style, onLoad, onError, fallback = null },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const callbacks = useRef({ onLoad, onError });
  const [result, setResult] = useState<{ scene: string; failed: boolean }>();

  useEffect(() => {
    callbacks.current = { onLoad, onError };
  }, [onLoad, onError]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const controller = new AbortController();
    let app: Application | undefined;
    canvas.style.visibility = "hidden";

    async function load() {
      const { Application } = await import("@splinetool/runtime");
      controller.signal.throwIfAborted();
      await loadSplineScene(scene, controller.signal, async (data) => {
        app = new Application(canvas!, { renderOnDemand: true });
        try {
          await app.start(data);
          controller.signal.throwIfAborted();
        } catch (error) {
          app.dispose();
          app = undefined;
          throw error;
        }
      });
      if (controller.signal.aborted || !app) return;
      canvas!.style.visibility = "visible";
      setResult({ scene, failed: false });
      callbacks.current.onLoad?.(app);
    }

    void load().catch((error: unknown) => {
      app?.dispose();
      app = undefined;
      if (controller.signal.aborted) return;
      console.warn(`Unable to load Spline scene ${scene}`, error);
      setResult({ scene, failed: true });
      callbacks.current.onError?.(error);
    });

    return () => {
      controller.abort();
      app?.dispose();
    };
  }, [scene]);

  return (
    <div ref={ref} className={className} style={{ width: "100%", height: "100%", overflow: "hidden", ...style }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
      {result?.scene === scene && result.failed ? fallback : null}
    </div>
  );
});

export default SafeSpline;
