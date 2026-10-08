import type { Socket } from "socket.io-client";

export type GamePing = {
  status: "checking" | "connected" | "timeout" | "offline";
  ms: number | null;
};

const INTERVAL_MS = 2_000;
const TIMEOUT_MS = 5_000;

export function monitorGamePing(socket: Socket, update: (ping: GamePing) => void) {
  let active = true;
  let request = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const invalidate = () => {
    request++;
    clearTimeout(timer);
  };

  const offline = () => {
    invalidate();
    update({ status: "offline", ms: null });
  };

  const measure = () => {
    if (!active) return;
    if (!socket.connected) {
      offline();
      return;
    }
    const id = ++request;
    const sent = performance.now();
    socket.volatile.timeout(TIMEOUT_MS).emit("game:ping", (error: Error | null) => {
      if (!active || request !== id) return;
      if (!socket.connected) {
        offline();
        return;
      }
      update(error
        ? { status: "timeout", ms: null }
        : { status: "connected", ms: Math.max(0, Math.round(performance.now() - sent)) });
      timer = setTimeout(measure, INTERVAL_MS);
    });
  };

  const connect = () => {
    invalidate();
    update({ status: "checking", ms: null });
    measure();
  };

  socket.on("connect", connect);
  socket.on("disconnect", offline);
  if (socket.connected) connect();
  else offline();

  return () => {
    active = false;
    invalidate();
    socket.off("connect", connect);
    socket.off("disconnect", offline);
  };
}
