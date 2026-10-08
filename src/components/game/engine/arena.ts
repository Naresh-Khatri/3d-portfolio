import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ARENA, O_BENCH, O_CAIRN, O_POST, O_ROCK, O_STONE, O_TREE, O_TRUNK, PILLARS } from "../protocol";

// kenney "graveyard kit" (cc0): one shared colormap, wall pieces sit on their -z edge
const BASE = "/assets/game/env/";
const S = 2; // wall + prop scale
const WALL_FACE = 0.3 * S; // inner face offset from piece origin
const APRON = 12; // grass past the walls
const LANE_SPAN = ARENA + 1; // half-extent of the lane texture
// dirt lanes [x, z]; protocol PILLARS are laid out around these
const LANES = [
  { w: 2.3, pts: [[0, 23], [-1.5, 15], [2, 7], [0, 0], [-3, -8], [0, -16], [0, -18.2]] },
  { w: 1.9, pts: [[-18, 2.5], [-12, 1.2], [-6, 2], [0, 0], [7, -2], [13, -0.5], [17, -1]] },
];

const NAMES = [
  "grave",
  "debris",
  "brick-wall",
  "stone-wall",
  "stone-wall-damaged",
  "stone-wall-column",
  "iron-fence",
  "iron-fence-damaged",
  "iron-fence-border-gate",
  "crypt-large",
  "crypt-large-roof",
  "crypt-small",
  "crypt-small-roof",
  "pine",
  "pine-crooked",
  "pine-fall",
  "pine-fall-crooked",
  "rocks",
  "rocks-tall",
  "cross-column",
  "gravestone-cross",
  "gravestone-round",
  "gravestone-bevel",
  "gravestone-wide",
  "gravestone-broken",
  "pumpkin",
  "pumpkin-carved",
  "hay-bale",
  "coffin-old",
  "lightpost-single",
  "debris-wood",
  "gravestone-debris",
  "grave-border",
  "candle",
  "candle-multiple",
  "lantern-candle",
  "lantern-glass",
  "urn-round",
  "bench",
  "bench-damaged",
  "fire-basket",
  "shovel-dirt",
  "trunk",
  "trunk-long",
  "cross",
  "cross-wood",
  "pillar-small",
  "pillar-obelisk",
  "gravestone-decorative",
  "gravestone-roof",
  "pumpkin-tall",
  "hay-bale-bundled",
  "altar-stone",
  "coffin",
  "crypt",
] as const;
type Name = (typeof NAMES)[number];
export type ArenaModels = Map<Name, THREE.Mesh[]>;

const FLAT = new Set<Name>(["grave", "grave-border", "debris"]);
const GREENS: Name[] = ["pine", "pine-crooked"];
const FALLS: Name[] = ["pine-fall", "pine-fall-crooked"];
const PINES: Name[] = [...GREENS, ...GREENS, ...FALLS];
const PUMPKINS: Name[] = ["pumpkin", "pumpkin-carved", "pumpkin-tall"];
const STONES: Name[] = [
  "gravestone-cross",
  "gravestone-round",
  "gravestone-bevel",
  "gravestone-wide",
  "gravestone-broken",
  "gravestone-decorative",
  "gravestone-roof",
];
// [name, scale, y scale]: no collision -> only stuff low enough to walk over
const LITTER: [Name, number, number][] = [
  ["debris", S, 0.5],
  ["debris", 1.4, 0.5],
  ["debris-wood", S, 1],
  ["gravestone-debris", 1.6, 1],
  ["pumpkin", 1.3, 1.3],
  ["pumpkin-tall", 1.3, 1.3],
  ["candle", 1.4, 1.4],
];
// hugging the inside of the walls
const WALLSIDE: Name[] = [...STONES, "cross", "cross-wood", "urn-round", "lantern-candle", "fire-basket", "shovel-dirt", "trunk", "hay-bale", "pumpkin-tall", "bench"];
const WILD: Name[] = [...STONES, ...STONES, ...PINES, "rocks", "rocks-tall", "trunk", "trunk-long", "cross", "cross-wood", "pillar-small", "pillar-obelisk", "crypt", "grave", "pumpkin", "bench-damaged", "hay-bale-bundled"];
const SOUTH: Name[] = [...STONES, ...STONES, "rocks", "trunk", "pumpkin", "pumpkin-tall", "grave", "coffin", "urn-round", "candle-multiple", "hay-bale-bundled"];

