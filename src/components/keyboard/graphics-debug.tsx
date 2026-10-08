"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import type { GraphicsSettings } from "./adaptive-graphics";

type Reading = { fps: number; mean: number; p95: number };

function FrameMeter({ onBaseline, baseline }: {
  onBaseline: (reading: Reading) => void;
  baseline: Reading | null;
}) {
  const [reading, setReading] = useState<Reading | null>(null);
  useEffect(() => {
    let frame = 0;
    let previous = 0;
    let started = 0;
    let warmUntil = performance.now() + 1500;
    let intervals: number[] = [];
    const tick = (now: number) => {
      if (document.hidden || now < warmUntil) {
        previous = 0;
        started = 0;
        intervals = [];
      } else {
        if (previous) intervals.push(now - previous);
        previous = now;
        if (!started) started = now;
        if (now - started >= 2000 && intervals.length) {
          const mean = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
          intervals.sort((a, b) => a - b);
          setReading({ fps: 1000 / mean, mean, p95: intervals[Math.ceil(intervals.length * 0.95) - 1] });
          intervals = [];
          started = now;
        }
      }
      frame = requestAnimationFrame(tick);
    };
    const visibility = () => {
      warmUntil = performance.now() + 1500;
      setReading(null);
    };
    document.addEventListener("visibilitychange", visibility);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  const delta = reading && baseline ? reading.fps - baseline.fps : null;
  return <>
    <output className="block whitespace-pre-line font-mono leading-5 tabular-nums">
      {reading ? `${reading.fps.toFixed(1)} Page FPS${delta === null ? "" : ` · ${delta >= 0 ? "+" : ""}${delta.toFixed(1)} vs saved`}\n${reading.mean.toFixed(1)} ms avg · ${reading.p95.toFixed(1)} ms p95` : "Sampling…"}
    </output>
    <button disabled={!reading} type="button" className="mt-1 underline underline-offset-2 disabled:opacity-40" onClick={() => {
      if (reading) onBaseline(reading);
    }}>Save baseline</button>
  </>;
}

const toggles = [
  ["shadows", "Shadows"],
  ["softShadows", "Soft shadows"],
  ["ao", "Ambient occlusion"],
  ["bloom", "Bloom"],
  ["lighting", "Environment lighting"],
] as const;

export function GraphicsDebug({ settings, automatic, level, onChange, onReset, maxDpr, loadVersion }: {
  settings: GraphicsSettings;
  automatic: boolean;
  level: number;
  onChange: (settings: GraphicsSettings) => void;
  onReset: () => void;
  maxDpr: number;
  loadVersion: number;
}) {
  const [open, setOpen] = useState(false);
  const [baseline, setBaseline] = useState<Reading | null>(null);
  return (
    <aside aria-label="3D graphics debug" data-lenis-prevent className="pointer-events-auto fixed bottom-3 right-3 z-[100] rounded-md border border-border bg-background text-[11px] text-foreground" onKeyDown={(event) => event.stopPropagation()}>
      <button type="button" aria-expanded={open} aria-controls="graphics-debug-controls" className="flex min-h-8 w-full items-center justify-between gap-5 px-3" onClick={() => setOpen(!open)}>
        <span>3D graphics</span>{open ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
      </button>
      {open && <div id="graphics-debug-controls" className="max-h-[70dvh] w-56 overflow-y-auto border-t border-border p-3">
        <label className="mb-2 flex min-h-7 items-center justify-between gap-3">
          Automatic quality
          <input type="checkbox" checked={automatic} onChange={(event) => event.target.checked ? onReset() : onChange({ ...settings })} />
        </label>
        <p className="mb-2 text-muted-foreground">{automatic ? `Auto · level ${level}. Samples during motion.` : "Manual settings. Automatic changes paused."}</p>
        <label className="mb-2 flex items-center justify-between gap-2">
          Resolution
          <select aria-label="Rendering resolution" value={settings.dpr} onChange={(event) => onChange({ ...settings, dpr: Number(event.target.value) })} className="rounded border border-border bg-background px-1 py-1 text-foreground">
            <option value={0}>Device maximum (≤{maxDpr}×)</option>
            {[0.5, 0.75, 1, 1.5, 2].map((value) => <option key={value} value={value}>{value}×</option>)}
          </select>
        </label>
        {toggles.map(([key, label]) => <label key={key} className="flex min-h-7 items-center justify-between gap-3">
          {label}<input type="checkbox" checked={settings[key]} disabled={key === "softShadows" && !settings.shadows} onChange={(event) => onChange({ ...settings, [key]: event.target.checked })} />
        </label>)}
        <div className="mt-2 border-t border-border pt-2">
          <FrameMeter key={`${JSON.stringify(settings)}:${maxDpr}:${loadVersion}`} baseline={baseline} onBaseline={setBaseline} />
          {baseline && <p className="mt-1 text-muted-foreground">Saved: {baseline.fps.toFixed(1)} Page FPS / {baseline.p95.toFixed(1)} ms p95</p>}
          <p className="mt-2 leading-4 text-muted-foreground">Page frames, not GPU time. Compare in the same section. Samples restart after changes.</p>
          <button type="button" className="mt-2 flex min-h-7 items-center gap-1.5" onClick={() => { onReset(); setBaseline(null); }}><RotateCcw size={11} />Restart automatic quality</button>
        </div>
      </div>}
    </aside>
  );
}
