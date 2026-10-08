export type GraphicsSettings = {
  dpr: number;
  shadows: boolean;
  softShadows: boolean;
  ao: boolean;
  bloom: boolean;
  lighting: boolean;
};

const BASIC: GraphicsSettings = {
  dpr: 1, shadows: false, softShadows: false, ao: false, bloom: false, lighting: false,
};

export const GRAPHICS_LEVELS: readonly GraphicsSettings[] = [
  { ...BASIC, dpr: 0.75 },
  BASIC,
  { ...BASIC, lighting: true },
  { ...BASIC, lighting: true, shadows: true },
  { ...BASIC, lighting: true, shadows: true, softShadows: true },
  { ...BASIC, lighting: true, shadows: true, softShadows: true, ao: true },
  { ...BASIC, lighting: true, shadows: true, softShadows: true, ao: true, bloom: true },
];

export const INITIAL_GRAPHICS_LEVEL = 1;
export type FrameReading = { mean: number; p95: number };

/** Only active-motion windows reach this controller. Failed upgrades stay capped for this visit. */
export function createAdaptiveQuality() {
  let level = INITIAL_GRAPHICS_LEVEL;
  let ceiling = GRAPHICS_LEVELS.length - 1;
  let healthy = 0;
  let slow = 0;
  return {
    resetSamples() { healthy = 0; slow = 0; },
    observe({ mean, p95 }: FrameReading): number | null {
      if (!Number.isFinite(mean) || !Number.isFinite(p95) || mean <= 0 || p95 <= 0) return null;
      const struggling = mean > 22 || p95 > 35;
      const headroom = mean < 17.5 && p95 < 20;
      healthy = headroom ? healthy + 1 : 0;
      slow = struggling ? slow + 1 : 0;
      if (level > 0 && (slow >= 2 || mean > 32)) {
        level--;
        ceiling = level;
      } else if (healthy >= 3 && level < ceiling) {
        level++;
      } else return null;
      healthy = 0;
      slow = 0;
      return level;
    },
  };
}