async function load(): Promise<ArenaModels> {
  const loader = new GLTFLoader();
  const files = await Promise.all(NAMES.map((n) => loader.loadAsync(`${BASE}${n}.glb`)));
  let mat: THREE.MeshStandardMaterial | null = null;
  const models: ArenaModels = new Map();
  files.forEach((gltf, i) => {
    const meshes: THREE.Mesh[] = [];
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      // every piece samples the same colormap -> one material for the lot
      mat ??= mesh.material as THREE.MeshStandardMaterial;
      mesh.material = mat;
      // green pines ship with orange patches -> shift those uvs onto the green swatch
      if (GREENS.includes(NAMES[i])) {
        const uv = mesh.geometry.attributes.uv;
        for (let v = 0; v < uv.count; v++) {
          if (Math.abs(uv.getX(v) - 0.469) < 0.05) uv.setXY(v, uv.getX(v) + 0.25, uv.getY(v) - 0.25);
        }
      }
      meshes.push(mesh);
    });
    models.set(NAMES[i], meshes);
  });
  return models;
}

let cache: Promise<ArenaModels> | null = null;
export const loadArena = () =>
  (cache ??= load().catch((e) => {
    cache = null;
    throw e;
  }));

const rnd = (a: number, b: number) => {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const pick = <T,>(list: T[], a: number, b: number) => list[Math.floor(rnd(a, b) * list.length)];

const grassTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const c = canvas.getContext("2d")!;
  c.fillStyle = "#2c3f33";
  c.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 500; i++) {
    c.fillStyle = rnd(i, 1) < 0.5 ? "#263830" : "#34493a";
    c.fillRect(Math.floor(rnd(i, 2) * 32) * 4, Math.floor(rnd(i, 3) * 32) * 4, 4, 4);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(ARENA + APRON, ARENA + APRON);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
};

const lanePoints = (pts: number[][], step: number) => {
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)));
  return curve.getSpacedPoints(Math.ceil(curve.getLength() / step));
};

const laneTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const c = canvas.getContext("2d")!;
  const k = 512 / (LANE_SPAN * 2);
  // soft halo first, then the dirt; uneven blobs -> ragged edge
  for (const [grow, alpha, color] of [[1.3, 0.25, "#3b4232"], [1, 1, "#4f4739"]] as const) {
    c.globalAlpha = alpha;
    c.fillStyle = color;
    LANES.forEach(({ w, pts }, l) =>
      lanePoints(pts, 0.3).forEach((p, i) => {
        c.beginPath();
        c.arc((p.x + LANE_SPAN) * k, (p.z + LANE_SPAN) * k, (w / 2) * grow * (0.75 + rnd(i, l + 60) * 0.45) * k, 0, Math.PI * 2);
        c.fill();
      })
    );
  }
  c.globalAlpha = 1;
  c.globalCompositeOperation = "source-atop";
  for (let i = 0; i < 2500; i++) {
    c.fillStyle = rnd(i, 61) < 0.5 ? "#5b5142" : "#433b30";
    c.fillRect(rnd(i, 62) * 512, rnd(i, 63) * 512, 3, 3);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
};

