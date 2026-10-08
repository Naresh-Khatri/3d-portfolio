import { Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GamePing } from "./engine/ping";

export function PingIndicator({ ping, className }: { ping: GamePing; className?: string }) {
  const ms = ping.status === "connected" ? ping.ms : null;
  const quality = ms === null ? null : ms <= 100 ? "Good" : ms <= 200 ? "Fair" : "High latency";
  const value = ms !== null ? `${ms} ms` : ping.status === "checking" ? "…" : ping.status === "timeout" ? "Timeout" : "Offline";
  const description = ms !== null
    ? `Ping: ${value}. ${quality}. Round-trip time to the game server.`
    : ping.status === "checking"
      ? "Ping: measuring latency to the game server."
      : ping.status === "timeout"
        ? "Ping: the game server did not respond within 5 seconds."
        : "Ping: disconnected from the game server.";
  const Icon = ping.status === "offline" || ping.status === "timeout" ? WifiOff : Wifi;
  const color = ms !== null
    ? ms <= 100 ? "text-emerald-400" : ms <= 200 ? "text-amber-300" : "text-rose-400"
    : ping.status === "checking" ? "text-white/50" : "text-rose-400";

  return (
    <div
      role="img"
      aria-label={description}
      title={description}
      className={cn("flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap font-mono text-[11px] tabular-nums", className)}
    >
      <Icon
        aria-hidden="true"
        className={cn("h-3.5 w-3.5", color)}
      />
      <span className="text-white/60">Ping</span>
      <span className="text-white/90">{value}</span>
    </div>
  );
}
