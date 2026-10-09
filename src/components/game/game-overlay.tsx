"use client";

import {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { Socket } from "socket.io-client";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { Loader2, Skull, Volume2, VolumeX, Trophy, X, Zap } from "lucide-react";
import { SocketContext } from "@/contexts/socketio";
import { usePerfProfile } from "@/hooks/use-perf-profile";
import { getAvatarUrl } from "@/lib/avatar";
import { cn } from "@/lib/utils";
import { gameTheme } from "./game-theme";
import { Game, HudStore, type Hud, type HudPlayer } from "./engine/game";
import { LeaderboardDialog } from "./leaderboard";
import { PingIndicator } from "./ping-indicator";
import { monitorGamePing } from "./engine/ping";
import { sfx } from "./engine/sfx";
import { collectPlayerProfiles } from "./player-profile";
import { MAX_PLAYERS, PLAYER_HP, WEAPONS } from "./protocol";

const iconButtonClass =
  "grid size-[44px] place-items-center rounded text-[color:var(--game-muted)] transition-colors hover:bg-white/10 hover:text-[color:var(--game-text)]";
const secondaryButtonClass =
  "flex min-h-11 items-center justify-center rounded px-3 text-sm text-[color:var(--game-muted)] transition-colors hover:bg-white/5 hover:text-[color:var(--game-text)]";
const rosterRowClass = "flex min-h-11 items-center justify-between gap-3 py-1";
const mutedClass = "text-sm leading-relaxed text-[color:var(--game-muted)]";

type Props = { socket: Socket; room: string | null; onClose: () => void };

export default function GameOverlay({ socket, room, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [store] = useState(() => new HudStore());
  const hud = useSyncExternalStore(store.subscribe, store.get, store.get);
  const { users } = useContext(SocketContext);
  const profiles = useMemo(() => collectPlayerProfiles(users), [users]);
  const { isMobile, maxDpr } = usePerfProfile();
  const reducedMotion = useReducedMotion();
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [failedRunId, setFailedRunId] = useState<string | null>(null);
  const [muted, setMuted] = useState(sfx.muted);

  useEffect(
    () => monitorGamePing(socket, (ping) => store.patch({ ping })),
    [socket, store],
  );

  useEffect(() => {
    if (!canvasRef.current) return;
    const game = new Game(canvasRef.current, socket, {
      room,
      maxDpr,
      shadows: !isMobile,
      hud: store,
      onExit: onClose,
      profiles: new Map(),
    });
    gameRef.current = game;
    return () => {
      game.dispose();
      gameRef.current = null;
    };
  }, [socket, room, maxDpr, isMobile, store, onClose]);

  useEffect(() => {
    gameRef.current?.updateProfiles(profiles);
  }, [profiles, socket, room, maxDpr, isMobile, store, onClose]);

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

  const me = hud.players.find((p) => p.me);
  const mates = hud.players.filter((p) => !p.me);
  const mateDown = !hud.down && mates.some((p) => p.down);
  const weapon = WEAPONS[hud.weapon] ?? WEAPONS[0];
  const playing = hud.status === "joined" && hud.phase === "playing";
  const touch = hud.touch || isMobile;

  return (
    <div
      className={cn(
        gameTheme,
        "fixed inset-0 z-[9999] select-none overflow-hidden bg-[color:var(--game-background)] font-sans text-[color:var(--game-text)] [&_button]:cursor-pointer [&_button]:touch-manipulation [&_button:focus-visible]:outline [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-4 [&_button:focus-visible]:outline-[color:var(--game-accent)] [&_button:disabled]:cursor-default [&_button:disabled]:opacity-[0.45] [&_button:active:not(:disabled)]:brightness-[0.85] motion-reduce:[&_*]:transition-none motion-reduce:[&_*]:animate-none",
      )}
      data-lenis-prevent
      data-no-custom-cursor="true"
      aria-label="Zombie Survival game"
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full cursor-crosshair touch-none"
        aria-label="Survival arena. Move with WASD or arrow keys, aim and fire with the mouse, and press Space to dash."
      />
      {hud.hurt > 0 && (
        <motion.div
          key={hud.hurt}
          initial={{ opacity: 0.75 }}
          animate={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.5 }}
          className="pointer-events-none absolute inset-0 shadow-[inset_0_0_140px_50px_rgba(220,38,38,0.6)]"
        />
      )}

      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 pt-[max(12px,env(safe-area-inset-top))] pl-[max(12px,env(safe-area-inset-left))] pr-[max(12px,env(safe-area-inset-right))] sm:p-5 sm:pt-[max(20px,env(safe-area-inset-top))] sm:pl-[max(20px,env(safe-area-inset-left))] sm:pr-[max(20px,env(safe-area-inset-right))]">
        <div className="min-w-0 rounded bg-[color:var(--game-panel)] px-3 py-2">
          {playing ? (
            <>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm tabular-nums">
                <strong className="font-semibold">Wave {hud.wave || 1}</strong>
                <span className="text-[color:var(--game-muted)]">
                  {hud.score.toLocaleString()} pts
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[color:var(--game-muted)]">
                <span>
                  {hud.next > 0
                    ? `Next wave in ${hud.next}s`
                    : `${hud.left} zombies left`}
                </span>
                <PingIndicator
                  ping={hud.ping}
                  className="[&>span:nth-child(2)]:hidden"
                />
              </div>
            </>
          ) : (
            <span className="break-all text-xs text-[color:var(--game-muted)]">
              {hud.room ? `Room ${hud.room}` : "Zombie Survival"}
            </span>
          )}
        </div>
        <div className="pointer-events-auto flex shrink-0 items-center gap-2 rounded bg-[color:var(--game-panel)]">
          {!playing && (
            <button
              className={iconButtonClass}
              onClick={() => setLeaderboardOpen(true)}
              aria-label="Open leaderboards"
              title="Leaderboards"
            >
              <Trophy size={18} />
            </button>
          )}
          <button
            className={iconButtonClass}
            onClick={() => setMuted(sfx.toggleMute())}
            aria-label={muted ? "Unmute game" : "Mute game"}
            aria-pressed={muted}
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button
            className={iconButtonClass}
            onClick={onClose}
            aria-label="Close game"
            title="Close game"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {playing && (
        <>
          {hud.boss >= 0 && (
            <div className="pointer-events-none absolute left-1/2 top-[92px] w-[min(200px,50vw)] -translate-x-1/2 rounded bg-[color:var(--game-panel)] px-3 py-2">
              <span className="mb-2 flex items-center gap-2 text-xs text-[color:var(--game-danger)]">
                <Skull size={14} /> Boss
              </span>
              <HealthBar value={hud.boss * 100} label="Boss health" danger />
            </div>
          )}
          <div className="pointer-events-none absolute left-[max(12px,env(safe-area-inset-left))] right-[max(12px,env(safe-area-inset-right))] bottom-[max(12px,env(safe-area-inset-bottom))] flex items-end justify-between gap-2 sm:left-[max(20px,env(safe-area-inset-left))] sm:right-[max(20px,env(safe-area-inset-right))] sm:bottom-[max(20px,env(safe-area-inset-bottom))]">
            <div className="w-[168px] rounded bg-[color:var(--game-panel)] p-[12px] sm:w-[208px]">
              {me && <PlayerIdentity player={me} compact />}
              <div className="mb-1.5 mt-3 flex items-center justify-between text-xs tabular-nums text-[color:var(--game-muted)]">
                <span>{hud.down ? "Down" : "HP"}</span>
                <span>
                  {Math.max(0, hud.hp)} / {PLAYER_HP}
                </span>
              </div>
              <HealthBar
                value={hud.hp}
                label="Your health"
                danger={hud.hp <= 35}
              />
              <div className="mt-2 flex justify-between gap-2 text-xs tabular-nums">
                <span>{weapon.name}</span>
                <span className="text-[color:var(--game-muted)]">
                  {hud.ammo < 0 ? "∞" : hud.ammo} ammo
                </span>
              </div>
              {!touch && (
                <p className="mt-2 text-xs text-[color:var(--game-muted)]">
                  {hud.dash ? "Space to dash" : "Dash recharging"}
                </p>
              )}
            </div>
            <div className="flex min-w-0 flex-col items-end gap-3">
              {mates.length > 0 && (
                <div className="w-[144px] rounded bg-[color:var(--game-panel)] px-[8px] py-1 sm:w-[200px] sm:px-[12px]">
                  {mates.map((p) => (
                    <div
                      key={p.id}
                      className="flex min-h-[40px] items-center justify-between gap-2"
                    >
                      <PlayerIdentity player={p} compact />
                      <span
                        className={cn(
                          "shrink-0 text-xs tabular-nums",
                          p.down
                            ? "text-[color:var(--game-danger)]"
                            : "text-[color:var(--game-muted)]",
                        )}
                      >
                        {p.down ? "Down" : `${p.hp}`}
                        {!p.down && <span className="sr-only"> HP</span>}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {touch && (
                <button
                  onClick={() => gameRef.current?.dash()}
                  disabled={!hud.dash || hud.down}
                  aria-label={hud.dash ? "Dash" : "Dash recharging"}
                  className="pointer-events-auto flex size-14 flex-col items-center justify-center gap-1 rounded-full bg-[color:var(--game-panel)] text-xs"
                >
                  <Zap size={18} />
                  <span>Dash</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {playing && hud.wave > 0 && (
        <motion.div
          key={hud.wave}
          initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
          animate={{ opacity: [0, 1, 1, 0], y: 0 }}
          transition={{ duration: 2.2, times: [0, 0.15, 0.7, 1] }}
          className="pointer-events-none absolute inset-x-0 top-[23%] text-center text-2xl font-semibold [text-shadow:0_3px_16px_#000]"
        >
          {hud.wave % 5 === 0 ? "Boss wave" : `Wave ${hud.wave}`}
        </motion.div>
      )}
      {hud.toastN > 0 && (
        <motion.div
          key={hud.toastN}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.6, times: [0, 0.15, 0.7, 1] }}
          className="pointer-events-none absolute inset-x-4 bottom-[30%] text-center text-base font-semibold text-[color:var(--game-accent)] [text-shadow:0_2px_8px_#000]"
          role="status"
        >
          {hud.toast}
        </motion.div>
      )}
      {playing && (hud.down || mateDown) && (
        <div
          className="pointer-events-none absolute left-1/2 top-[38%] w-max max-w-[calc(100%-32px)] -translate-x-1/2 rounded bg-[color:var(--game-panel)] px-4 py-3 text-[13px] leading-normal text-[color:var(--game-text)]"
          role="status"
        >
          {hud.down
            ? mates.length > 0
              ? "You're down. Wait for a revive or the next wave."
              : "You're down."
            : "Teammate down. Stand beside them to revive."}
        </div>
      )}

      {hud.status !== "joined" && (
        <Card>
          {hud.status === "full" ? (
            <>
              <h2 className="text-lg font-semibold">Room full</h2>
              <p className={cn(mutedClass, "mt-2")}>
                All {MAX_PLAYERS} spots are taken.
              </p>
              <PrimaryButton onClick={onClose}>Back</PrimaryButton>
            </>
          ) : hud.status === "failed" ? (
            <>
              <h2 className="text-lg font-semibold">Couldn&apos;t load game</h2>
              <p role="alert" className={cn(mutedClass, "mt-2")}>
                {hud.error}
              </p>
              <PrimaryButton onClick={onClose}>Back</PrimaryButton>
            </>
          ) : (
            <p
              className="flex items-center gap-3 text-sm text-[color:var(--game-muted)]"
              role="status"
            >
              <Loader2
                size={18}
                className="animate-spin motion-reduce:animate-none"
              />
              {hud.status === "loading" ? "Loading game..." : "Connecting..."}
            </p>
          )}
        </Card>
      )}
      {hud.status === "joined" && hud.phase === "lobby" && (
        <Lobby
          hud={{ ...hud, touch }}
          onStart={() => gameRef.current?.start()}
        />
      )}
      {hud.status === "joined" && hud.phase === "over" && (
        <Card>
          <h2 className="text-lg font-semibold">Game over</h2>
          <p className={cn(mutedClass, "mt-1 tabular-nums")}>
            Wave {hud.wave} · {hud.score.toLocaleString()} points
          </p>
          <div className="mt-4">
            {[...hud.players]
              .sort((a, b) => b.kills - a.kills)
              .map((p) => (
                <div key={p.id} className={rosterRowClass}>
                  <PlayerIdentity player={p} />
                  <span className="shrink-0 text-xs tabular-nums text-[color:var(--game-muted)]">
                    {p.kills} kills
                  </span>
                </div>
              ))}
          </div>
          {hud.best > 0 && (
            <p className="mt-3 text-xs text-[color:var(--game-muted)]">
              Server best: wave {hud.best}
            </p>
          )}
          {failedRunId !== null && failedRunId === hud.runId && (
            <p
              role="alert"
              className="mt-3 text-sm text-[color:var(--game-danger)]"
            >
              Your run couldn&apos;t be saved.
            </p>
          )}
          <PrimaryButton onClick={() => gameRef.current?.start()}>
            Play again
          </PrimaryButton>
        </Card>
      )}
      {leaderboardOpen && (
        <LeaderboardDialog
          socket={socket}
          onClose={() => setLeaderboardOpen(false)}
        />
      )}
    </div>
  );
}

function PlayerIdentity({
  player,
  compact = false,
}: {
  player: HudPlayer;
  compact?: boolean;
}) {
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
  return (
    <div className="flex min-w-0 items-center gap-[8px]">
      <span
        className={cn(
          "grid shrink-0 place-items-center overflow-hidden rounded-full border-2 font-bold text-[color:var(--game-avatar-ink)] [&_img]:block [&_img]:size-full [&_img]:object-cover",
          compact ? "size-[24px] basis-[24px]" : "size-8 basis-8",
        )}
        style={{ backgroundColor: player.color, borderColor: player.color }}
      >
        {player.avatar && failedAvatar !== player.avatar ? (
          <Image
            src={getAvatarUrl(encodeURIComponent(player.avatar))}
            alt=""
            width={36}
            height={36}
            unoptimized
            draggable={false}
            onError={() => setFailedAvatar(player.avatar ?? null)}
          />
        ) : (
          <span>{player.name.slice(0, 1).toUpperCase()}</span>
        )}
      </span>
      <span
        className={cn(
          "min-w-0 leading-normal",
          compact ? "truncate text-xs" : "text-sm [overflow-wrap:anywhere]",
        )}
        title={player.name}
      >
        {player.name}
      </span>
      {player.me && !compact && (
        <span className="shrink-0 text-xs text-[color:var(--game-muted)]">
          You
        </span>
      )}
    </div>
  );
}

function HealthBar({
  value,
  label,
  danger = false,
}: {
  value: number;
  label: string;
  danger?: boolean;
}) {
  const health = Math.max(0, Math.min(100, value));
  return (
    <div
      className="h-[5px] overflow-hidden bg-[color:var(--game-line)]"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={health}
    >
      <div
        className={cn(
          "h-full w-full origin-left transition-transform duration-150 ease-out motion-reduce:transition-none",
          danger
            ? "bg-[color:var(--game-danger)]"
            : "bg-[color:var(--game-accent)]",
        )}
        style={{ transform: `scaleX(${health / 100})` }}
      />
    </div>
  );
}

function Card({
  children,
  edge = false,
}: {
  children: React.ReactNode;
  edge?: boolean;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-[max(12px,env(safe-area-inset-bottom))] top-[max(76px,calc(env(safe-area-inset-top)+4rem))] flex justify-center pl-[max(12px,env(safe-area-inset-left))] pr-[max(12px,env(safe-area-inset-right))]",
        edge
          ? "items-end sm:items-center sm:justify-end sm:pr-[max(20px,env(safe-area-inset-right))]"
          : "items-center py-3",
      )}
    >
      <section
        className={cn(
          "pointer-events-auto max-h-full w-full max-w-[304px] overflow-y-auto overscroll-contain rounded-md bg-[color:var(--game-surface)]",
          edge
            ? "p-4 sm:max-w-[280px] sm:p-5 [@media(max-height:560px)]:p-4"
            : "p-5",
        )}
      >
        {children}
      </section>
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="mt-4 flex min-h-11 w-full items-center justify-center gap-3 rounded bg-[color:var(--game-accent)] px-3 py-2 text-sm font-semibold text-[color:var(--game-on-accent)] transition-colors hover:bg-[color:var(--game-accent-hover)]"
    >
      {children}
    </button>
  );
}

function Lobby({ hud, onStart }: { hud: Hud; onStart: () => void }) {
  const [inviteStatus, setInviteStatus] = useState<
    "idle" | "copied" | "failed"
  >("idle");
  useEffect(() => {
    if (inviteStatus === "idle") return;
    const timer = setTimeout(() => setInviteStatus("idle"), 3000);
    return () => clearTimeout(timer);
  }, [inviteStatus]);

  const copyInvite = async () => {
    if (!hud.room) return;
    try {
      const url = new URL("/", window.location.origin);
      url.searchParams.set("game", hud.room);
      await navigator.clipboard.writeText(url.href);
      setInviteStatus("copied");
    } catch {
      setInviteStatus("failed");
    }
  };

  return (
    <Card edge>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold">Zombie Survival</h2>
        <span className="shrink-0 text-xs tabular-nums text-[color:var(--game-muted)]">
          {hud.players.length}/{MAX_PLAYERS}
          <span className="sr-only"> players</span>
        </span>
      </div>
      <div className="mt-3 max-h-24 overflow-y-auto overscroll-contain sm:max-h-none [@media(max-height:560px)]:max-h-20">
        {hud.players.map((p) => (
          <div key={p.id} className={rosterRowClass}>
            <PlayerIdentity player={p} />
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-1 [@media(max-height:560px)]:grid-cols-2 [&>button]:mt-0">
        <PrimaryButton onClick={onStart}>
          Start game
          {!hud.touch && (
            <kbd className="text-xs font-normal opacity-60 [@media(max-height:560px)]:hidden">
              Enter
            </kbd>
          )}
        </PrimaryButton>
        <button
          onClick={copyInvite}
          disabled={!hud.room}
          className={cn(secondaryButtonClass, "w-full")}
        >
          <span aria-live="polite">
            {inviteStatus === "copied"
              ? "Link copied"
              : inviteStatus === "failed"
                ? "Copy failed. Try again"
                : "Copy invite link"}
          </span>
        </button>
      </div>
      <p
        className="mt-3 text-xs leading-relaxed text-[color:var(--game-muted)]"
        aria-label="Game controls"
      >
        {hud.touch
          ? "Drag to move. Shooting is automatic. Tap Dash to dodge."
          : "WASD move · Mouse aim & fire · Space dash"}
      </p>
      <PingIndicator
        ping={hud.ping}
        className="mt-3 [&>span:nth-child(2)]:hidden"
      />
    </Card>
  );
}
