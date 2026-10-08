import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ChibiSceneApi } from "@chibi3d/runtime";
import { Euler, Quaternion, Vector3 } from "three";
import { createKeyboardScene } from "./scene";
import { createKeyboardMotion } from "./motion";

const mocks = vi.hoisted(() => ({
  tweens: [] as { target: Record<string, number>; vars: Record<string, unknown>; kill: ReturnType<typeof vi.fn> }[],
  pending: [] as { delay: number; callback: () => void; kill: ReturnType<typeof vi.fn> }[],
  triggers: [] as { onEnter: () => void; onLeaveBack: () => void; kill: ReturnType<typeof vi.fn> }[],
}));
vi.mock("gsap", () => ({ default: {
  registerPlugin: vi.fn(),
  delayedCall: (delay: number, callback: () => void) => {
    const call = { delay, callback, kill: vi.fn(), paused: vi.fn() };
    mocks.pending.push(call);
    return call;
  },
  fromTo: (target: Record<string, number>, from: Record<string, number>, vars: Record<string, unknown>) => {
    Object.assign(target, from);
    const tween = { target, vars, kill: vi.fn(), paused: vi.fn() };
    mocks.tweens.push(tween);
    return tween;
  },
  to: (target: Record<string, number>, vars: Record<string, unknown>) => {
    const tween = { target, vars, kill: vi.fn(), paused: vi.fn() };
    mocks.tweens.push(tween);
    return tween;
  },
} }));
vi.mock("gsap/ScrollTrigger", () => ({ ScrollTrigger: {
  create: (options: { onEnter: () => void; onLeaveBack: () => void }) => {
    const trigger = { ...options, kill: vi.fn() };
    mocks.triggers.push(trigger);
    return trigger;
  },
} }));

beforeEach(() => {
  mocks.tweens.length = 0;
  mocks.triggers.length = 0;
  mocks.pending.length = 0;
  vi.stubGlobal("window", Object.assign(new EventTarget(), { innerWidth: 1280, innerHeight: 800 }));
  vi.stubGlobal("document", Object.assign(new EventTarget(), {
    hidden: false,
    getElementById: () => ({ getBoundingClientRect: () => ({ top: 10000 }) }),
  }));
});
afterEach(() => vi.unstubAllGlobals());

function setup() {
  const scene = createKeyboardScene([{ name: "js", label: "JavaScript", shortDescription: "JS", color: "#ffffff", icon: "" }]);
  const api = { setNodeVisible: vi.fn(), setNodeTransform: vi.fn(), setPaused: vi.fn(), clearNodeOverrides: vi.fn() };
  const motion = createKeyboardMotion(api as unknown as ChibiSceneApi, scene, vi.fn());
  motion.reveal();
  mocks.tweens.filter((tween) => tween.vars.ease === "bounce.out").forEach(finish);
  return { scene, api, motion };
}

function finish(tween: typeof mocks.tweens[number]) {
  for (const key of Object.keys(tween.target)) {
    if (typeof tween.vars[key] === "number") tween.target[key] = tween.vars[key];
  }
  (tween.vars.onUpdate as (() => void) | undefined)?.();
}

