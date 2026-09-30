"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

export type CursorPosition = { x: number; y: number };

export function createCursorStore() {
  const emptySnapshot: ReadonlyMap<string, CursorPosition> = new Map();
  let snapshot = emptySnapshot;
  const pending = new Map<string, CursorPosition>();
  let activeIds: Set<string> | null = null;
  let frame: number | null = null;
  const listeners = new Set<() => void>();

  const publish = (next: ReadonlyMap<string, CursorPosition>) => {
    snapshot = next;
    listeners.forEach((listener) => listener());
  };

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    getSnapshot: () => snapshot,
    getServerSnapshot: () => emptySnapshot,
    update(socketId: string, position: CursorPosition) {
      if (activeIds && !activeIds.has(socketId)) return;
      if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) return;
      const previous = pending.get(socketId) ?? snapshot.get(socketId);
      if (previous?.x === position.x && previous.y === position.y) return;
      pending.set(socketId, { ...position });
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        const next = new Map(snapshot);
        pending.forEach((position, id) => next.set(id, position));
        pending.clear();
        if (next.size || snapshot.size) publish(next);
      });
    },
    retain(socketIds: Iterable<string>) {
      activeIds = new Set(socketIds);
      for (const id of pending.keys()) {
        if (!activeIds.has(id)) pending.delete(id);
      }
      const next = new Map(snapshot);
      for (const id of next.keys()) {
        if (!activeIds.has(id)) next.delete(id);
      }
      if (next.size !== snapshot.size) publish(next);
    },
    reset() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      pending.clear();
      activeIds = new Set();
      if (snapshot.size) publish(emptySnapshot);
    },
  };
}

export const CursorStoreContext = createContext<ReturnType<typeof createCursorStore> | null>(null);

export function useCursorPositions() {
  const store = useContext(CursorStoreContext);
  if (!store) throw new Error("useCursorPositions requires SocketContextProvider");
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}
