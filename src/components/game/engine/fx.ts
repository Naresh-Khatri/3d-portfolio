import * as THREE from "three";
import { GUN_HEIGHT } from "./characters";

const MAX_TRACERS = 96;
const MAX_PARTICLES = 700;
const MAX_RINGS = 8;
const TRACER_LIFE = 0.07;
const GRAVITY = 20;

// pooled tracers, particles and shockwave rings
export class Fx {
  private tracers: THREE.InstancedMesh;
  private tracerData = new Float32Array(MAX_TRACERS * 5); // x, z, angle, len, life
  private tracerHead = 0;

  private points: THREE.Points;
  private pos = new Float32Array(MAX_PARTICLES * 3);
  private col = new Float32Array(MAX_PARTICLES * 3);
  private vel = new Float32Array(MAX_PARTICLES * 3);
  private life = new Float32Array(MAX_PARTICLES);
  private particleHead = 0;

  private rings: { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; life: number; size: number }[] = [];
  private ringHead = 0;

  private dummy = new THREE.Object3D();
  private color = new THREE.Color();

  constructor(scene: THREE.Scene) {
    this.tracers = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 0.06, 0.06).translate(0.5, 0, 0),
      new THREE.MeshBasicMaterial({ color: 0xffe2a0, toneMapped: false }),
      MAX_TRACERS
    );
    this.tracers.frustumCulled = false;
    this.tracers.count = 0;
    scene.add(this.tracers);

    this.pos.fill(-999);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(this.col, 3));
    this.points = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ size: 0.24, vertexColors: true, toneMapped: false })
    );
    this.points.frustumCulled = false;
    scene.add(this.points);

    const ringGeo = new THREE.RingGeometry(0.86, 1, 48).rotateX(-Math.PI / 2);
    for (let i = 0; i < MAX_RINGS; i++) {
      const mat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
      const mesh = new THREE.Mesh(ringGeo, mat);
      mesh.visible = false;
      mesh.position.y = 0.06;
      scene.add(mesh);
      this.rings.push({ mesh, mat, life: 0, size: 1 });
    }
  }

  tracer(x: number, z: number, angle: number, len: number) {
    const i = this.tracerHead * 5;
    this.tracerHead = (this.tracerHead + 1) % MAX_TRACERS;
    this.tracerData[i] = x;
    this.tracerData[i + 1] = z;
    this.tracerData[i + 2] = angle;
    this.tracerData[i + 3] = len;
    this.tracerData[i + 4] = TRACER_LIFE;
  }

  burst(x: number, y: number, z: number, hex: number, count: number, speed: number) {
    this.color.setHex(hex);
    for (let n = 0; n < count; n++) {
      const i = this.particleHead * 3;
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.3 + Math.random() * 0.7);
      this.pos[i] = x;
      this.pos[i + 1] = y;
      this.pos[i + 2] = z;
      this.vel[i] = Math.cos(a) * s;
      this.vel[i + 1] = 2 + Math.random() * speed * 0.8;
      this.vel[i + 2] = Math.sin(a) * s;
      const shade = 0.6 + Math.random() * 0.6;
      this.col[i] = this.color.r * shade;
      this.col[i + 1] = this.color.g * shade;
      this.col[i + 2] = this.color.b * shade;
      this.life[this.particleHead] = 0.5 + Math.random() * 0.6;
      this.particleHead = (this.particleHead + 1) % MAX_PARTICLES;
    }
  }

  ring(x: number, z: number, size: number, hex: number) {
    const r = this.rings[this.ringHead];
    this.ringHead = (this.ringHead + 1) % MAX_RINGS;
    r.mesh.position.set(x, 0.06, z);
    r.mesh.visible = true;
    r.mat.color.setHex(hex);
    r.life = 1;
    r.size = size;
  }

  update(dt: number) {
    let n = 0;
    for (let k = 0; k < MAX_TRACERS; k++) {
      const i = k * 5;
      const life = this.tracerData[i + 4];
      if (life <= 0) continue;
      this.tracerData[i + 4] = life - dt;
      // no per-instance alpha -> fade by thinning
      const thick = life / TRACER_LIFE;
      this.dummy.position.set(this.tracerData[i], GUN_HEIGHT, this.tracerData[i + 1]);
      this.dummy.rotation.set(0, -this.tracerData[i + 2], 0);
      this.dummy.scale.set(this.tracerData[i + 3], thick, thick);
      this.dummy.updateMatrix();
      this.tracers.setMatrixAt(n++, this.dummy.matrix);
    }
    this.tracers.count = n;
    this.tracers.instanceMatrix.needsUpdate = true;

    for (let k = 0; k < MAX_PARTICLES; k++) {
      if (this.life[k] <= 0) continue;
      const i = k * 3;
      this.life[k] -= dt;
      if (this.life[k] <= 0) {
        this.pos[i + 1] = -999;
        continue;
      }
      this.vel[i + 1] -= GRAVITY * dt;
      this.pos[i] += this.vel[i] * dt;
      this.pos[i + 1] += this.vel[i + 1] * dt;
      this.pos[i + 2] += this.vel[i + 2] * dt;
      if (this.pos[i + 1] < 0.05) {
        this.pos[i + 1] = 0.05;
        this.vel[i] = this.vel[i + 1] = this.vel[i + 2] = 0;
      }
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.color.needsUpdate = true;

    for (const r of this.rings) {
      if (r.life <= 0) continue;
      r.life -= dt * 2.2;
      if (r.life <= 0) {
        r.mesh.visible = false;
        continue;
      }
      r.mesh.scale.setScalar(r.size * (1 - r.life * r.life));
      r.mat.opacity = r.life;
    }
  }
}
