import { describe, expect, it } from "vitest";
import { createAdaptiveQuality, GRAPHICS_LEVELS, INITIAL_GRAPHICS_LEVEL } from "./adaptive-graphics";

const healthy = { mean: 16.67, p95: 16.8 };
const slow = { mean: 25, p95: 34 };

describe("adaptive keyboard graphics", () => {
  it("starts with every optional effect off at DPR 1", () => {
    expect(GRAPHICS_LEVELS[INITIAL_GRAPHICS_LEVEL]).toEqual({
      dpr: 1, shadows: false, softShadows: false, ao: false, bloom: false, lighting: false,
    });
  });

  it("adds one effect after three consecutive healthy windows", () => {
    const quality = createAdaptiveQuality();
    expect(quality.observe(healthy)).toBeNull();
    expect(quality.observe(healthy)).toBeNull();
    expect(quality.observe(healthy)).toBe(2);
    expect(GRAPHICS_LEVELS[2].lighting).toBe(true);
    expect(GRAPHICS_LEVELS[2].shadows).toBe(false);
    expect(quality.observe(healthy)).toBeNull();
  });

  it("ignores an isolated slowdown but rolls back sustained slow frames without retrying", () => {
    const quality = createAdaptiveQuality();
    for (let i = 0; i < 3; i++) quality.observe(healthy);
    expect(quality.observe(slow)).toBeNull();
    expect(quality.observe(healthy)).toBeNull();
    expect(quality.observe(slow)).toBeNull();
    expect(quality.observe(slow)).toBe(1);
    for (let i = 0; i < 30; i++) expect(quality.observe(healthy)).toBeNull();
  });

  it("backs down immediately below roughly 30 FPS, including the minimum DPR fallback", () => {
    const quality = createAdaptiveQuality();
    expect(quality.observe({ mean: 40, p95: 50 })).toBe(0);
    expect(GRAPHICS_LEVELS[0].dpr).toBe(0.75);
    expect(quality.observe({ mean: 40, p95: 50 })).toBeNull();
  });

  it("does not upgrade on idle/hidden gaps or intermittent healthy windows", () => {
    const quality = createAdaptiveQuality();
    quality.observe(healthy);
    quality.observe(healthy);
    quality.resetSamples();
    expect(quality.observe(healthy)).toBeNull();
    expect(quality.observe({ mean: 19, p95: 25 })).toBeNull();
    expect(quality.observe(healthy)).toBeNull();
    expect(quality.observe(healthy)).toBeNull();
    expect(quality.observe(healthy)).toBe(2);
  });

  it("does not upgrade with bad tail latency and never exceeds its available levels", () => {
    const quality = createAdaptiveQuality();
    for (let i = 0; i < 10; i++) expect(quality.observe({ mean: 17, p95: 30 })).toBeNull();
    const changes = Array.from({ length: 40 }, () => quality.observe(healthy)).filter((value) => value !== null);
    expect(changes).toEqual([2, 3, 4, 5, 6]);
    expect(quality.observe({ mean: NaN, p95: Infinity })).toBeNull();
  });
});
