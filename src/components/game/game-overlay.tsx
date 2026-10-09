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
import {
  ArrowRight,
  Check,
  Crosshair,
  Link2,
  Loader2,
  Skull,
  Volume2,
  VolumeX,
  Trophy,
  X,
  Zap,
} from "lucide-react";
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

const eyebrowClass =
  "block [font-family:'Courier_New',monospace] text-[11px] font-bold uppercase leading-[1.4] tracking-[0.12em] text-[color:var(--game-muted)] [@media(max-width:600px)]:text-[10px]";
const iconButtonClass =
  "grid size-11 place-items-center rounded-[4px] bg-transparent text-[color:var(--game-muted)] transition-colors duration-200 hover:bg-[color:var(--game-line)] hover:text-[color:var(--game-text)]";
const mateStatusClass =
  "shrink-0 whitespace-nowrap [font-family:'Courier_New',monospace] text-[11px] text-[color:var(--game-muted)]";
const rosterRowClass =
  "flex min-h-14 items-center justify-between gap-3 border-b border-[color:var(--game-line)] py-2 [@media(max-height:560px)_and_(min-width:601px)]:min-h-11 [@media(max-height:560px)_and_(min-width:601px)]:py-1";
const secondaryButtonClass =
  "mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-[3px] border border-[color:var(--game-line)] bg-transparent p-3 text-sm font-semibold text-[color:var(--game-muted)] transition-colors duration-200 hover:bg-[color:var(--game-line)] hover:text-[color:var(--game-text)]";
const headingClass =
  "mb-3 mt-4 font-display text-[25px] leading-[1.35] tracking-[-0.03em] [@media(max-height:560px)_and_(min-width:601px)]:my-2 [@media(max-height:560px)_and_(min-width:601px)]:text-[20px]";
