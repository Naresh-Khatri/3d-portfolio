import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { D_HEALTH, D_NUKE, D_SHOTGUN } from "../protocol";

const BG = 0x07080d;

const dropGeo = [
  mergeGeometries([new THREE.BoxGeometry(0.75, 0.25, 0.25), new THREE.BoxGeometry(0.25, 0.75, 0.25)]),
  new THREE.BoxGeometry(1, 0.22, 0.3),
  new THREE.BoxGeometry(0.7, 0.3, 0.3),
  new THREE.IcosahedronGeometry(0.42),
];
const DROP_COLOR = [0x4dff88, 0xff9d3c, 0x4da3ff, 0xfff04d];
const dropMat = DROP_COLOR.map((c) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 2.2 }));
const dropRingGeo = new THREE.RingGeometry(0.55, 0.65, 24).rotateX(-Math.PI / 2);
const DROP_RING_SEGMENTS = 64;

export const DROP_LABEL = ["Health", "Shotgun", "SMG", "Nuke"];
export const dropColor = (type: number) => DROP_COLOR[type] ?? 0xffffff;

const makeDropGlow = (color: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const context = canvas.getContext("2d")!;
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.5)");
  gradient.addColorStop(0.7, "rgba(255,255,255,0.12)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map,
    color,
    opacity: 0.25,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  }));
  glow.scale.set(1.9, 1.9, 1);
  return glow;
};

export const makeDrop = (type: number) => {
  const t = type >= D_HEALTH && type <= D_NUKE ? type : D_SHOTGUN;
  const group = new THREE.Group();
  const core = new THREE.Mesh(dropGeo[t], dropMat[t]);
  core.castShadow = true;
  const glow = makeDropGlow(DROP_COLOR[t]);
  core.add(glow);
  const track = new THREE.Mesh(dropRingGeo, new THREE.MeshBasicMaterial({ color: DROP_COLOR[t], transparent: true, opacity: 0.14, depthWrite: false, toneMapped: false }));
  track.position.y = 0.025;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.55, 0.65, DROP_RING_SEGMENTS).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: DROP_COLOR[t], transparent: true, opacity: 0.75, depthWrite: false, toneMapped: false })
  );
  ring.position.y = 0.03;
  group.add(core, track, ring);
  const positions = ring.geometry.getAttribute("position") as THREE.BufferAttribute;
  positions.setUsage(THREE.DynamicDrawUsage);
  let lastProgress = -1;
  const setProgress = (remaining: number) => {
    const progress = THREE.MathUtils.clamp(remaining, 0, 1);
    if (progress === lastProgress) return;
    lastProgress = progress;
    ring.visible = progress > 0;
    for (let row = 0; row < 2; row++) {
      const radius = row === 0 ? 0.55 : 0.65;
      for (let i = 0; i <= DROP_RING_SEGMENTS; i++) {
        const angle = Math.PI / 2 + (i / DROP_RING_SEGMENTS) * Math.PI * 2 * progress;
        positions.setXYZ(row * (DROP_RING_SEGMENTS + 1) + i, Math.cos(angle) * radius, 0, -Math.sin(angle) * radius);
      }
    }
    positions.needsUpdate = true;
  };
  const dispose = () => {
    glow.material.map?.dispose();
    glow.material.dispose();
    ring.geometry.dispose();
    ring.material.dispose();
    track.material.dispose();
  };
  return { group, core, setProgress, dispose };
};

export function buildWorld(scene: THREE.Scene, shadows: boolean) {
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 34, 70);

  scene.add(new THREE.HemisphereLight(0xaec4ff, 0x1c1626, 1.1));
  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  if (shadows) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const cam = sun.shadow.camera;
    cam.left = cam.bottom = -24;
    cam.right = cam.top = 24;
    cam.near = 1;
    cam.far = 60;
    sun.shadow.bias = -0.0005;
  }
  scene.add(sun, sun.target);

  return { sun };
}
