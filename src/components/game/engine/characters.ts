import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { PlayerProfile } from "../player-profile";

// kenney "blocky characters" (cc0): 6 rigid parts, rotation-only clips, faces +z
const BASE = "/assets/game/characters/";
const SCALE = 0.85; // native rig is ~2.7 tall
export const GUN_HEIGHT = 1.8 * SCALE;
export const MUZZLE = 1.75 * SCALE;
const FRAMES = 24;
const PLAYER_SKINS = ["j", "r", "p", "q"];
// indexed by zombie type
const ZOMBIE_LOOKS = [
  { skin: "l", clip: "walk", rate: 1, tint: 0xffffff },
  { skin: "n", clip: "sprint", rate: 1.1, tint: 0xffffff },
  { skin: "o", clip: "walk", rate: 0.7, tint: 0xffffff },
  { skin: "d", clip: "walk", rate: 1.3, tint: 0xffffff },
  { skin: "l", clip: "walk", rate: 0.5, tint: 0xff7a7a },
];

type Skin = { model: THREE.Group; parts: THREE.Mesh[] };
export type Characters = { skins: Map<string, Skin>; clips: Map<string, THREE.AnimationClip> };

const meshesOf = (root: THREE.Object3D) => {
  const out: THREE.Mesh[] = [];
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) out.push(o as THREE.Mesh);
  });
  return out;
};

async function load(): Promise<Characters> {
  const loader = new GLTFLoader();
  const names = [...new Set([...PLAYER_SKINS, ...ZOMBIE_LOOKS.map((l) => l.skin)])];
  const files = await Promise.all(names.map((n) => loader.loadAsync(`${BASE}character-${n}.glb`)));
  const skins = new Map<string, Skin>();
  files.forEach((gltf, i) => {
    const parts = meshesOf(gltf.scene);
    // pack ships unlit -> relight so they sit in the scene
    const map = (parts[0].material as THREE.MeshBasicMaterial).map;
    // emissive lift: textures are painted for unlit, go muddy on the dark floor otherwise
    const mat = new THREE.MeshStandardMaterial({ map, roughness: 0.9, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: 0.45 });
    for (const p of parts) {
      p.material = mat;
      p.castShadow = true;
    }
    skins.set(names[i], { model: gltf.scene, parts });
  });
  return { skins, clips: new Map(files[0].animations.map((c) => [c.name, c])) };
}

let cache: Promise<Characters> | null = null;
export const loadCharacters = () =>
  (cache ??= load().catch((e) => {
    cache = null;
    throw e;
  }));

// The profile seed keeps the same survivor across reconnects and rooms.
export const pickSkin = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PLAYER_SKINS[h % PLAYER_SKINS.length];
};

// part matrices in model space per frame, arms forced out front
function bake(skin: Skin, clip: THREE.AnimationClip) {
  const rig = skin.model.clone(true);
  const parts = meshesOf(rig);
  const armL = rig.getObjectByName("arm-left");
  const armR = rig.getObjectByName("arm-right");
  const mixer = new THREE.AnimationMixer(rig);
  mixer.clipAction(clip).play();
  const out = new Float32Array(FRAMES * parts.length * 16);
  for (let f = 0; f < FRAMES; f++) {
    mixer.setTime((f / FRAMES) * clip.duration);
    const sway = Math.sin((f / FRAMES) * Math.PI * 2) * 0.2;
    armL?.rotation.set(-Math.PI / 2 + sway, 0, 0);
    armR?.rotation.set(-Math.PI / 2 - sway, 0, 0);
    rig.updateMatrixWorld(true);
    parts.forEach((p, i) => p.matrixWorld.toArray(out, (f * parts.length + i) * 16));
  }
  return out;
}

type HordeSet = { meshes: THREE.InstancedMesh[]; n: number };
type HordeLook = { set: HordeSet; frames: Float32Array; speed: number; tint: number };

// every zombie = one instance in each of its skin's part meshes, posed from baked frames
export class Horde {
  private sets: HordeSet[] = [];
  private looks: HordeLook[] = [];
  private dummy = new THREE.Object3D();
  private part = new THREE.Matrix4();
  private color = new THREE.Color();

