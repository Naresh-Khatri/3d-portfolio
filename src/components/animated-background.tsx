"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { usePreloader } from "./preloader";
import { usePerfProfile } from "@/hooks/use-perf-profile";
import { setSceneStatus, useSceneStatus } from "@/lib/scene-health";

const KeyboardScene = dynamic(() => import("./keyboard/keyboard-scene"), { ssr: false });

class SceneErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    setSceneStatus("failed");
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function SceneSession({ maxDpr }: { maxDpr: number }) {
  const status = useSceneStatus();
  const { bypassLoading } = usePreloader();

  useEffect(() => {
    let context: WebGLRenderingContext | WebGL2RenderingContext | null = null;
    try {
      const canvas = document.createElement("canvas");
      context = canvas.getContext("webgl2") || canvas.getContext("webgl");
    } catch {
      // Browser policy or driver failures can throw instead of returning null.
    }
    if (!context) {
      setSceneStatus("failed");
      return () => setSceneStatus("idle");
    }
    context.getExtension("WEBGL_lose_context")?.loseContext();
    setSceneStatus("loading");
    return () => setSceneStatus("idle");
  }, []);

  useEffect(() => {
    if (status === "failed") bypassLoading();
  }, [status, bypassLoading]);

  // A ready scene must not be failed by its loading deadline.
  useEffect(() => {
    if (status !== "loading") return;
    const timeout = window.setTimeout(() => setSceneStatus("failed"), 20_000);
    return () => window.clearTimeout(timeout);
  }, [status]);

  if (status === "idle" || status === "failed") return null;
  return (
    <SceneErrorBoundary>
      <KeyboardScene maxDpr={maxDpr} />
    </SceneErrorBoundary>
  );
}

const AnimatedBackground = () => {
  const { disable3D, maxDpr, ready } = usePerfProfile();
  if (!ready || disable3D) return null;
  return <SceneSession maxDpr={maxDpr} />;
};

export default AnimatedBackground;
