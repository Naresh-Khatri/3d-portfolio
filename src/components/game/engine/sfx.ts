// kenney audio packs (cc0), mp3 for safari; game over keeps a synth melody on top

const BASE = "/assets/game/sfx/";
const CLIPS = [
  "crunch",
  "punch",
  "rumble",
  "boom1",
  "boom2",
  "doom",
  "slime",
  "splat1",
  "splat2",
  "splat3",
  "hurt1",
  "hurt2",
  "pickup",
  "revive",
  "dash",
  "wave",
] as const;
type Clip = (typeof CLIPS)[number];

const MUTE_KEY = "game:muted";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
try {
  muted = typeof localStorage !== "undefined" && localStorage.getItem(MUTE_KEY) === "1";
} catch {}

const audio = () => {
  if (muted || typeof window === "undefined") return null;
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    load(ctx);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
};

const tone = (from: number, to: number, dur: number, type: OscillatorType, vol: number, delay = 0) => {
  const c = audio();
  if (!c || !master) return;
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + dur);
};

const buffers = new Map<Clip, AudioBuffer>();
let loading = false;
const load = (c: AudioContext) => {
  if (loading) return;
  loading = true;
  for (const name of CLIPS) {
    fetch(`${BASE}${name}.mp3`)
      .then((r) => r.arrayBuffer())
      .then((data) => c.decodeAudioData(data))
      .then((buf) => buffers.set(name, buf))
      .catch(() => {});
  }
};

// rate = pitch + speed; dur cuts the tail with a fade
const play = (name: Clip, vol = 1, rate = 1, dur = 0) => {
  const c = audio();
  const buf = buffers.get(name);
  if (!c || !master || !buf) return;
  const t = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = buf;
  // slight detune -> repeats don't sound stamped
  src.playbackRate.value = rate * (0.94 + Math.random() * 0.12);
  const gain = c.createGain();
  gain.gain.setValueAtTime(vol, t);
  if (dur) gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(gain).connect(master);
  src.start(t);
  if (dur) src.stop(t + dur);
};
const any = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

// kills come in bursts -> throttle
let lastKill = 0;

export const sfx = {
  get muted() {
    return muted;
  },
  // fetch + decode clips before the first shot
  warm() {
    audio();
  },
  toggleMute() {
    muted = !muted;
    try {
      localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    } catch {}
    return muted;
  },
  // vol < 1 for teammates' shots; no gun samples in the packs -> crunch pitched up + cut short
  shot(weapon: number, vol = 1) {
    if (weapon === 1) {
      play("crunch", 0.9 * vol, 1.1, 0.5);
      play("rumble", 0.6 * vol, 1.4, 0.3);
    } else if (weapon === 2) {
      play("crunch", 0.4 * vol, 2.6, 0.09);
      play("punch", 0.3 * vol, 1.9, 0.08);
    } else {
      play("crunch", 0.55 * vol, 1.9, 0.17);
      play("punch", 0.5 * vol, 1.3, 0.15);
    }
  },
  kill() {
    const now = performance.now();
    if (now - lastKill < 60) return;
    lastKill = now;
    play(any(["splat1", "splat2", "splat3"]), 0.6);
    play("slime", 0.35, 1.3);
  },
  boom(vol = 1) {
    play(any(["boom1", "boom2"]), vol);
    play("rumble", 0.8 * vol);
  },
  hurt() {
    play(any(["hurt1", "hurt2"]), 0.9);
  },
  pickup() {
    play("pickup", 0.5);
  },
  dash() {
    play("dash", 0.7, 1.5);
  },
  revive() {
    play("revive", 0.7);
  },
  wave() {
    play("wave", 0.6);
  },
  over() {
    play("doom", 0.9);
    tone(392, 370, 0.3, "sawtooth", 0.3);
    tone(294, 277, 0.3, "sawtooth", 0.3, 0.3);
    tone(196, 98, 0.8, "sawtooth", 0.3, 0.6);
  },
};
