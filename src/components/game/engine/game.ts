import * as THREE from "three";
import type { Socket } from "socket.io-client";
import type { GamePing } from "./ping";
import {
  BOOM_RADIUS,
  DASH_CD,
  DASH_SPEED,
  DASH_TIME,
  D_NUKE,
  D_STRIDE,
  E_BOOM,
  E_NUKE,
  E_PICKUP,
  E_REVIVE,
  E_STRIDE,
  PLAYER_R,
  PLAYER_SPEED,
  S_STRIDE,
  TICK_HZ,
  WEAPONS,
  ZOMBIES,
  Z_BOOMER,
  Z_BOSS,
  Z_STRIDE,
  castRay,
  collide,
  type GamePhase,
  type PlayerSnap,
  type Snapshot,
} from "../protocol";
import { Fx } from "./fx";
import { Input } from "./input";
import { sfx } from "./sfx";
import { buildArena, loadArena } from "./arena";
import { GUN_HEIGHT, Horde, MUZZLE, loadCharacters, makePlayerModel, pickSkin, type Characters, type PlayerModel } from "./characters";
import { DROP_LABEL, buildWorld, dropColor, makeDrop } from "./world";

const MAX_ZOMBIES = 160;
const SNAP_DIST = 2.5;
const CAM_OFFSET = new THREE.Vector3(0, 16, 9);

export type HudPlayer = { id: string; name: string; color: string; hp: number; down: boolean; kills: number; me: boolean };

export type Hud = {
  ping: GamePing;
  runId: string | null;
  status: "loading" | "connecting" | "joined" | "full" | "failed";
  error: string | null;
  room: string | null;
  phase: GamePhase;
  wave: number;
  left: number;
  next: number;
  score: number;
  best: number;
  hp: number;
  weapon: number;
  ammo: number;
  down: boolean;
  dash: boolean;
  boss: number; // hp 0..1, -1 = none
  players: HudPlayer[];
  hurt: number; // bumps on damage -> keys the vignette
  toast: string;
  toastN: number;
  touch: boolean;
};

const INITIAL_HUD: Hud = {
  ping: { status: "checking", ms: null },
  runId: null,
  status: "loading",
  error: null,
  room: null,
  phase: "lobby",
  wave: 0,
  left: 0,
  next: 0,
  score: 0,
  best: 0,
  hp: 100,
  weapon: 0,
  ammo: -1,
  down: false,
  dash: true,
  boss: -1,
  players: [],
  hurt: 0,
  toast: "",
  toastN: 0,
  touch: false,
};

// useSyncExternalStore-friendly; object identity changes only on real change
export class HudStore {
  private state = INITIAL_HUD;
  private key = "";
  private listeners = new Set<() => void>();

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  get = () => this.state;

  patch(p: Partial<Hud>) {
    const next = { ...this.state, ...p };
    const key = JSON.stringify(next);
    if (key === this.key) return;
    this.key = key;
    this.state = next;
    this.listeners.forEach((fn) => fn());
  }
}

type Zed = { id: number; type: number; x: number; z: number; r: number; tx: number; tz: number; a: number; hp: number; flash: number; spawn: number };
type PlayerEnt = { model: PlayerModel; snap: PlayerSnap; x: number; z: number; a: number; px: number; pz: number };
type DropEnt = { group: THREE.Group; core: THREE.Mesh };

const smooth = (rate: number, dt: number) => 1 - Math.exp(-rate * dt);
const lerpAngle = (a: number, b: number, k: number) => {
  const d = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + d * k;
};
const r2 = (n: number) => Math.round(n * 100) / 100;

export type GameOptions = {
  room: string | null;
  maxDpr: number;
  shadows: boolean;
  hud: HudStore;
  onExit: () => void;
};

export class Game {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(50, 1, 0.5, 120);
  private camTarget = new THREE.Vector3();
  private sun: THREE.DirectionalLight;
  private fx: Fx;
  private input: Input;
  private resizer: ResizeObserver;

