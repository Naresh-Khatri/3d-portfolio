"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { RefreshCw, Trophy, X } from "lucide-react";
import type { Socket } from "socket.io-client";
import { cn } from "@/lib/utils";
import { PingIndicator } from "./ping-indicator";
import type { GamePing } from "./engine/ping";
import type {
  Leaderboard,
  LeaderboardEntry,
  LeaderboardPeriod,
  LeaderboardReply,
} from "./protocol";

export function LeaderboardDialog({
  socket,
  ping,
  onClose,
}: {
  socket: Socket;
  ping: GamePing;
  onClose: () => void;
}) {
  const [period, setPeriod] = useState<LeaderboardPeriod>("all");
  const [data, setData] = useState<Leaderboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const request = useRef(0);
  const inFlight = useRef(false);
  const refreshAgain = useRef(false);

  const load = useCallback(
    function fetchLeaderboard() {
      if (inFlight.current) {
        refreshAgain.current = true;
        return;
      }
      const id = ++request.current;
      if (!socket.connected) {
        setError("You're offline. Reconnect to see the leaderboard.");
        setLoading(false);
        return;
      }
      inFlight.current = true;
      setLoading(true);
      setError(null);
      socket
        .timeout(10_000)
        .emit(
          "game:leaderboard",
          { period },
          (timeout: Error | null, result: LeaderboardReply) => {
            if (request.current !== id) return;
            inFlight.current = false;
            setLoading(false);
            if (timeout || !result)
              setError("The leaderboard didn't respond. Try again.");
            else if ("error" in result) setError(result.error);
            else setData(result.data);
            if (refreshAgain.current) {
              refreshAgain.current = false;
              fetchLeaderboard();
            }
          },
        );
    },
    [socket, period],
  );

  useEffect(() => {
    inFlight.current = false;
    refreshAgain.current = false;
    setData(null);
    load();
    const offline = () => {
      request.current++;
      inFlight.current = false;
      refreshAgain.current = false;
      setError("You're offline. Reconnect to see the leaderboard.");
      setLoading(false);
    };
    socket.on("connect", load);
    socket.on("game:joined", load);
    socket.on("disconnect", offline);
    socket.on("game:leaderboard-updated", load);
    const invalidate = () => {
      request.current++;
    };
    return () => {
      invalidate();
      socket.off("connect", load);
      socket.off("game:joined", load);
      socket.off("disconnect", offline);
      socket.off("game:leaderboard-updated", load);
    };
  }, [socket, load]);

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[10001] flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#0c1018] font-sans text-white shadow-2xl focus:outline-none"
          data-lenis-prevent
          data-no-custom-cursor="true"
        >
          <div className="border-b border-white/10 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-amber-300">
                <Trophy className="h-4 w-4" /> Survival records
              </span>
              <Dialog.Close
                aria-label="Close leaderboard"
                className="rounded-lg p-2 text-white/60 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300"
              >
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>
            <Dialog.Title className="mt-3 font-display text-3xl">
              Leaderboards
            </Dialog.Title>
            <PingIndicator ping={ping} className="mt-3 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5" />
            <Dialog.Description className="mt-2 text-xs leading-relaxed text-white/60">
              Top 20 team runs, ranked by wave reached, then score. Ties go to
              the earlier run. Solo runs count too.
            </Dialog.Description>
            <div className="mt-5 flex items-center gap-2">
              {(
                [
                  ["all", "All time"],
                  ["week", "This week"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setPeriod(value)}
                  aria-pressed={period === value}
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300",
                    period === value
                      ? "bg-amber-300 text-black"
                      : "bg-white/5 text-white/60 hover:bg-white/10",
                  )}
                >
                  {label}
                </button>
              ))}
              <button
                onClick={load}
                disabled={loading}
                aria-label="Refresh leaderboard"
                className="ml-auto rounded-lg p-2 text-white/60 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300 disabled:opacity-40"
              >
                <RefreshCw
                  className={cn(
                    "h-4 w-4",
                    loading && "animate-spin motion-reduce:animate-none",
                  )}
                />
              </button>
            </div>
            {period === "week" && (
              <p className="mt-2 text-[11px] text-white/45">
                This week starts Monday at 00:00 UTC.
              </p>
            )}
          </div>

          <div
            className="min-h-0 overflow-y-auto p-5 sm:p-6"
            aria-busy={loading}
          >
            {error ? (
              <div role="alert" className="py-8 text-center">
                <p className="text-sm text-rose-300">{error}</p>
                <button
                  onClick={load}
                  className="mt-4 rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
                >
                  Try again
                </button>
              </div>
            ) : loading && !data ? (
              <p
                role="status"
                className="py-12 text-center text-sm text-white/60"
              >
                Loading survival records…
              </p>
            ) : (
              data && (
                <>
                  <div className="mb-5 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4">
                    <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-amber-300">
                      Your best team run
                    </div>
                    {data.personalBest ? (
                      <Run entry={data.personalBest} />
                    ) : (
                      <p className="text-xs text-white/60">
                        {period === "week"
                          ? "No finished runs this week yet."
                          : "Finish your first run to set a record."}
                      </p>
                    )}
                  </div>
                  {data.entries.length === 0 ? (
                    <div className="py-8 text-center">
                      <Trophy className="mx-auto mb-3 h-7 w-7 text-amber-300/50" />
                      <p className="font-display text-lg">
                        The board is yours to start.
                      </p>
                      <p className="mt-2 text-xs text-white/60">
                        Survive a wave, finish your run, and claim the first
                        spot.
                      </p>
                    </div>
                  ) : (
                    <ol
                      className="divide-y divide-white/10"
                      aria-label="Top survival runs"
                    >
                      {data.entries.map((entry, i) => (
                        <li
                          key={entry.id}
                          className={cn(
                            "flex items-start gap-3 rounded-lg px-2 py-4",
                            entry.players.some((p) => p.me) && "bg-amber-300/5",
                          )}
                        >
                          <span
                            className={cn(
                              "w-6 shrink-0 pt-0.5 font-mono text-sm tabular-nums",
                              i < 3 ? "text-amber-300" : "text-white/40",
                            )}
                          >
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <div className="min-w-0 flex-1">
                            <Run entry={entry} />
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </>
              )
            )}
          </div>
          <p className="border-t border-white/10 px-5 py-3 text-[11px] leading-relaxed text-white/45 sm:px-6">
            Runs save when the team is overrun or everyone leaves. Your best
            follows this browser&apos;s visitor profile.
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Run({ entry }: { entry: LeaderboardEntry }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-display text-lg">Wave {entry.wave}</span>
        <span className="font-mono text-sm tabular-nums">
          {entry.score.toLocaleString()}{" "}
          <span className="text-[10px] text-white/45">PTS</span>
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {entry.players.map((p, i) => (
          <span
            key={i}
            className={cn(
              "flex min-w-0 items-center gap-1.5 text-xs",
              p.me ? "text-amber-200" : "text-white/65",
            )}
          >
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span
              className="max-w-36 truncate"
              title={`${p.name}: ${p.kills} kills`}
            >
              {p.name}
              {p.me ? " (you)" : ""}
            </span>
          </span>
        ))}
      </div>
      <div className="mt-2 font-mono text-[10px] text-white/40">
        {entry.players.reduce((n, p) => n + p.kills, 0)} kills ·{" "}
        {Math.floor(entry.duration / 60)}m {entry.duration % 60}s ·{" "}
        {new Date(entry.endedAt).toLocaleDateString()}
      </div>
    </div>
  );
}