  constructor(
    scene: THREE.Scene,
    chars: Characters,
    private max: number
  ) {
    const bySkin = new Map<string, HordeSet>();
    const baked = new Map<string, Float32Array>();
    for (const look of ZOMBIE_LOOKS) {
      const skin = chars.skins.get(look.skin)!;
      const clip = chars.clips.get(look.clip)!;
      let set = bySkin.get(look.skin);
      if (!set) {
        const meshes = skin.parts.map((p) => {
          const mesh = new THREE.InstancedMesh(p.geometry, p.material, max);
          mesh.count = 0;
          mesh.frustumCulled = false;
          mesh.castShadow = true;
          mesh.setColorAt(0, this.color.set(0xffffff)); // allocates instanceColor
          scene.add(mesh);
          return mesh;
        });
        set = { meshes, n: 0 };
        bySkin.set(look.skin, set);
        this.sets.push(set);
      }
      const key = `${look.skin}:${look.clip}`;
      let frames = baked.get(key);
      if (!frames) baked.set(key, (frames = bake(skin, clip)));
      this.looks.push({ set, frames, speed: look.rate / clip.duration, tint: look.tint });
    }
  }

  begin() {
    for (const set of this.sets) set.n = 0;
  }

  add(type: number, id: number, x: number, z: number, angle: number, scale: number, flash: number, time: number) {
    const look = this.looks[type] ?? this.looks[0];
    const { meshes, n } = look.set;
    if (n >= this.max) return;
    const frame = Math.floor(((time * look.speed + id * 0.37) % 1) * FRAMES);
    this.dummy.position.set(x, 0, z);
    this.dummy.rotation.set(0, Math.PI / 2 - angle, Math.sin(time * 7 + id) * 0.08);
    this.dummy.scale.setScalar(scale * SCALE);
    this.dummy.updateMatrix();
    // > 1 on purpose -> hit flash blows out to white
    this.color.setHex(look.tint).multiplyScalar(1 + flash * 4).addScalar(flash * 0.6);
    for (let i = 0; i < meshes.length; i++) {
      this.part.fromArray(look.frames, (frame * meshes.length + i) * 16).premultiply(this.dummy.matrix);
      meshes[i].setMatrixAt(n, this.part);
      meshes[i].setColorAt(n, this.color);
    }
    look.set.n++;
  }

  end() {
    for (const set of this.sets) {
      for (const mesh of set.meshes) {
        mesh.count = set.n;
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      }
    }
  }
}

// gun + arm offsets are in native rig units (torso space)
const GUN_Z = 1.25;
const gunGeo = new THREE.BoxGeometry(0.2, 0.28, 1);
const gunMat = new THREE.MeshStandardMaterial({ color: 0x1a1c22, roughness: 0.5 });
const ringGeo = new THREE.RingGeometry(0.62, 0.76, 32).rotateX(-Math.PI / 2);
const reviveGeo = new THREE.RingGeometry(0.95, 1.1, 32).rotateX(-Math.PI / 2);
const laserGeo = new THREE.BoxGeometry(5, 0.02, 0.02).translate(MUZZLE + 2.5, GUN_HEIGHT, 0);

// two-hand grip: arms out front, toed in so the hands meet on the aim line
const PITCH = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
const HOLD_R = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.3).multiply(PITCH);
const HOLD_L = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -0.3).multiply(PITCH);

const nameSprite = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 64;
  const c = canvas.getContext("2d")!;
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map,
    depthTest: false,
    depthWrite: false,
    transparent: true,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(3, 0.375, 1);
  sprite.position.y = 2.9;
  sprite.renderOrder = 10;

  const setIdentity = ({ name, color }: PlayerProfile) => {
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.font = "500 32px sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    const text = Array.from(name);
    const originalLength = text.length;
    while (
      text.length > 1 &&
      c.measureText(text.join("") + "…").width > canvas.width - 24
    )
      text.pop();
    const label = text.join("") + (text.length < originalLength ? "…" : "");
    c.lineJoin = "round";
    c.lineWidth = 2;
    c.strokeStyle = "rgba(0,0,0,0.75)";
    c.strokeText(label, canvas.width / 2, canvas.height / 2);
    c.fillStyle = color;
    c.fillText(label, canvas.width / 2, canvas.height / 2);
    map.needsUpdate = true;
  };
  const dispose = () => {
    map.dispose();
    material.dispose();
  };
  return { sprite, setIdentity, dispose };
};

