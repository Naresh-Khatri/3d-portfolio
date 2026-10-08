import { afterEach, beforeEach, expect, it, vi } from "vitest";
import gsap from "gsap";
import { Euler, Vector3 } from "three";
import type { ChibiSceneApi } from "@chibi3d/runtime";
import { createKeyboardMotion } from "./motion";
import { createKeyboardScene } from "./scene";

const triggers = vi.hoisted(() => [] as { onEnter: () => void; onLeaveBack: () => void }[]);
vi.mock("gsap/ScrollTrigger", () => ({ ScrollTrigger: {
  create: (options: { onEnter: () => void; onLeaveBack: () => void }) => {
    triggers.push(options);
    return { kill: vi.fn() };
  },
} }));

beforeEach(() => {
  triggers.length = 0;
  vi.stubGlobal("window", Object.assign(new EventTarget(), { innerWidth: 1280, innerHeight: 800 }));
  vi.stubGlobal("document", Object.assign(new EventTarget(), {
    hidden: false,
    getElementById: () => ({ getBoundingClientRect: () => ({ top: 10000 }) }),
  }));
  vi.spyOn(Math, "random").mockReturnValue(0.5);
});

afterEach(() => {
  gsap.globalTimeline.clear();
  gsap.ticker.sleep();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it.each([false, true])("reveals all 24 keys in order without the settle tween grouping them (resize: %s)", (resize) => {
  const scene = createKeyboardScene(Array.from({ length: 24 }, (_, i) => ({
    name: `key-${i}`, label: `Key ${i}`, shortDescription: "", color: "#ffffff", icon: "",
  })));
  const visibility = new Map<string, boolean>();
  const positions = new Map<string, number>();
  const api = {
    setNodeVisible: (id: string, visible: boolean) => { visibility.set(id, visible); },
    setNodeTransform: (id: string, patch: { position?: number[] }) => {
      if (patch.position) positions.set(id, patch.position[1]);
    },
    setPaused: vi.fn(), clearNodeOverrides: vi.fn(),
  };
  const motion = createKeyboardMotion(api as unknown as ChibiSceneApi, scene, vi.fn());
  try {
    motion.reveal();
    gsap.ticker.sleep();
    const origin = gsap.globalTimeline.time();
    const advance = (time: number) => { gsap.globalTimeline.time(origin + time, false); gsap.ticker.sleep(); };
    advance(0.85);
    expect(scene.keys.every((key) => visibility.get(key.motionId) === false)).toBe(true);
    for (let i = 0; i < scene.keys.length; i++) {
      advance(0.9 + i * 0.07 + 0.001);
      expect(scene.keys.filter((key) => visibility.get(key.motionId))).toEqual(scene.keys.slice(0, i + 1));
      expect(positions.get(scene.keys[i].motionId)).toBeCloseTo(150 / 296.741333);
      if (resize && i === 5) window.dispatchEvent(new Event("resize"));
    }
    advance(3.2);
    for (const key of scene.keys) expect(positions.get(key.motionId)).toBeCloseTo(0);
  } finally {
    motion.dispose();
  }
});

it("uses real GSAP to return each contact cap to rest on every yoyo and after exit", () => {
  const scene = createKeyboardScene([{ name: "js", label: "JavaScript", shortDescription: "JS", color: "#ffffff", icon: "" }]);
  const api = { setNodeVisible: vi.fn(), setNodeTransform: vi.fn(), setPaused: vi.fn(), clearNodeOverrides: vi.fn() };
  const motion = createKeyboardMotion(api as unknown as ChibiSceneApi, scene, vi.fn());
  try {
    motion.reveal();
    gsap.ticker.sleep();
    // Complete the initial key drop before entering Contact.
    for (const tween of gsap.globalTimeline.getChildren()) {
      if (tween.vars.ease === "bounce.out") tween.totalTime(tween.duration(), false);
    }
    triggers[2].onEnter();
    const start = gsap.globalTimeline.getChildren().find((tween) => Math.abs(tween.delay() - 0.8) < 1e-6)!;
    start.totalTime(0, false);
    gsap.ticker.sleep();
    const turn = gsap.globalTimeline.getChildren().find((tween) => tween.vars.duration === 5)!;
    for (const time of [0, 1.25, 2.5, 5, 7.5, 10]) {
      turn.totalTime(time, false);
      const rotation = api.setNodeTransform.mock.calls.filter(([id, patch]) => id === scene.boardId && patch.rotation).at(-1)![1].rotation;
      const top = new Vector3(0, 1, 0).applyEuler(new Euler(...rotation));
      const toCamera = new Vector3(...scene.document.camera.position).sub(new Vector3(...scene.document.camera.target)).normalize();
      expect(top.dot(toCamera)).toBeGreaterThan(0);
    }
    const float = gsap.globalTimeline.getChildren().find((tween) => tween.vars.yoyoEase === "none")!;
    expect(float).toBeDefined();
    const lastY = () => api.setNodeTransform.mock.calls.filter(([id]) => id === scene.keys[0].motionId).at(-1)![1].position[1];
    const height = 300 / 296.741333;
    float.totalTime(3, false);
    expect(lastY()).toBeCloseTo(height);
    float.totalTime(4.5, false);
    expect(lastY()).toBeCloseTo(height / 2);
    float.totalTime(6, false);
    expect(lastY()).toBeCloseTo(0);
    float.totalTime(9, false);
    expect(lastY()).toBeCloseTo(height);
    float.totalTime(12, false);
    expect(lastY()).toBeCloseTo(0);

    float.totalTime(15, false);
    triggers[2].onLeaveBack();
    const stop = gsap.globalTimeline.getChildren().findLast((tween) => Math.abs(tween.delay() - 0.9) < 1e-6)!;
    stop.totalTime(0, false);
    gsap.ticker.sleep();
    const settle = gsap.globalTimeline.getChildren().find((tween) => tween.vars.duration === 4)!;
    settle.totalTime(4, false);
    expect(lastY()).toBeCloseTo(0);
    expect(gsap.globalTimeline.getChildren()).not.toContain(float);
  } finally {
    motion.dispose();
  }
});
