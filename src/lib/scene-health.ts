"use client";

import { useSyncExternalStore } from "react";

export type SceneStatus = "idle" | "loading" | "ready" | "failed";
let status: SceneStatus = "idle";
const listeners = new Set<() => void>();

export function setSceneStatus(next: SceneStatus) {
  if (status === next) return;
  status = next;
  listeners.forEach((listener) => listener());
}

export function useSceneStatus() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    () => status,
    () => "idle" as SceneStatus,
  );
}
