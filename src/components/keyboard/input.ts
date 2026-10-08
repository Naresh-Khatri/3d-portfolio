import type { KeyboardKey } from "./scene";

export const DEFAULT_SHORTCUTS = [
  ..."QWERTYUIOP", ..."ASDFGHJKL", ..."ZXCVBNM",
].map((key) => `Key${key}`);

/** A key stays down until every input holding it has released. */
export function createKeyInput(
  keys: readonly KeyboardKey[],
) {
  const listeners = new Set<(key: KeyboardKey, pressed: boolean) => void>();
  const onChange = (key: KeyboardKey, pressed: boolean) => listeners.forEach((listener) => listener(key, pressed));
  const byId = new Map(keys.map((key) => [key.nodeId, key]));
  const heldBySource = new Map<string, string>();
  const held = new Map<string, Set<string>>();
  const shortcuts = new Map<string, KeyboardKey>();
  keys.forEach((key, index) => {
    const code = key.skill.shortcut ?? DEFAULT_SHORTCUTS[index];
    if (!code) return;
    if (shortcuts.has(code)) throw new Error(`Duplicate keyboard shortcut: ${code}`);
    shortcuts.set(code, key);
  });
  const release = (source: string, nodeId?: string) => {
    const id = heldBySource.get(source);
    if (!id || (nodeId !== undefined && id !== nodeId)) return;
    heldBySource.delete(source);
    const sources = held.get(id);
    sources?.delete(source);
    if (sources?.size === 0) {
      held.delete(id);
      onChange(byId.get(id)!, false);
    }
  };
  return {
    shortcuts,
    subscribe(listener: (key: KeyboardKey, pressed: boolean) => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    press(source: string, id: string) {
      if (!byId.has(id) || heldBySource.get(source) === id) return;
      release(source);
      heldBySource.set(source, id);
      const sources = held.get(id) ?? new Set<string>();
      const first = sources.size === 0;
      sources.add(source);
      held.set(id, sources);
      if (first) onChange(byId.get(id)!, true);
    },
    release,
    releaseAll() {
      for (const source of [...heldBySource.keys()]) release(source);
    },
  };
}

export function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest("input, textarea, select, [contenteditable]:not([contenteditable='false'])"));
}
