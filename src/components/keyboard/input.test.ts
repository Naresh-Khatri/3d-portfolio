import { describe, expect, it, vi } from "vitest";
import { createKeyInput } from "./input";
import type { KeyboardKey } from "./scene";

const keys: KeyboardKey[] = ["a", "b"].map((name) => ({
  nodeId: name, motionId: `motion-${name}`, materialId: name, pressedStateId: name, labelId: name,
  skill: { name, label: name, shortDescription: "", color: "#ffffff", icon: "" },
}));

describe("keyboard input ownership", () => {
  it("keeps a key pressed until pointer and physical key both release", () => {
    const change = vi.fn();
    const input = createKeyInput(keys);
    input.subscribe(change);
    input.press("hover", "a");
    input.press("key:KeyQ", "a");
    input.press("key:KeyQ", "a");
    input.release("hover");
    expect(change.mock.calls).toEqual([[keys[0], true]]);
    input.release("key:KeyQ");
    expect(change.mock.calls).toEqual([[keys[0], true], [keys[0], false]]);
  });
  it("releases chords independently and clears held inputs on blur", () => {
    const change = vi.fn();
    const input = createKeyInput(keys);
    input.subscribe(change);
    input.press("touch:1", "a");
    input.press("touch:2", "b");
    input.release("touch:1");
    expect(change.mock.calls.at(-1)).toEqual([keys[0], false]);
    input.releaseAll();
    input.releaseAll();
    expect(change.mock.calls).toHaveLength(4);
    expect(change.mock.calls.at(-1)).toEqual([keys[1], false]);
  });
  it("moves hover between keys and ignores unknown targets", () => {
    const change = vi.fn();
    const input = createKeyInput(keys);
    const unsubscribe = input.subscribe(change);
    input.press("hover", "a");
    input.press("hover", "b");
    input.press("hover", "missing");
    expect(change.mock.calls).toEqual([[keys[0], true], [keys[0], false], [keys[1], true]]);
    unsubscribe();
    input.releaseAll();
    expect(change.mock.calls).toHaveLength(3);
  });
  it("supports explicit shortcut codes and rejects duplicates", () => {
    expect(createKeyInput(keys).shortcuts.get("KeyQ")).toBe(keys[0]);
    const custom = { ...keys[0], skill: { ...keys[0].skill, shortcut: "Digit1" } };
    expect(createKeyInput([custom]).shortcuts.get("Digit1")).toBe(custom);
    expect(() => createKeyInput([custom, { ...keys[1], skill: custom.skill }])).toThrow(/Duplicate/);
  });
});

it("ignores an old hover exit after entering a different cap", () => {
  const input = createKeyInput(keys);
  const change = vi.fn();
  input.subscribe(change);
  input.press("hover", "a");
  input.press("hover", "b");
  input.release("hover", "a");
  expect(change.mock.calls.at(-1)).toEqual([keys[1], true]);
  input.release("hover", "b");
  expect(change.mock.calls.at(-1)).toEqual([keys[1], false]);
});
