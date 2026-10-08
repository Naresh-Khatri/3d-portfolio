"use client";

import { useCallback, useEffect, useRef } from "react";

export function useKeyboardSounds() {
  const audio = useRef<{ context: AudioContext; buffers: Partial<Record<"press" | "release", AudioBuffer>> } | null>(null);
  useEffect(() => {
    if (!window.AudioContext) return;
    const context = new AudioContext();
    const state = { context, buffers: {} as Partial<Record<"press" | "release", AudioBuffer>> };
    audio.current = state;
    const controller = new AbortController();
    const unlock = () => {
      if (context.state === "suspended") void context.resume().catch(() => {});
    };
    window.addEventListener("pointerdown", unlock, true);
    window.addEventListener("keydown", unlock, true);
    void Promise.all((["press", "release"] as const).map(async (name) => {
      const response = await fetch(`/assets/keycap-sounds/${name}.mp3`, { signal: controller.signal });
      if (!response.ok) throw new Error(`Keyboard sound: HTTP ${response.status}`);
      const buffer = await context.decodeAudioData(await response.arrayBuffer());
      if (!controller.signal.aborted) state.buffers[name] = buffer;
    })).catch((error: unknown) => {
      if (!controller.signal.aborted) console.warn("Keyboard sounds unavailable", error);
    });
    return () => {
      controller.abort();
      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("keydown", unlock, true);
      audio.current = null;
      void context.close().catch(() => {});
    };
  }, []);
  return useCallback((pressed: boolean) => {
    const state = audio.current;
    if (!state || state.context.state !== "running") return;
    const buffer = state.buffers[pressed ? "press" : "release"];
    if (!buffer) return;
    const source = state.context.createBufferSource();
    const gain = state.context.createGain();
    source.buffer = buffer;
    gain.gain.value = 0.4;
    source.connect(gain).connect(state.context.destination);
    source.onended = () => { source.disconnect(); gain.disconnect(); };
    source.start();
  }, []);
}