// solids come from protocol PILLARS (shared with the server); everything else here is walk-through
export function buildArena(models: ArenaModels) {
  const spots = new Map<Name, THREE.Matrix4[]>();
  const dummy = new THREE.Object3D();
  const put = (name: Name, x: number, z: number, rot = 0, sx = S, y = 0, sy = sx) => {
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, rot, 0);
    dummy.scale.set(sx, sy, sx);
    dummy.updateMatrix();
    const list = spots.get(name) ?? [];
    list.push(dummy.matrix.clone());
    spots.set(name, list);
  };

  const edge = ARENA + WALL_FACE;
  for (let k = 0; k < ARENA; k++) {
    const t = -ARENA + (k + 0.5) * S;
    put("brick-wall", t, -edge + WALL_FACE * 2, 0);
    const side: Name = k % 4 === 0 ? "stone-wall-column" : rnd(k, 5) < 0.2 ? "stone-wall-damaged" : "stone-wall";
    put(side, -edge + WALL_FACE * 2, t, Math.PI / 2);
    put(side, edge - WALL_FACE * 2, -t, -Math.PI / 2);
    // camera sits south -> see-through fence there or it hides the player
    const mid = k === ARENA / 2 - 1 || k === ARENA / 2;
    put(mid ? "iron-fence-border-gate" : rnd(k, 6) < 0.15 ? "iron-fence-damaged" : "iron-fence", t, edge - WALL_FACE * 2, Math.PI);
  }

  // [x, z, r] of everything standing, so scatter never overlaps
  const taken: number[][] = PILLARS.map(([x, z, r]) => [x, z, r + 0.5]);
  const free = (x: number, z: number, r: number) => taken.every(([tx, tz, tr]) => Math.hypot(tx - x, tz - z) > tr + r);
  const prop = (name: Name, x: number, z: number, rot = 0, sx = S, r = 1) => {
    put(name, x, z, rot, sx, 0, FLAT.has(name) ? 0.45 : sx);
    taken.push([x, z, r]);
  };

  const north = -ARENA - 6;
  for (const [x, kind] of [
    [-12, "crypt-large"],
    [0, "crypt-small"],
    [12, "crypt-large"],
  ] as const) {
    prop(kind, x, north, 0, 3, 4.5);
    put(`${kind}-roof`, x, north, 0, 3, 3);
  }
  [-20, -6, 6, 20].forEach((x, i) => prop(pick(PINES, i, 8), x, north + 2, i * 1.7, 2.6, 2.6));
  for (let k = 0; k < 6; k++) {
    const z = -18 + k * 7.5 + rnd(k, 9) * 2;
    prop(pick(PINES, k, 10), -ARENA - 3.5 - rnd(k, 11) * 2, z, k, 2.2 + rnd(k, 12) * 0.6, 2.8);
    prop(pick(PINES, k, 13), ARENA + 3.5 + rnd(k, 14) * 2, z + 2, k * 2, 2.2 + rnd(k, 15) * 0.6, 2.8);
  }

  const south = ARENA + 3;
  prop("lightpost-single", -3.4, south - 1.8, Math.PI, 2.2, 0.6);
  prop("lightpost-single", 3.4, south - 1.8, Math.PI, 2.2, 0.6);
  prop("pumpkin-carved", 2.8, south - 1.2, 0.3, S, 0.5);
  prop("pumpkin", -2.8, south - 1.2, 2, S, 0.5);
  prop("altar-stone", -9, south - 1.4, Math.PI, S, 1.2);
  prop("coffin-old", -7.5, south + 1.2, 0.4);
  prop("hay-bale", 9, south + 1, 0.3, S, 0.7);
  prop("hay-bale", 10.3, south + 1.3, 1.2, S, 0.7);
  prop("pumpkin-carved", 8.2, south + 2.2, -0.4, S, 0.5);

  const lanes = LANES.map(({ pts }) => lanePoints(pts, 0.5));
  const laneDist = (x: number, z: number) => Math.min(...lanes.flat().map((p) => Math.hypot(p.x - x, p.z - z)));

  PILLARS.forEach(([x, z, r, kind], i) => {
    const turn = rnd(i, 40) * Math.PI * 2;
    if (kind === O_TREE) put(pick(rnd(i, 41) < 0.7 ? GREENS : FALLS, i, 42), x, z, turn, (r * 2) / 1.2);
    else if (kind === O_CAIRN) {
      put("rocks-tall", x, z, turn, (r * 2) / 1.03);
      put("cross-column", x, z, x ? -Math.PI / 2 : 0, 2.2, 0.6);
    } else if (kind === O_TRUNK) put(rnd(i, 43) < 0.5 ? "trunk" : "trunk-long", x, z, turn);
    else if (kind === O_ROCK) put("rocks", x, z, turn, 1.7);
    else if (kind === O_POST) put("pillar-small", x, z);
    else if (kind === O_BENCH) {
      const to = lanes.flat().reduce((a, b) => (Math.hypot(a.x - x, a.z - z) < Math.hypot(b.x - x, b.z - z) ? a : b));
      put("bench-damaged", x, z, Math.atan2(to.x - x, to.z - z));
    } else if (kind === O_STONE) {
      const tilt = (rnd(i, 44) - 0.5) * 0.4;
      put(pick(STONES, i, 45), x, z, tilt);
      // plot in front of the headstone: dug, bordered or bare
      const plot = rnd(i, 46);
      if (plot < 0.6) prop("grave", x, z + 1.6, tilt, S, 1.3);
      else if (plot < 0.8) prop("grave-border", x, z + 1.6, tilt, S, 1.3);
      if (plot < 0.25) prop("shovel-dirt", x + 1.2, z + 1.3, turn, S, 0.6);
      else if (plot > 0.7) prop("candle-multiple", x + 0.7, z + 0.5, turn, 1.4, 0.4);
    }
  });

  // lanterns down alternating sides of each lane
  lanes.forEach((pts, l) => {
    for (let i = 5, n = 0; i < pts.length - 1; i += 11, n++) {
      const p = pts[i];
      const side = ((n + l) % 2 ? 1 : -1) * (LANES[l].w / 2 + 0.6);
      const dir = pts[i + 1].clone().sub(p).normalize();
      const x = p.x - dir.z * side;
      const z = p.z + dir.x * side;
      if (Math.hypot(x, z) < 3.5 || !free(x, z, 0.5)) continue;
      prop(n % 3 ? "lantern-candle" : "lantern-glass", x, z, rnd(i, 47) * 6, 2.4, 0.5);
      const px = x - dir.z * Math.sign(side) * 0.8 + dir.x * 0.5;
      const pz = z + dir.x * Math.sign(side) * 0.8 + dir.z * 0.5;
      if (rnd(i, l + 48) < 0.6 && free(px, pz, 0.4)) prop(pick(PUMPKINS, i, l + 49), px, pz, rnd(i, 50) * 6, 1.5, 0.4);
    }
  });
  put("candle-multiple", -1.3, -18.9, 0, 1.6);
  put("candle-multiple", 1.2, -19, 2, 1.6);

  // loose bits off the lanes
  for (let k = 0; k < 45; k++) {
    const x = (rnd(k, 20) - 0.5) * (ARENA * 2 - 3);
    const z = (rnd(k, 21) - 0.5) * (ARENA * 2 - 3);
    if (laneDist(x, z) < 2 || !free(x, z, 0.9)) continue;
    const [name, sx, sy] = pick(LITTER, k, 22);
    put(name, x, z, rnd(k, 23) * Math.PI * 2, sx, 0, sy);
    taken.push([x, z, 0.9]);
  }
  // props tucked against the north, west and east walls, facing in
  const hug = ARENA - 0.75;
  for (let k = 0; k < 42; k++) {
    const t = (rnd(k, 24) - 0.5) * (ARENA * 2 - 4);
    const wall = k % 3;
    const x = wall === 0 ? t : wall === 1 ? -hug : hug;
    const z = wall === 0 ? -hug : t;
    if (!free(x, z, 0.8)) continue;
    const rot = wall === 0 ? 0 : wall === 1 ? Math.PI / 2 : -Math.PI / 2;
    prop(pick(WALLSIDE, k, 25), x, z, rot + (rnd(k, 26) - 0.5) * 0.3, S, 0.8);
  }
  // overgrown cemetery outside; south stays low for the camera
  const reach = ARENA + APRON - 2;
  for (let k = 0; k < 220; k++) {
    const x = (rnd(k, 27) - 0.5) * reach * 2;
    const z = (rnd(k, 28) - 0.5) * reach * 2;
    if (Math.abs(x) < ARENA + 1.5 && Math.abs(z) < ARENA + 1.5) continue;
    const low = z > ARENA - 4;
    const name = pick(low ? SOUTH : WILD, k, 29);
    const tree = PINES.includes(name);
    const scale = tree ? 2 + rnd(k, 31) : S;
    // wide berth for trees: canopies must not touch, even in perspective
    const r = tree ? scale * 1.2 : 1;
    if (!free(x, z, r)) continue;
    prop(name, x, z, tree ? rnd(k, 30) * 6 : (rnd(k, 30) - 0.5) * 0.5, scale, r);
  }

  const group = new THREE.Group();
  const size = (ARENA + APRON) * 2;
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ map: grassTexture(), roughness: 1 })
  );
  ground.receiveShadow = true;
  group.add(ground);
  const lane = new THREE.Mesh(
    new THREE.PlaneGeometry(LANE_SPAN * 2, LANE_SPAN * 2).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ map: laneTexture(), roughness: 1, transparent: true, depthWrite: false })
  );
  lane.position.y = 0.012;
  lane.receiveShadow = true;
  group.add(lane);
  for (const [name, list] of spots) {
    for (const part of models.get(name) ?? []) {
      const mesh = new THREE.InstancedMesh(part.geometry, part.material, list.length);
      list.forEach((m, i) => mesh.setMatrixAt(i, dummy.matrix.multiplyMatrices(m, part.matrixWorld)));
      mesh.receiveShadow = true;
      mesh.castShadow = !FLAT.has(name);
      mesh.frustumCulled = false;
      group.add(mesh);
    }
  }
  return group;
}
