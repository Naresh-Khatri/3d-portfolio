"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Socket } from "socket.io-client";
import { motion } from "motion/react";
import { Check, Link2, Skull, Volume2, VolumeX, Trophy, X, Zap } from "lucide-react";
import { usePerfProfile } from "@/hooks/use-perf-profile";
import { cn } from "@/lib/utils";
import { Game, HudStore, type Hud } from "./engine/game";
import { LeaderboardDialog } from "./leaderboard";
import { PingIndicator } from "./ping-indicator";
import { monitorGamePing } from "./engine/ping";
import { sfx } from "./engine/sfx";
import { MAX_PLAYERS, PLAYER_HP, WEAPONS } from "./protocol";

type Props = { socket: Socket; room: string | null; onClose: () => void };

const panel = "rounded-xl border border-white/10 bg-black/55 backdrop-blur-md";
const key = "rounded border border-white/20 bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-white/90";

export default function GameOverlay({ socket, room, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [store] = useState(() => new HudStore());
  const hud = useSyncExternalStore(store.subscribe, store.get, store.get);
  const { isMobile, maxDpr } = usePerfProfile();
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [failedRunId, setFailedRunId] = useState<string | null>(null);
  const [muted, setMuted] = useState(sfx.muted);

  useEffect(() => monitorGamePing(socket, (ping) => store.patch({ ping })), [socket, store]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const game = new Game(canvasRef.current, socket, { room, maxDpr, shadows: !isMobile, hud: store, onExit: onClose });
    gameRef.current = game;
    return () => {
      game.dispose();
      gameRef.current = null;
    };
  }, [socket, room, maxDpr, isMobile, store, onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    gameRef.current?.suspendControls(leaderboardOpen);
  }, [leaderboardOpen]);

  useEffect(() => {
    const failed = ({ runId }: { runId: string }) => setFailedRunId(runId);
    socket.on("game:save-failed", failed);
    return () => {
      socket.off("game:save-failed", failed);
    };
  }, [socket]);

  const weapon = WEAPONS[hud.weapon] ?? WEAPONS[0];
  const hpPct = Math.max(0, Math.min(100, (hud.hp / PLAYER_HP) * 100));
  const mates = hud.players.filter((p) => !p.me);
  const mateDown = !hud.down && mates.some((p) => p.down);

  return (
    <div
      className="fixed inset-0 z-[9999] select-none overflow-hidden bg-[#07080d] font-sans text-white"
      data-lenis-prevent
      data-no-custom-cursor="true"
    >
      <canvas ref={canvasRef} className="block h-full w-full cursor-crosshair touch-none" />

      {hud.hurt > 0 && (
        <motion.div
          key={hud.hurt}
          initial={{ opacity: 0.75 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="pointer-events-none absolute inset-0 shadow-[inset_0_0_140px_50px_rgba(220,38,38,0.6)]"
        />
      )}

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex shrink-0 flex-col items-start gap-2">
            <div className={cn(panel, "px-4 py-2")}>
              {hud.phase === "lobby" ? (
                <div className="font-display text-sm tracking-wide">Zombie Survival</div>
              ) : (
                <>
                  <div className="font-display text-lg leading-tight">Wave {hud.wave || 1}</div>
                  <div className="text-xs text-white/60">
                    {hud.next > 0 ? `Next wave in ${hud.next}s` : `${hud.left} zombies left`}
                  </div>
                </>
              )}
            </div>
            <PingIndicator ping={hud.ping} className={cn(panel, "px-3 py-1.5")} />
          </div>

          {hud.boss >= 0 && hud.phase === "playing" && (
            <div className="mt-1 w-full max-w-md">
              <div className="mb-1 flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-rose-300">
                <Skull className="h-3.5 w-3.5" /> Boss
              </div>
              <div className="h-2.5 overflow-hidden rounded-full border border-white/15 bg-black/60">
                <div className="h-full bg-rose-500 transition-[width] duration-150" style={{ width: `${hud.boss * 100}%` }} />
              </div>
            </div>
          )}

          <div className="pointer-events-auto flex items-center gap-2">
            {hud.status === "joined" && hud.phase !== "playing" && (
              <button
                onClick={() => setLeaderboardOpen(true)}
                aria-label="Open leaderboards"
                className={cn(panel, "p-2.5 transition-colors hover:bg-white/15")}
              >
                <Trophy className="h-4 w-4 text-amber-300" />
              </button>
            )}
            {hud.phase !== "lobby" && (
              <div className={cn(panel, "px-4 py-2 text-right")}>
                <div className="font-display text-lg leading-tight tabular-nums">{hud.score}</div>
                <div className="text-xs text-white/60">score</div>
              </div>
            )}
            <button
              onClick={() => setMuted(sfx.toggleMute())}
              aria-label={muted ? "Unmute" : "Mute"}
              className={cn(panel, "p-2.5 transition-colors hover:bg-white/15")}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button onClick={onClose} aria-label="Close game" className={cn(panel, "p-2.5 transition-colors hover:bg-white/15")}>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className={cn(panel, "w-56 px-4 py-3")}>
            <div className="mb-1.5 flex items-baseline justify-between text-sm">
              <span className="font-semibold">{weapon.name}</span>
              <span className="tabular-nums text-white/70">{hud.ammo < 0 ? "∞" : hud.ammo}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
              <div
                className={cn("h-full transition-[width] duration-150", hpPct > 35 ? "bg-emerald-400" : "bg-red-500")}
                style={{ width: `${hpPct}%` }}
              />
            </div>
            {!hud.touch && (
              <div className={cn("mt-2 flex items-center gap-1 text-[11px]", hud.dash ? "text-sky-300" : "text-white/35")}>
                <Zap className="h-3 w-3" /> Dash {hud.dash ? "ready" : "recharging"}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            {mates.length > 0 && (
              <div className={cn(panel, "space-y-1.5 px-3 py-2")}>
                {mates.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 text-xs">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.color }} />
                    <span className={cn("max-w-24 truncate", p.down && "text-red-400 line-through")}>{p.name}</span>
                    <div className="h-1.5 w-14 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full bg-emerald-400" style={{ width: `${p.down ? 0 : (p.hp / PLAYER_HP) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {hud.touch && (
              <button
                onPointerDown={() => gameRef.current?.dash()}
                disabled={!hud.dash}
                aria-label="Dash"
                className={cn(
                  panel,
                  "pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full transition-opacity",
                  !hud.dash && "opacity-40"
                )}
              >
                <Zap className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>
      </div>

      {hud.phase === "playing" && hud.wave > 0 && (
        <motion.div
          key={hud.wave}
          initial={{ opacity: 0, scale: 1.4 }}
          animate={{ opacity: [0, 1, 1, 0], scale: 1 }}
          transition={{ duration: 2.2, times: [0, 0.15, 0.7, 1] }}
          className="pointer-events-none absolute inset-x-0 top-[22%] text-center font-display text-4xl font-bold tracking-wider sm:text-6xl"
        >
          {hud.wave % 5 === 0 ? <span className="text-rose-400">Boss wave</span> : `Wave ${hud.wave}`}
        </motion.div>
      )}

      {hud.toastN > 0 && (
        <motion.div
          key={hud.toastN}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: [0, 1, 1, 0], y: 0 }}
          transition={{ duration: 1.6, times: [0, 0.15, 0.7, 1] }}
          className="pointer-events-none absolute inset-x-0 bottom-[30%] text-center text-lg font-semibold text-amber-300"
        >
          {hud.toast}
        </motion.div>
      )}

      {hud.phase === "playing" && (hud.down || mateDown) && (
        <div className="pointer-events-none absolute inset-x-0 top-[38%] text-center">
          <span className={cn(panel, "inline-block px-4 py-2 text-sm", hud.down ? "text-red-300" : "text-emerald-300")}>
            {hud.down
              ? mates.length > 0
                ? "You're down. A teammate can revive you, or survive the wave."
                : "You're down."
              : "Teammate down. Stand next to them to revive."}
          </span>
        </div>
      )}

      {hud.status !== "joined" && (
        <Card>
          {hud.status === "full" ? (
            <>
              <h2 className="font-display text-xl">Room is full</h2>
              <p className="mt-2 text-sm text-white/60">That room already has {MAX_PLAYERS} players.</p>
              <PrimaryButton onClick={onClose}>Back</PrimaryButton>
            </>
          ) : hud.status === "failed" ? (
            <>
              <h2 className="font-display text-xl">Couldn&apos;t load the game</h2>
              <p className="mt-2 text-sm text-white/60">{hud.error}</p>
              <PrimaryButton onClick={onClose}>Back</PrimaryButton>
            </>
          ) : (
            <p className="animate-pulse text-sm text-white/70">
              {hud.status === "loading" ? "Loading game models…" : "Connecting to game server…"}
            </p>
          )}
        </Card>
      )}

      {hud.status === "joined" && hud.phase === "lobby" && (
        <Lobby hud={hud} onLeaderboard={() => setLeaderboardOpen(true)} onStart={() => gameRef.current?.start()} />
      )}

      {hud.status === "joined" && hud.phase === "over" && (
        <Card>
          <h2 className="font-display text-2xl text-rose-400">Overrun</h2>
          <p className="mt-2 text-sm text-white/70">
            Reached wave <b className="text-white">{hud.wave}</b> with <b className="text-white">{hud.score}</b> points
          </p>
          {hud.best > 0 && <p className="mt-1 text-xs text-white/45">Best wave on this server: {hud.best}</p>}
          <div className="mt-4 space-y-1 text-left text-sm">
            {[...hud.players]
              .sort((a, b) => b.kills - a.kills)
              .map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                  <span className="flex-1 truncate">{p.me ? `${p.name} (you)` : p.name}</span>
                  <span className="tabular-nums text-white/60">{p.kills} kills</span>
                </div>
              ))}
          </div>
          {failedRunId !== null && failedRunId === hud.runId && (
            <p role="alert" className="mt-3 text-xs text-rose-300">
              Your run couldn&apos;t be saved to the leaderboard.
            </p>
          )}
          <PrimaryButton onClick={() => gameRef.current?.start()}>Play again</PrimaryButton>
          <LeaderboardButton onClick={() => setLeaderboardOpen(true)} />
        </Card>
      )}
      {leaderboardOpen && <LeaderboardDialog socket={socket} onClose={() => setLeaderboardOpen(false)} />}
    </div>
  );
}

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("pointer-events-none absolute inset-0 flex items-center justify-center p-4", className)}>
    <div className={cn(panel, "pointer-events-auto max-h-[calc(100dvh-8rem)] w-full max-w-sm overflow-y-auto p-6 text-center")}>{children}</div>
  </div>
);

const PrimaryButton = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="mt-5 w-full rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black transition-transform hover:scale-[1.02] active:scale-[0.98]"
  >
    {children}
  </button>
);

// off-center so the arena stays playable behind it
const Lobby = ({ hud, onStart, onLeaderboard }: { hud: Hud; onStart: () => void; onLeaderboard: () => void }) => {
  const [copied, setCopied] = useState(false);

  const copyInvite = async () => {
    if (!hud.room) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/?game=${hud.room}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <Card className="items-end pb-28 sm:items-center sm:justify-end sm:pb-4 sm:pr-10">
      <h2 className="font-display text-xl">Zombie Survival</h2>
      <p className="mt-1 text-sm text-white/60">
        Co-op waves, up to {MAX_PLAYERS} players. Boss every 5th wave.
      </p>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {hud.players.map((p) => (
          <span key={p.id} className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            {p.me ? `${p.name} (you)` : p.name}
          </span>
        ))}
      </div>

      {hud.touch ? (
        <p className="mt-4 text-xs text-white/55">Drag anywhere to move. Aiming and firing are automatic.</p>
      ) : (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs text-white/55">
          <span><kbd className={key}>WASD</kbd> move</span>
          <span><kbd className={key}>Mouse</kbd> aim + fire</span>
          <span><kbd className={key}>Space</kbd> dash</span>
          <span><kbd className={key}>Esc</kbd> quit</span>
        </div>
      )}

      <LeaderboardButton onClick={onLeaderboard} />
      <PrimaryButton onClick={onStart}>{hud.touch ? "Start" : "Start (Enter)"}</PrimaryButton>
      <button
        onClick={copyInvite}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/10"
      >
        {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Link2 className="h-4 w-4" />}
        {copied ? "Link copied" : "Copy invite link"}
      </button>
    </Card>
  );
};

const LeaderboardButton = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-amber-300/20 bg-amber-300/5 px-4 py-2 text-sm text-amber-200 transition-colors hover:bg-amber-300/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300">
    <Trophy className="h-4 w-4" /> Leaderboards
  </button>
);
