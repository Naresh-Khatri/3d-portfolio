// shared with backend src/lib/game/protocol.ts -> keep both copies identical

export const ARENA = 22; // half-extent, world is [-ARENA, ARENA] on x/z
export const TICK_HZ = 20;
export const MAX_PLAYERS = 4;

export const PLAYER_R = 0.5;
export const PLAYER_HP = 100;
export const PLAYER_SPEED = 7;
export const DASH_SPEED = 24;
export const DASH_TIME = 0.16;
export const DASH_CD = 1.4;
export const REVIVE_RANGE = 1.8;
export const REVIVE_TIME = 3;

export const O_TREE = 0;
export const O_CAIRN = 1;
export const O_STONE = 2;
export const O_TRUNK = 3;
export const O_ROCK = 4;
export const O_POST = 5;
export const O_BENCH = 6;

const solids = (kind: number, r: number, spots: number[][]) => spots.map(([x, z]) => [x, z, r, kind] as const);

// [x, z, radius, kind] -> block movement and bullets; laid out around the lanes in frontend engine/arena.ts
export const PILLARS: ReadonlyArray<readonly [number, number, number, number]> = [
  ...solids(O_TREE, 1.2, [[-16, -15], [15, -16], [-15, 13], [16, 12], [-6, -4], [6, 5]]),
  ...solids(O_CAIRN, 1.1, [[0, -19.6], [18.6, -1]]),
  // grave plots, one per quadrant
  ...solids(O_STONE, 0.45, [
    [-12.2, -12], [-9, -12.3], [-6.1, -11.8], [-11.8, -8], [-9.1, -7.7], [-5.9, -8.2],
    [5.2, -12.1], [8, -11.8], [11.1, -12.2], [6, -8], [9.2, -8.3], [12, -7.8],
    [-12, 8.2], [-9.1, 7.8], [-6, 8.1], [-10.2, 12], [-7, 12.3],
    [6.1, 9], [9, 9.3], [12.1, 8.8], [7.2, 13], [10, 12.8],
  ]),
  ...solids(O_TRUNK, 0.55, [[-17.5, 7], [11, 4], [-4, -17.5], [18, 16]]),
  ...solids(O_ROCK, 0.9, [[17.5, -8], [-18.5, -5], [4.5, 18], [-19, 18.5]]),
  ...solids(O_POST, 0.3, [[-2.4, 19.6], [1.3, 19.6], [-2, -18], [2, -18]]),
  ...solids(O_BENCH, 0.8, [[-10.5, -0.9], [9.5, 0.9], [0.8, -12]]),
];

export const WEAPONS = [
  { name: "Pistol", cd: 260, dmg: 20, pellets: 1, spread: 0.03, range: 26, ammo: Infinity },
  { name: "Shotgun", cd: 650, dmg: 15, pellets: 7, spread: 0.36, range: 13, ammo: 24 },
  { name: "SMG", cd: 90, dmg: 12, pellets: 1, spread: 0.1, range: 24, ammo: 140 },
] as const;

export const Z_WALKER = 0;
export const Z_RUNNER = 1;
export const Z_BRUTE = 2;
export const Z_BOOMER = 3;
export const Z_BOSS = 4;

export const ZOMBIES = [
  { name: "Walker", hp: 40, speed: 2.4, dmg: 10, r: 0.5, score: 10, scale: 1, color: 0x6fae4f },
  { name: "Runner", hp: 22, speed: 5.4, dmg: 7, r: 0.4, score: 15, scale: 0.8, color: 0xd9c24a },
  { name: "Brute", hp: 230, speed: 1.8, dmg: 24, r: 0.9, score: 50, scale: 1.8, color: 0x8a4fd1 },
  { name: "Boomer", hp: 30, speed: 3.6, dmg: 0, r: 0.55, score: 20, scale: 1.1, color: 0xf0622e },
  { name: "Boss", hp: 1500, speed: 2.1, dmg: 34, r: 1.5, score: 400, scale: 3, color: 0xd1304a },
] as const;

export const BOOM_RADIUS = 3.2;

export const D_HEALTH = 0;
export const D_SHOTGUN = 1;
export const D_SMG = 2;
export const D_NUKE = 3;
export const DROP_TTL = 14;

export const E_BOOM = 0;
export const E_PICKUP = 1;
export const E_NUKE = 2;
export const E_REVIVE = 3;