describe("keyboard section motion", () => {
  it.each([390, 1280, 1832])("places the keyboard center at the camera target at %i px", (width) => {
    window.innerWidth = width;
    const { scene, api, motion } = setup();
    const before = mocks.tweens.length;
    mocks.triggers[0].onEnter();
    mocks.tweens.slice(before).forEach(finish);
    expect(api.setNodeTransform).toHaveBeenCalledWith(scene.boardId, expect.objectContaining({ position: scene.document.camera.target }));
    motion.dispose();
  });

  it("restores contact teardown and randomized key yoyo, then settles on exit", () => {
    const { scene, api, motion } = setup();
    mocks.triggers[2].onEnter();
    const start = mocks.pending.at(-1)!;
    expect(start.delay).toBeCloseTo(0.8);
    start.callback();
    const teardown = mocks.tweens.findLast((tween) => tween.vars.duration === 5)!;
    expect(teardown.target).toEqual({ x: 0, y: 0, z: 0 });
    expect(teardown.vars).toMatchObject({ y: -Math.PI / 2, repeat: -1, yoyo: true, yoyoEase: true });
    const rise = mocks.tweens.findLast((tween) => tween.vars.yoyoEase === "none")!;
    expect(rise.vars.y).toBeGreaterThanOrEqual(200 / 296.741333);
    expect(rise.vars.y).toBeLessThanOrEqual(400 / 296.741333);
    expect(rise.vars.duration).toBeGreaterThanOrEqual(2);
    expect(rise.vars.duration).toBeLessThanOrEqual(4);
    expect(rise.vars).toMatchObject({ repeat: -1, yoyo: true, ease: "elastic.out(1,0.3)" });
    finish(rise);
    mocks.triggers[2].onLeaveBack();
    expect(teardown.kill).toHaveBeenCalled();
    expect(rise.kill).not.toHaveBeenCalled();
    const stop = mocks.pending.at(-1)!;
    expect(stop.delay).toBeCloseTo(0.9);
    stop.callback();
    expect(rise.kill).toHaveBeenCalled();
    const settle = mocks.tweens.at(-1)!;
    expect(settle.vars).toMatchObject({ y: 0, duration: 4, ease: "elastic.out(1,0.7)" });
    finish(settle);
    expect(api.setNodeTransform).toHaveBeenLastCalledWith(scene.keys[0].motionId, { position: [0, 0, 0] });
    motion.dispose();
    expect(mocks.tweens.every((tween) => tween.kill.mock.calls.length > 0)).toBe(true);
    expect(mocks.pending.every((call) => call.kill.mock.calls.length > 0)).toBe(true);
  });

  it("cancels delayed contact starts during fast section changes", () => {
    const { motion } = setup();
    mocks.triggers[2].onEnter();
    const start = mocks.pending.at(-1)!;
    mocks.triggers[2].onLeaveBack();
    expect(start.kill).toHaveBeenCalled();
    const count = mocks.tweens.length;
    start.callback();
    expect(mocks.tweens).toHaveLength(count);
    motion.dispose();
  });

  it("preserves the original three-axis flip at the transition midpoint", () => {
    const { scene, api, motion } = setup();
    mocks.triggers[0].onEnter();
    mocks.tweens.slice(-4).forEach(finish);
    mocks.triggers[1].onEnter();
    const turn = mocks.tweens.findLast((tween) => tween.vars.z === Math.PI)!;
    expect(turn.vars).toMatchObject({ x: Math.PI, y: Math.PI / 3, z: Math.PI, duration: 1 });
    Object.assign(turn.target, { x: Math.PI / 2, y: (Math.PI / 12 + Math.PI / 3) / 2, z: Math.PI / 2 });
    (turn.vars.onUpdate as () => void)();
    const patch = api.setNodeTransform.mock.calls.filter(([id]) => id === scene.boardId).at(-1)![1];
    const expected = new Quaternion().setFromEuler(new Euler(0.119863065, 0.007200782, 0.119863065))
      .multiply(new Quaternion().setFromEuler(new Euler(0, -Math.PI / 12, 0)))
      .multiply(new Quaternion().setFromEuler(new Euler(turn.target.x, turn.target.y, turn.target.z)));
    expect(new Quaternion().setFromEuler(new Euler(...patch.rotation)).angleTo(expected)).toBeCloseTo(0);
    motion.dispose();
  });

  it("continues a section transition from the live hero spin without resetting it", () => {
    const { scene, api, motion } = setup();
    const spin = mocks.tweens.find((tween) => tween.vars.duration === 10)!;
    spin.target.y = 2.3;
    (spin.vars.onUpdate as () => void)();
    api.setNodeTransform.mockClear();
    mocks.triggers[0].onEnter();
    expect(spin.kill).toHaveBeenCalled();
    const transition = mocks.tweens.findLast((tween) => tween.vars.y === Math.PI / 12)!;
    expect(transition.target.y).toBe(2.3);
    expect(api.setNodeTransform.mock.calls.some(([id]) => id === scene.spinId)).toBe(false);
    motion.dispose();
  });

  it("moves hero horizontally in the camera plane and preserves the original Projects yaw", () => {
    const { scene, api, motion } = setup();
    mocks.tweens.forEach(finish);
    const hero = api.setNodeTransform.mock.calls.filter(([id, patch]) => id === scene.boardId && patch.position).at(-1)![1];
    const displacement = new Vector3(...hero.position).sub(new Vector3(...scene.document.camera.target));
    expect(displacement.dot(new Vector3(1, 2, -1).normalize())).toBeCloseTo(0);
    expect(displacement.dot(new Vector3(1, 0, 1).normalize())).toBeCloseTo(2.5);
    const before = mocks.tweens.length;
    mocks.triggers[1].onEnter();
    mocks.tweens.slice(before).forEach(finish);
    const projects = api.setNodeTransform.mock.calls.filter(([id, patch]) => id === scene.boardId && patch.rotation).at(-1)![1];
    const tilt = new Quaternion().setFromEuler(new Euler(0.119863065, 0.007200782, 0.119863065));
    const relative = tilt.invert().multiply(new Quaternion().setFromEuler(new Euler(...projects.rotation)));
    expect(relative.angleTo(new Quaternion().setFromEuler(new Euler(0, 105 * Math.PI / 180, 0)))).toBeCloseTo(0);
    motion.dispose();
  });

  it("alternates the two cat images and hides them outside projects", () => {
    const { scene, api, motion } = setup();
    mocks.triggers[1].onEnter();
    const catStart = mocks.pending.at(-2)!;
    expect(catStart.delay).toBe(0.3);
    catStart.callback();
    const animation = mocks.tweens.findLast((tween) => tween.vars.value === 2)!;
    api.setNodeVisible.mockClear();
    for (const value of [0.1, 0.5, 0.9]) {
      animation.target.value = value;
      (animation.vars.onUpdate as () => void)();
    }
    expect(api.setNodeVisible).not.toHaveBeenCalled();
    animation.target.value = 1;
    (animation.vars.onUpdate as () => void)();
    expect(api.setNodeVisible).toHaveBeenCalledWith(scene.frameIds[0], false);
    expect(api.setNodeVisible).toHaveBeenCalledWith(scene.frameIds[1], true);
    expect(api.setNodeVisible).toHaveBeenCalledTimes(2);
    mocks.triggers[1].onLeaveBack();
    mocks.pending.at(-2)!.callback();
    expect(api.setNodeVisible).toHaveBeenCalledWith(scene.catId, false);
    expect(api.setNodeVisible).toHaveBeenCalledWith(scene.labelsId, true);
    expect(animation.kill).toHaveBeenCalled();
    motion.dispose();
  });
});