export type PlayerModel = {
  group: THREE.Group;
  revive: THREE.Mesh; // fills as a teammate revives
  skin: string;
  update: (dt: number, angle: number, moving: boolean, down: boolean) => void;
  kick: () => void;
  setIdentity: (profile: PlayerProfile) => void;
  dispose: () => void;
};

export const makePlayerModel = (
  chars: Characters,
  skin: string,
  profile: PlayerProfile,
  isMe: boolean,
): PlayerModel => {
  const { color } = profile;
  const tint = new THREE.Color(color);
  const group = new THREE.Group();
  const rig = new THREE.Group(); // faces +x like the rest of the game
  const body = chars.skins.get(skin)!.model.clone(true);
  body.rotation.y = Math.PI / 2;
  body.scale.setScalar(SCALE);
  rig.add(body);

  const armL = body.getObjectByName("arm-left");
  const armR = body.getObjectByName("arm-right");
  const gun = new THREE.Mesh(gunGeo, gunMat);
  gun.position.set(0, 1.1, GUN_Z);
  gun.castShadow = true;
  body.getObjectByName("torso")?.add(gun);

  const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: tint }));
  ring.position.y = 0.03;
  const revive = new THREE.Mesh(reviveGeo, new THREE.MeshBasicMaterial({ color: 0x5dff9b, transparent: true, opacity: 0.9 }));
  revive.position.y = 0.04;
  revive.visible = false;
  group.add(rig, ring, revive);

  const laser = isMe
    ? new THREE.Mesh(
        laserGeo,
        new THREE.MeshBasicMaterial({
          color: tint,
          transparent: true,
          opacity: 0.35,
        }),
      )
    : null;
  if (laser) rig.add(laser);
  const label = nameSprite();
  label.setIdentity(profile);
  group.add(label.sprite);

  const mixer = new THREE.AnimationMixer(body);
  const idle = mixer.clipAction(chars.clips.get("idle")!);
  const walk = mixer.clipAction(chars.clips.get("walk")!);
  const die = mixer.clipAction(chars.clips.get("die")!);
  walk.timeScale = 1.5;
  die.setLoop(THREE.LoopOnce, 1);
  die.clampWhenFinished = true;
  idle.play();
  walk.play();

  let stride = 0;
  let recoil = 0;
  let wasDown = false;

  const update = (dt: number, angle: number, moving: boolean, down: boolean) => {
    rig.rotation.y = -angle;
    if (down !== wasDown) {
      wasDown = down;
      if (down) die.reset().play();
      else die.stop();
      body.position.y = down ? 0.2 : 0; // die clip lays the back below y=0
      gun.visible = !down;
      if (laser) laser.visible = !down;
    }
    stride += ((moving ? 1 : 0) - stride) * (1 - Math.exp(-12 * dt));
    idle.setEffectiveWeight(down ? 0 : 1 - stride);
    walk.setEffectiveWeight(down ? 0 : stride);
    mixer.update(dt);
    if (down) return;
    // after the mixer -> clips never get the gun arms
    armL?.quaternion.copy(HOLD_L);
    armR?.quaternion.copy(HOLD_R);
    recoil = Math.max(0, recoil - dt * 9);
    gun.position.z = GUN_Z - recoil * 0.25;
  };

  return {
    group,
    revive,
    skin,
    update,
    kick: () => (recoil = 1),
    setIdentity: (next) => {
      ring.material.color.set(next.color);
      laser?.material.color.set(next.color);
      label.setIdentity(next);
    },
    dispose: () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(body);
      ring.material.dispose();
      revive.material.dispose();
      laser?.material.dispose();
      label.dispose();
    },
  };
};