export type GamePhase = "lobby" | "playing" | "over";

export type PlayerSnap = {
  id: string;
  name: string;
  color: string;
  x: number;
  z: number;
  a: number;
  hp: number;
  w: number;
  ammo: number; // -1 = infinite
  down: boolean;
  rev: number; // revive progress 0..1
  kills: number;
  inputSeq?: number;
};

export type Snapshot = {
  runId: string | null;
  phase: GamePhase;
  wave: number;
  left: number; // zombies still to kill this wave
  next: number; // seconds until next wave, 0 while one is running
  score: number;
  best: number; // best wave on this server
  p: PlayerSnap[];
  z: number[]; // flat [id, type, x, z, hp01]
  d: number[]; // flat [id, type, x, z]
  s: number[]; // shots this tick, flat [playerIndex, x, z, angle, length]
  e: number[]; // events this tick, flat [kind, x, z, arg]
  hits?: { x: number; z: number; type: number; damage: number }[];
  dropTtl?: Record<number, number>; // remaining seconds, keyed by drop ID
};

export const Z_STRIDE = 5;
export const D_STRIDE = 4;
export const S_STRIDE = 5;
export const E_STRIDE = 4;

// Sequence and run ID are optional for clients predating movement acknowledgements.
export type GameInput = [number, number, number, number, number?, (string | null)?];

export type Circle = { x: number; z: number; r: number };

// clamp to arena + push out of pillars, mutates
export function collide(p: { x: number; z: number }, r: number) {
  const lim = ARENA - r;
  p.x = Math.max(-lim, Math.min(lim, p.x));
  p.z = Math.max(-lim, Math.min(lim, p.z));
  for (const [px, pz, pr] of PILLARS) {
    // boss tramples small props, else it wedges between gravestones
    if (r > 1 && pr < 1) continue;
    const dx = p.x - px;
    const dz = p.z - pz;
    const min = pr + r;
    const d2 = dx * dx + dz * dz;
    if (d2 >= min * min) continue;
    const d = Math.sqrt(d2) || 0.001;
    p.x = px + (dx / d) * min;
    p.z = pz + (dz / d) * min;
  }
}

function rayCircle(ox: number, oz: number, dx: number, dz: number, cx: number, cz: number, r: number) {
  const lx = cx - ox;
  const lz = cz - oz;
  const t = lx * dx + lz * dz;
  if (t < 0) return Infinity;
  const perp2 = lx * lx + lz * lz - t * t;
  if (perp2 > r * r) return Infinity;
  return Math.max(0, t - Math.sqrt(r * r - perp2));
}

// hitscan: first target along the ray, stopped by walls/pillars
export function castRay<T extends Circle>(
  ox: number,
  oz: number,
  angle: number,
  range: number,
  targets: Iterable<T>
): { dist: number; hit: T | null } {
  const dx = Math.cos(angle);
  const dz = Math.sin(angle);
  let dist = range;
  if (dx > 0) dist = Math.min(dist, (ARENA - ox) / dx);
  else if (dx < 0) dist = Math.min(dist, (-ARENA - ox) / dx);
  if (dz > 0) dist = Math.min(dist, (ARENA - oz) / dz);
  else if (dz < 0) dist = Math.min(dist, (-ARENA - oz) / dz);
  for (const [px, pz, pr] of PILLARS) {
    dist = Math.min(dist, rayCircle(ox, oz, dx, dz, px, pz, pr));
  }
  let hit: T | null = null;
  for (const t of targets) {
    // padded radius -> forgiving vs interpolation lag
    const d = rayCircle(ox, oz, dx, dz, t.x, t.z, t.r + 0.2);
    if (d < dist) {
      dist = d;
      hit = t;
    }
  }
  return { dist: Math.max(0, dist), hit };
}

export type LeaderboardPeriod = "all" | "week";
export type LeaderboardPlayer = { name: string; color: string; kills: number; me: boolean };
export type LeaderboardEntry = {
  id: string;
  wave: number;
  score: number;
  duration: number;
  endedAt: string;
  players: LeaderboardPlayer[];
};
export type Leaderboard = {
  entries: LeaderboardEntry[];
  personalBest: LeaderboardEntry | null;
};
export type LeaderboardReply = { data: Leaderboard } | { error: string };
