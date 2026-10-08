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
const dropMat = DROP_COLOR.map((c) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.9 }));
const dropRingGeo = new THREE.RingGeometry(0.55, 0.65, 24).rotateX(-Math.PI / 2);

export const DROP_LABEL = ["Health", "Shotgun", "SMG", "Nuke"];
export const dropColor = (type: number) => DROP_COLOR[type] ?? 0xffffff;

export const makeDrop = (type: number) => {
  const t = type >= D_HEALTH && type <= D_NUKE ? type : D_SHOTGUN;
  const group = new THREE.Group();
  const core = new THREE.Mesh(dropGeo[t], dropMat[t]);
  core.castShadow = true;
  const ring = new THREE.Mesh(dropRingGeo, new THREE.MeshBasicMaterial({ color: DROP_COLOR[t], transparent: true, opacity: 0.6 }));
  ring.position.y = 0.03;
  group.add(core, ring);
  return { group, core };
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