const descriptionClass =
  "text-sm leading-[1.65] text-[color:var(--game-muted)]";

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

      <header className="absolute inset-x-0 top-0 flex items-center justify-between gap-4 border-b border-[color:var(--game-line)] bg-[color:var(--game-panel)] pb-3 pt-[max(12px,env(safe-area-inset-top))] pl-[max(20px,env(safe-area-inset-left))] pr-[max(20px,env(safe-area-inset-right))] [@media(max-width:600px)]:gap-2 [@media(max-width:600px)]:pl-[max(12px,env(safe-area-inset-left))] [@media(max-width:600px)]:pr-[max(12px,env(safe-area-inset-right))]">
        <div className="flex min-w-0 items-center gap-3 [@media(max-width:600px)]:gap-2 [&>svg]:shrink-0 [&>svg]:text-[color:var(--game-accent)] [@media(max-width:600px)]:[&>svg]:hidden">
          <Skull size={20} aria-hidden="true" />
          <div>
            <span className={eyebrowClass}>
              {playing ? "Survival in progress" : "Co-op survival"}
            </span>
            <div className="text-sm font-semibold leading-[1.6] [@media(max-width:600px)]:text-xs [@media(max-width:600px)]:leading-[1.6]">
              {playing
                ? `Wave ${String(hud.wave || 1).padStart(2, "0")}`
                : "Zombie Survival"}
            </div>
          </div>
          {playing && (
            <span className="border-l border-[color:var(--game-line)] pl-4 text-xs text-[color:var(--game-muted)] [@media(max-width:600px)]:hidden">
              {hud.next > 0
                ? `Next wave in ${hud.next}s`
                : `${hud.left} remaining`}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <PingIndicator
            ping={hud.ping}
            className="mr-3 [@media(max-width:600px)]:hidden"
          />
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
            <X size={20} />
          </button>
        </div>
      </header>

      {playing && (
        <>
          {hud.boss >= 0 && (
            <div className="pointer-events-none absolute left-1/2 top-[94px] w-[min(280px,45vw)] -translate-x-1/2 [@media(max-width:600px)]:left-4 [@media(max-width:600px)]:top-[90px] [@media(max-width:600px)]:w-[45%] [@media(max-width:600px)]:translate-x-0 [&>span]:mb-2 [&>span]:flex [&>span]:items-center [&>span]:justify-center [&>span]:gap-2 [&>span]:text-[11px] [&>span]:uppercase [&>span]:tracking-[0.12em] [&>span]:text-[color:var(--game-danger)]">
              <span>
                <Skull size={14} /> Boss
              </span>
              <HealthBar value={hud.boss * 100} label="Boss health" danger />
            </div>
          )}
          <div className="pointer-events-none absolute right-6 top-[100px] text-right [@media(max-width:600px)]:right-4 [@media(max-width:600px)]:top-[86px] [&>strong]:[font-family:'Courier_New',monospace] [&>strong]:text-[28px] [&>strong]:font-normal [&>strong]:tabular-nums [@media(max-width:600px)]:[&>strong]:text-[22px]">
            <span className={eyebrowClass}>Squad score</span>
            <strong>{hud.score.toLocaleString()}</strong>
          </div>
          <div className="pointer-events-none absolute inset-x-5 bottom-[max(20px,env(safe-area-inset-bottom))] flex items-end justify-between gap-4 [@media(max-width:600px)]:inset-x-3 [@media(max-width:600px)]:bottom-[max(12px,env(safe-area-inset-bottom))] [@media(max-width:600px)]:gap-2">
            <div className="w-[248px] max-w-full rounded-[4px] border border-[color:var(--game-line)] bg-[color:var(--game-panel)] p-4 [@media(max-width:600px)]:w-[188px] [@media(max-width:600px)]:p-3 [@media(max-height:560px)_and_(min-width:601px)]:p-3">
              {me && <PlayerIdentity player={me} />}
              <div className="mb-1.5 mt-3.5 flex justify-between text-[11px] tabular-nums text-[color:var(--game-muted)]">
                <span>{hud.down ? "Down · awaiting revive" : "Health"}</span>
                <span>
                  {Math.max(0, hud.hp)} / {PLAYER_HP}
                </span>
              </div>
              <HealthBar
                value={hud.hp}
                label="Your health"
                danger={hud.hp <= 35}
              />
              <div className="mt-3 flex items-center justify-between gap-2 text-[13px] tabular-nums [&>span:first-child]:flex [&>span:first-child]:items-center [&>span:first-child]:gap-2 [&_small]:text-[11px] [&_small]:text-[color:var(--game-muted)]">
                <span>
                  <Crosshair size={15} />
                  {weapon.name}
                </span>
                <span>
                  {hud.ammo < 0 ? "∞" : hud.ammo} <small>ammo</small>
                </span>
              </div>
              {!touch && (
                <div
                  className={cn(
                    "mt-3 flex items-center gap-1.5 text-[11px] [&_kbd]:[font-family:'Courier_New',monospace] [&_kbd]:text-[10px] [&_kbd]:text-[color:var(--game-text)]",
                    hud.dash
                      ? "text-[color:var(--game-accent)]"
                      : "text-[color:var(--game-muted)]",
                  )}
                >
                  <Zap size={13} />
                  <kbd>Space</kbd>
                  <span>{hud.dash ? "Dash ready" : "Recharging"}</span>
                </div>
              )}
            </div>
            <div className="flex min-w-0 flex-col items-end gap-3">
              {mates.length > 0 && (
                <div className="max-w-[240px] rounded-[4px] border border-[color:var(--game-line)] bg-[color:var(--game-panel)] px-3 py-1 [@media(max-width:600px)]:w-[140px] [@media(max-width:600px)]:max-w-full [@media(max-width:600px)]:px-2">
                  {mates.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-4 py-2 [&+div]:border-t [&+div]:border-[color:var(--game-line)] [@media(max-width:600px)]:flex-wrap [@media(max-width:600px)]:gap-2"
                    >
                      <PlayerIdentity player={p} compact />
                      <span
                        className={cn(
                          mateStatusClass,
                          "[@media(max-width:600px)]:ml-[38px]",
                          p.down && "text-[color:var(--game-danger)]",
                        )}
                      >
                        {p.down ? "Down" : `${p.hp} HP`}
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
                  className="pointer-events-auto flex size-16 flex-col items-center justify-center gap-1 rounded-full border border-[color:var(--game-accent)] bg-[color:var(--game-panel)] text-[11px] text-[color:var(--game-accent)]"
                >
                  <Zap size={22} />
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
          className="pointer-events-none absolute inset-x-0 top-[23%] text-center font-display text-[clamp(24px,4vw,48px)] [text-shadow:0_3px_16px_#000]"
        >
          {hud.wave % 5 === 0
            ? "Boss wave"
            : `Wave ${String(hud.wave).padStart(2, "0")}`}
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
          className="pointer-events-none absolute left-1/2 top-[38%] w-max max-w-[calc(100%-32px)] -translate-x-1/2 border-l-[3px] border-[color:var(--game-danger)] bg-[color:var(--game-panel)] px-4 py-3 text-[13px] leading-normal text-[color:var(--game-text)]"
          role="status"
        >
          {hud.down
            ? mates.length > 0
              ? "You're down. Stay alive as a squad to recover, or wait for a revive."
              : "You're down."
            : "Teammate down. Stand beside them to revive."}
        </div>
      )}

      {hud.status !== "joined" && (
        <Card>
          <span className={eyebrowClass}>Zombie Survival</span>
          {hud.status === "full" ? (
            <>
              <h2 className={headingClass}>Squad is full.</h2>
              <p className={descriptionClass}>
                This room already has {MAX_PLAYERS} survivors. Head back and
                join another squad.
              </p>
              <PrimaryButton onClick={onClose}>Back to portfolio</PrimaryButton>
            </>
          ) : hud.status === "failed" ? (
            <>
              <h2 className={headingClass}>Couldn&apos;t load game.</h2>
              <p role="alert" className={descriptionClass}>
                {hud.error}
              </p>
              <PrimaryButton onClick={onClose}>Back to portfolio</PrimaryButton>
            </>
          ) : (
            <div
              className="mt-5 flex items-center gap-3 text-sm text-[color:var(--game-muted)] [&>svg]:animate-spin motion-reduce:[&>svg]:animate-none"
              role="status"
            >
              <Loader2 size={20} />
              <span>
                {hud.status === "loading"
                  ? "Preparing the arena…"
                  : "Finding your squad…"}
              </span>
            </div>
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
          <span className={eyebrowClass}>Run complete</span>
          <h2 className={headingClass}>Overrun.</h2>
          <p className={descriptionClass}>
            The horde wins this one. Take a breath. Try again.
          </p>
          <div className="my-6 grid grid-cols-2 gap-4 [&_strong]:block [&_strong]:[font-family:'Courier_New',monospace] [&_strong]:text-[32px] [&_strong]:font-normal [&_strong]:tabular-nums">
            <div>
              <span className={eyebrowClass}>Wave reached</span>
              <strong>{String(hud.wave).padStart(2, "0")}</strong>
            </div>
            <div>
              <span className={eyebrowClass}>Squad score</span>
              <strong>{hud.score.toLocaleString()}</strong>
            </div>
          </div>
          <div className="border-t border-[color:var(--game-line)]">
            {[...hud.players]
              .sort((a, b) => b.kills - a.kills)
              .map((p) => (
                <div key={p.id} className={rosterRowClass}>
                  <PlayerIdentity player={p} />
                  <span className={mateStatusClass}>{p.kills} kills</span>
                </div>
              ))}
          </div>
          {hud.best > 0 && (
            <p className="mt-4 text-xs leading-[1.65] text-[color:var(--game-muted)]">
              Server record · wave {hud.best}
            </p>
          )}
          {failedRunId !== null && failedRunId === hud.runId && (
            <p
              role="alert"
              className={cn(
                descriptionClass,
                "text-[color:var(--game-danger)]",
              )}
            >
              Your run couldn&apos;t be saved to the leaderboard.
            </p>
          )}
          <PrimaryButton onClick={() => gameRef.current?.start()}>
            Play again <ArrowRight size={18} />
          </PrimaryButton>
          <button
            className={secondaryButtonClass}
            onClick={() => setLeaderboardOpen(true)}
          >
            <Trophy size={16} /> View leaderboards
          </button>
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
    <div className="flex min-w-0 items-center gap-2.5">
      <span
        className={cn(
          "grid shrink-0 place-items-center overflow-hidden rounded-full border-2 font-bold text-[color:var(--game-avatar-ink)] [&_img]:block [&_img]:size-full [&_img]:object-cover",
          compact ? "size-7 basis-7" : "size-9 basis-9",
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
          "min-w-0 font-semibold leading-[1.3] [overflow-wrap:anywhere]",
          compact ? "text-xs" : "text-sm",
        )}
        title={player.name}
      >
        {player.name}
      </span>
      {player.me && (
        <span className="shrink-0 [font-family:'Courier_New',monospace] text-[10px] uppercase text-[color:var(--game-accent)]">
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
  lobby = false,
}: {
  children: React.ReactNode;
  lobby?: boolean;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-4 top-[84px] flex items-center justify-center p-4 [@media(max-width:600px)]:bottom-[max(12px,env(safe-area-inset-bottom))] [@media(max-width:600px)]:top-[76px] [@media(max-height:560px)_and_(min-width:601px)]:bottom-2 [@media(max-height:560px)_and_(min-width:601px)]:top-[76px] [@media(max-height:560px)_and_(min-width:601px)]:py-2",
        lobby &&
          "justify-start pl-[clamp(20px,4vw,64px)] [@media(max-width:600px)]:justify-center [@media(max-width:600px)]:p-3 [@media(max-height:560px)_and_(min-width:601px)]:[&_h2_br]:hidden",
      )}
    >
      <section className="pointer-events-auto max-h-full w-[360px] max-w-full overflow-y-auto overscroll-contain rounded-[4px] border border-[color:var(--game-line)] border-t-[3px] border-t-[color:var(--game-accent)] bg-[color:var(--game-panel)] p-6 shadow-[0_16px_48px_#0004] [@media(max-width:600px)]:w-[340px] [@media(max-width:600px)]:p-5 [@media(max-height:560px)_and_(min-width:601px)]:w-[420px] [@media(max-height:560px)_and_(min-width:601px)]:px-5 [@media(max-height:560px)_and_(min-width:601px)]:py-4">
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
      className="mt-5 flex min-h-12 w-full items-center justify-between gap-2 rounded-[3px] bg-[color:var(--game-accent)] p-3 text-sm font-semibold text-[color:var(--game-on-accent)] transition-colors duration-200 hover:bg-[color:var(--game-accent-hover)] [@media(max-height:560px)_and_(min-width:601px)]:mt-3"
    >
      {children}
    </button>
  );
}

function Lobby({ hud, onStart }: { hud: Hud; onStart: () => void }) {
  const openSpots = Math.max(0, MAX_PLAYERS - hud.players.length);
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
    <Card lobby>
      <div className="flex items-baseline justify-between gap-3">
        <span className={eyebrowClass}>The graveyard</span>
        <span className="[font-family:'Courier_New',monospace] text-[11px] text-[color:var(--game-muted)]">
          Room {hud.room}
        </span>
      </div>
      <h2 className={headingClass}>
        Stay together.
        <br />
        Stay alive.
      </h2>
      <p className={descriptionClass}>
        Hold off the horde with your squad. Each wave hits harder. Every fifth
        brings a boss.
      </p>
      <div className="mb-2 mt-6 flex items-baseline justify-between [@media(max-height:560px)_and_(min-width:601px)]:mt-3 [&>span:last-child]:[font-family:'Courier_New',monospace] [&>span:last-child]:text-xs [&>span:last-child]:text-[color:var(--game-muted)]">
        <span className={eyebrowClass}>Your squad</span>
        <span>
          {hud.players.length} / {MAX_PLAYERS}
        </span>
      </div>
      <div className="border-t border-[color:var(--game-line)]">
        {hud.players.map((p) => (
          <div key={p.id} className={rosterRowClass}>
            <PlayerIdentity player={p} />
            <span className={mateStatusClass}>Ready</span>
          </div>
        ))}
        {openSpots > 0 && (
          <div className="flex items-center gap-2.5 py-3 text-xs text-[color:var(--game-muted)] [@media(max-height:560px)_and_(min-width:601px)]:py-1.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full border border-dashed border-[color:var(--game-line)] text-xl">
              +
            </span>
            <span>
              {openSpots} open {openSpots === 1 ? "spot" : "spots"} · invite a
              friend
            </span>
          </div>
        )}
      </div>
      <PrimaryButton onClick={onStart}>
        Start surviving{" "}
        <span className="text-[11px] font-normal">
          {hud.touch ? <ArrowRight size={18} /> : <kbd>Enter ↵</kbd>}
        </span>
      </PrimaryButton>
      <button
        onClick={copyInvite}
        disabled={!hud.room}
        className={secondaryButtonClass}
      >
        {inviteStatus === "copied" ? <Check size={16} /> : <Link2 size={16} />}
        <span aria-live="polite">
          {inviteStatus === "copied"
            ? "Invite link copied"
            : inviteStatus === "failed"
              ? "Copy failed · try again"
              : "Copy invite link"}
        </span>
      </button>
      <div
        className="mt-5 grid grid-cols-2 gap-3 border-t border-[color:var(--game-line)] pt-4 text-[11px] text-[color:var(--game-muted)] [@media(max-height:560px)_and_(min-width:601px)]:mt-3 [@media(max-height:560px)_and_(min-width:601px)]:grid-cols-3 [@media(max-height:560px)_and_(min-width:601px)]:pt-3 [&>span]:flex [&>span]:items-center [&>span]:gap-2 [&_kbd]:[font-family:'Courier_New',monospace] [&_kbd]:text-[10px] [&_kbd]:text-[color:var(--game-text)] [&>p]:col-span-full [&>p]:text-xs [&>p]:leading-[1.65]"
        aria-label="Game controls"
      >
        {hud.touch ? (
          <p className={descriptionClass}>
            Drag the arena to move. Aim and fire are automatic. Tap Dash to
            escape.
          </p>
        ) : (
          <>
            <span>
              <kbd>W A S D</kbd> Move
            </span>
            <span>
              <kbd>Mouse</kbd> Aim + fire
            </span>
            <span>
              <kbd>Space</kbd> Dash
            </span>
          </>
        )}
      </div>
    </Card>
  );
}