  private chars: Characters | null = null;
  private horde: Horde | null = null;
  private disposed = false;
  private loadTimer: ReturnType<typeof setTimeout> | undefined;
  private joinTimer: ReturnType<typeof setTimeout> | undefined;
  private joinRetry: ReturnType<typeof setInterval> | undefined;
  private zombies = new Map<number, Zed>();
  private players = new Map<string, PlayerEnt>();
  private drops = new Map<number, DropEnt>();

  private phase: GamePhase = "lobby";
  private wave = 0;
  private joined = false;
  private raf = 0;
  private last = performance.now();
  private time = 0;
  private shake = 0;

  private dashT = 0;
  private dashCd = 0;
  private dashX = 0;
  private dashZ = 0;
  private fireCd = 0;
  private fireTap = false;
  private autoFire = false;
  private sendT = 0;
  private hurt = 0;
  private toastN = 0;

  private raycaster = new THREE.Raycaster();
  private ndc = new THREE.Vector2();
  private aimPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -GUN_HEIGHT);
  private aimPoint = new THREE.Vector3();
  private dummy = new THREE.Object3D();

  constructor(
    private canvas: HTMLCanvasElement,
    private socket: Socket,
    private opts: GameOptions
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, opts.maxDpr));
    this.renderer.shadowMap.enabled = opts.shadows;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.sun = buildWorld(this.scene, opts.shadows).sun;
    this.fx = new Fx(this.scene);

    this.input = new Input(canvas, { exit: opts.onExit, start: () => this.start() });

    this.resizer = new ResizeObserver(this.resize);
    this.resizer.observe(canvas.parentElement ?? canvas);
    this.resize();

    sfx.warm();
    opts.hud.patch({ status: "loading", error: null });
    this.loadTimer = setTimeout(() => this.fail("The game models took too long to load. Close the game and try again."), 30_000);
    // join only once models are in -> no snapshot ever lacks a mesh
    Promise.all([loadCharacters(), loadArena()]).then(
      ([chars, arena]) => {
        if (this.disposed || opts.hud.get().status === "failed") return;
        this.scene.add(buildArena(arena));
        this.chars = chars;
        this.horde = new Horde(this.scene, chars, MAX_ZOMBIES);
        clearTimeout(this.loadTimer);
        socket.on("connect", this.join);
        socket.on("disconnect", this.onDisconnect);
        socket.on("game:joined", this.onJoined);
        socket.on("game:snap", this.onSnap);
        this.join();
      }
    ).catch((error) => {
      if (this.disposed) return;
      console.error("Game initialization failed:", error);
      this.fail("The game could not initialize. Close it and try again.");
    });

    this.raf = requestAnimationFrame(this.frame);
  }

  dispose() {
    this.disposed = true;
    clearTimeout(this.loadTimer);
    this.clearJoinTimers();
    cancelAnimationFrame(this.raf);
    this.socket.off("connect", this.join);
    this.socket.off("disconnect", this.onDisconnect);
    this.socket.off("game:joined", this.onJoined);
    this.socket.off("game:snap", this.onSnap);
    this.socket.emit("game:leave");
    this.resizer.disconnect();
    this.input.dispose();
    this.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      mesh.geometry?.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      for (const m of Array.isArray(mat) ? mat : mat ? [mat] : []) {
        (m as THREE.MeshBasicMaterial).map?.dispose();
        m.dispose();
      }
    });
    this.renderer.dispose();
  }

  start() {
    if (this.joined && this.phase !== "playing") this.socket.emit("game:start");
  }

  suspendControls(value: boolean) {
    this.input.suspend(value);
    this.fireTap = false;
  }

  dash() {
    this.input.queueDash();
  }

  private get me() {
    return this.socket.id ? this.players.get(this.socket.id) : undefined;
  }

  private clearJoinTimers() {
    clearTimeout(this.joinTimer);
    clearInterval(this.joinRetry);
  }

  private fail(message: string) {
    if (this.disposed) return;
    clearTimeout(this.loadTimer);
    this.clearJoinTimers();
    this.opts.hud.patch({ status: "failed", error: message });
  }

  private requestJoin = () => {
    if (this.socket.connected) {
      this.socket.emit("game:join", this.opts.room ? { room: this.opts.room } : undefined);
    }
  };

  private join = () => {
    if (this.disposed) return;
    this.clearJoinTimers();
    this.opts.hud.patch({ status: "connecting", error: null });
    this.joinTimer = setTimeout(() => this.fail(
      this.socket.connected
        ? "The server did not respond to the game request. Check that the socket URL points to the backend with Zombie Survival enabled."
        : "Could not connect to the game server. Check your connection and try again."
    ), 15_000);
    // Backend handlers may still be initializing when the socket connects.
    this.joinRetry = setInterval(this.requestJoin, 2_000);
    this.requestJoin();
  };

  private onDisconnect = () => {
    this.joined = false;
    this.join();
  };

  private onJoined = (data: { room: string | null }) => {
    if (this.disposed) return;
    this.clearJoinTimers();
    this.joined = !!data.room;
    this.opts.hud.patch({ status: data.room ? "joined" : "full", error: null, room: data.room });
  };

  private resize = () => {
    const el = this.canvas.parentElement ?? this.canvas;
    const w = el.clientWidth || 1;
    const h = el.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  private onSnap = (s: Snapshot) => {
    const chars = this.chars;
    if (!chars) return;
    const myId = this.socket.id;
    const prevPhase = this.phase;
    const started = s.phase === "playing" && prevPhase !== "playing";
    this.phase = s.phase;

    let myIndex = -1;
    const seenPlayers = new Set<string>();
    s.p.forEach((p, i) => {
      seenPlayers.add(p.id);
      const isMe = p.id === myId;
      if (isMe) myIndex = i;
      let ent = this.players.get(p.id);
      if (!ent) {
        const taken = new Set([...this.players.values()].map((e) => e.model.skin));
        const model = makePlayerModel(chars, pickSkin(p.id, taken), p.color, p.name, isMe);
        ent = { model, snap: p, x: p.x, z: p.z, a: p.a, px: p.x, pz: p.z };
        this.scene.add(ent.model.group);
        this.players.set(p.id, ent);
      }
      if (isMe) {
        if (p.hp < ent.snap.hp && !started) {
          this.hurt++;
          this.shake = Math.max(this.shake, 0.5);
          sfx.hurt();
        }
        // server placed us (start) or rejected a move
        if (started || Math.hypot(p.x - ent.x, p.z - ent.z) > SNAP_DIST) {
          ent.x = p.x;
          ent.z = p.z;
        }
      }
      ent.snap = p;
    });
    for (const [id, ent] of this.players) {
      if (seenPlayers.has(id)) continue;
      this.scene.remove(ent.model.group);
      this.players.delete(id);
    }

    const me = this.me;
    const seenZ = new Set<number>();
    let boss = -1;
    for (let i = 0; i < s.z.length; i += Z_STRIDE) {
      const id = s.z[i];
      const type = s.z[i + 1];
      const x = s.z[i + 2];
      const z = s.z[i + 3];
      const hp = s.z[i + 4];
      seenZ.add(id);
      if (type === Z_BOSS) boss = hp;
      const zed = this.zombies.get(id);
      if (!zed) {
        const cfg = ZOMBIES[type] ?? ZOMBIES[0];
        this.zombies.set(id, { id, type, x, z, r: cfg.r, tx: x, tz: z, a: 0, hp, flash: 0, spawn: 0 });
        continue;
      }
      if (hp < zed.hp) zed.flash = 1;
      zed.hp = hp;
      zed.tx = x;
      zed.tz = z;
    }
    let kills = 0;
    for (const [id, zed] of this.zombies) {
      if (seenZ.has(id)) continue;
      this.zombies.delete(id);
      // gone while playing = killed; otherwise the room reset
      if (prevPhase !== "playing" || started) continue;
      const cfg = ZOMBIES[zed.type] ?? ZOMBIES[0];
      this.fx.burst(zed.x, cfg.scale, zed.z, cfg.color, zed.type === Z_BOSS ? 60 : 12, 5 + cfg.scale * 2);
      kills++;
    }
    if (kills) sfx.kill();

    const seenD = new Set<number>();
    for (let i = 0; i < s.d.length; i += D_STRIDE) {
      const id = s.d[i];
      seenD.add(id);
      if (this.drops.has(id)) continue;
      const drop = makeDrop(s.d[i + 1]);
      drop.group.position.set(s.d[i + 2], 0, s.d[i + 3]);
      this.scene.add(drop.group);
      this.drops.set(id, drop);
    }
    for (const [id, drop] of this.drops) {
      if (seenD.has(id)) continue;
      this.scene.remove(drop.group);
      this.drops.delete(id);
    }

    // own shots are predicted locally
    const heard = new Set<number>();
    for (let i = 0; i < s.s.length; i += S_STRIDE) {
      const idx = s.s[i];
      if (idx === myIndex) continue;
      const a = s.s[i + 3];
      const len = s.s[i + 4] - MUZZLE;
      if (len > 0) this.fx.tracer(s.s[i + 1] + Math.cos(a) * MUZZLE, s.s[i + 2] + Math.sin(a) * MUZZLE, a, len);
      if (heard.has(idx)) continue;
      heard.add(idx);
      this.players.get(s.p[idx]?.id)?.model.kick();
      sfx.shot(s.p[idx]?.w ?? 0, 0.35);
    }

    let toast = "";
    for (let i = 0; i < s.e.length; i += E_STRIDE) {
      const kind = s.e[i];
      const x = s.e[i + 1];
      const z = s.e[i + 2];
      const arg = s.e[i + 3];
      const dist = me ? Math.hypot(x - me.x, z - me.z) : 0;
      if (kind === E_BOOM) {
        this.fx.ring(x, z, BOOM_RADIUS, 0xff7a2e);
        this.fx.burst(x, 0.8, z, 0xff7a2e, 30, 9);
        const near = Math.max(0.15, 1 - dist / 22);
        this.shake = Math.max(this.shake, 0.7 * near);
        sfx.boom(near);
      } else if (kind === E_PICKUP) {
        this.fx.burst(x, 0.8, z, dropColor(arg), 14, 4);
        if (dist < 2 && arg !== D_NUKE) {
          sfx.pickup();
          toast = DROP_LABEL[arg] ?? "";
        }
      } else if (kind === E_NUKE) {
        this.fx.ring(x, z, 48, 0xfff04d);
        this.shake = 1;
        sfx.boom();
        toast = "Nuke!";
      } else if (kind === E_REVIVE) {
        this.fx.ring(x, z, 2.2, 0x5dff9b);
        sfx.revive();
      }
    }
    if (toast) this.toastN++;

    if (s.phase === "playing" && s.wave > this.wave) sfx.wave();
    if (s.phase === "over" && prevPhase === "playing") sfx.over();
    this.wave = s.wave;

    const mine = me?.snap;
    this.opts.hud.patch({
      runId: s.runId,
      phase: s.phase,
      wave: s.wave,
      left: s.left,
      next: s.next,
      score: s.score,
      best: s.best,
      boss,
      hp: mine?.hp ?? 0,
      weapon: mine?.w ?? 0,
      ammo: mine?.ammo ?? -1,
      down: mine?.down ?? false,
      hurt: this.hurt,
      ...(toast && { toast, toastN: this.toastN }),
      players: s.p.map((p) => ({ id: p.id, name: p.name, color: p.color, hp: p.hp, down: p.down, kills: p.kills, me: p.id === myId })),
    });
  };

  private frame = (t: number) => {
    this.raf = requestAnimationFrame(this.frame);
    const dt = Math.min(0.05, (t - this.last) / 1000);
    this.last = t;
    this.time += dt;
    this.updateMe(dt);
    this.updateEntities(dt);
    this.fx.update(dt);
    this.updateCamera(dt);
    this.renderer.render(this.scene, this.camera);
  };

  private updateMe(dt: number) {
    const me = this.me;
    const wantDash = this.input.takeDash();
    if (this.input.takeFireLatch()) this.fireTap = true;
    if (!me) return;

    this.dashCd -= dt;
    this.fireCd -= dt * 1000;
    const active = !this.input.suspended && !me.snap.down && this.phase !== "over";

    if (active) {
      const mv = this.input.move();
      if (wantDash && this.dashCd <= 0) {
        const len = Math.hypot(mv.x, mv.z);
        this.dashX = len > 0.1 ? mv.x / len : Math.cos(me.a);
        this.dashZ = len > 0.1 ? mv.z / len : Math.sin(me.a);
        this.dashT = DASH_TIME;
        this.dashCd = DASH_CD;
        this.fx.burst(me.x, 0.3, me.z, 0xcfe8ff, 10, 3);
        sfx.dash();
      }
      if (this.dashT > 0) {
        this.dashT -= dt;
        me.x += this.dashX * DASH_SPEED * dt;
        me.z += this.dashZ * DASH_SPEED * dt;
      } else {
        me.x += mv.x * PLAYER_SPEED * dt;
        me.z += mv.z * PLAYER_SPEED * dt;
      }
      collide(me, PLAYER_R);
      this.aim(me, mv);
    } else {
      const k = smooth(12, dt);
      me.x += (me.snap.x - me.x) * k;
      me.z += (me.snap.z - me.z) * k;
      this.autoFire = false;
    }

    const firing = active && (this.input.firing || this.fireTap || this.autoFire);
    if (firing) {
      let fired = false;
      while (this.fireCd <= 0) {
        this.fireCd += WEAPONS[me.snap.w].cd;
        this.shoot(me);
        fired = true;
      }
      if (fired) sfx.shot(me.snap.w);
    } else if (this.fireCd < 0) this.fireCd = 0;

    this.sendT += dt;
    if (this.joined && this.sendT >= 1 / TICK_HZ) {
      this.sendT = 0;
      this.socket.volatile.emit("game:in", [r2(me.x), r2(me.z), r2(me.a), firing ? 1 : 0]);
      this.fireTap = false;
    }

    const hud = this.opts.hud.get();
    const dash = this.dashCd <= 0;
    if (hud.dash !== dash || hud.touch !== this.input.touch) this.opts.hud.patch({ dash, touch: this.input.touch });
  }

  private aim(me: PlayerEnt, mv: { x: number; z: number }) {
    if (!this.input.touch) {
      this.autoFire = false;
      this.ndc.set(this.input.mouseX, this.input.mouseY);
      this.raycaster.setFromCamera(this.ndc, this.camera);
      if (this.raycaster.ray.intersectPlane(this.aimPlane, this.aimPoint)) {
        me.a = Math.atan2(this.aimPoint.z - me.z, this.aimPoint.x - me.x);
      }
      return;
    }
    // touch: lock nearest zombie with a clear line, else face movement
    const range = WEAPONS[me.snap.w].range * 0.9;
    let best: Zed | null = null;
    let bestD = range;
    for (const zed of this.zombies.values()) {
      const d = Math.hypot(zed.x - me.x, zed.z - me.z);
      if (d >= bestD) continue;
      const a = Math.atan2(zed.z - me.z, zed.x - me.x);
      if (!castRay(me.x, me.z, a, range, [zed]).hit) continue;
      best = zed;
      bestD = d;
    }
    this.autoFire = !!best;
    if (best) me.a = Math.atan2(best.z - me.z, best.x - me.x);
    else if (Math.hypot(mv.x, mv.z) > 0.1) me.a = Math.atan2(mv.z, mv.x);
  }

  // cosmetic only -> server redoes the hitscan from our input
  private shoot(me: PlayerEnt) {
    const w = WEAPONS[me.snap.w];
    for (let i = 0; i < w.pellets; i++) {
      const a = me.a + (Math.random() - 0.5) * w.spread;
      const { dist, hit } = castRay(me.x, me.z, a, w.range, this.zombies.values());
      if (dist > MUZZLE) this.fx.tracer(me.x + Math.cos(a) * MUZZLE, me.z + Math.sin(a) * MUZZLE, a, dist - MUZZLE);
      if (!hit) continue;
      hit.flash = 1;
      this.fx.burst(me.x + Math.cos(a) * dist, 1.1, me.z + Math.sin(a) * dist, ZOMBIES[hit.type]?.color ?? 0xffffff, 3, 3);
    }
    me.model.kick();
    this.shake = Math.max(this.shake, w.pellets > 1 ? 0.22 : 0.07);
  }

  private updateEntities(dt: number) {
    const myId = this.socket.id;
    const k = smooth(14, dt);
    for (const [id, p] of this.players) {
      if (id !== myId) {
        p.x += (p.snap.x - p.x) * k;
        p.z += (p.snap.z - p.z) * k;
        p.a = lerpAngle(p.a, p.snap.a, k);
      }
      const { group, revive } = p.model;
      const down = p.snap.down;
      const moving = Math.hypot(p.x - p.px, p.z - p.pz) > dt;
      p.px = p.x;
      p.pz = p.z;
      group.position.set(p.x, 0, p.z);
      p.model.update(dt, p.a, moving, down);
      revive.visible = down;
      if (down) revive.scale.setScalar(p.snap.rev > 0 ? 0.3 + p.snap.rev * 0.7 : 1 + Math.sin(this.time * 5) * 0.08);
    }

    this.horde?.begin();
    for (const zed of this.zombies.values()) {
      const cfg = ZOMBIES[zed.type] ?? ZOMBIES[0];
      const dx = zed.tx - zed.x;
      const dz = zed.tz - zed.z;
      if (dx * dx + dz * dz > 0.0004) zed.a = lerpAngle(zed.a, Math.atan2(dz, dx), smooth(10, dt));
      zed.x += dx * k;
      zed.z += dz * k;
      zed.spawn = Math.min(1, zed.spawn + dt * 3);
      zed.flash = Math.max(0, zed.flash - dt * 7);

      const pulse = zed.type === Z_BOOMER ? 1 + Math.sin(this.time * 9 + zed.id) * 0.07 : 1;
      const scale = cfg.scale * pulse * zed.spawn * (2 - zed.spawn);
      this.horde?.add(zed.type, zed.id, zed.x, zed.z, zed.a, scale, zed.flash, this.time);
    }
    this.horde?.end();

    for (const drop of this.drops.values()) {
      drop.core.rotation.y += dt * 2.2;
      drop.core.position.y = 0.85 + Math.sin(this.time * 3 + drop.group.position.x) * 0.15;
    }
  }

  private updateCamera(dt: number) {
    const me = this.me;
    if (me) {
      const k = smooth(10, dt);
      this.camTarget.x += (me.x - this.camTarget.x) * k;
      this.camTarget.z += (me.z - this.camTarget.z) * k;
    }
    this.shake = Math.max(0, this.shake - dt * 2.5);
    const s = this.shake * this.shake * 0.9;
    // portrait shows less width -> pull back
    const zoom = this.camera.aspect < 1 ? 1.35 : 1;
    this.camera.position
      .copy(CAM_OFFSET)
      .multiplyScalar(zoom)
      .add(this.camTarget)
      .add(this.dummy.position.set((Math.random() - 0.5) * s, 0, (Math.random() - 0.5) * s));
    this.camera.lookAt(this.camTarget);

    this.sun.position.set(this.camTarget.x + 8, 22, this.camTarget.z + 6);
    this.sun.target.position.copy(this.camTarget);
  }
}
