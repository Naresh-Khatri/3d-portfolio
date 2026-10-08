"use client";

import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { SocketContext } from "./socketio";

// three.js stays out of the main bundle until the game opens
const GameOverlay = dynamic(() => import("@/components/game/game-overlay"), { ssr: false });

const ROOM_RE = /^[a-z0-9]{4,8}$/;

type GameContextType = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  playing: number; // players in game across all rooms
};

export const GameContext = createContext<GameContextType>({
  isOpen: false,
  open: () => {},
  close: () => {},
  playing: 0,
});

export const GameContextProvider = ({ children }: { children: ReactNode }) => {
  const { socket } = useContext(SocketContext);
  const [isOpen, setIsOpen] = useState(false);
  const [room, setRoom] = useState<string | null>(null);
  const [playing, setPlaying] = useState(0);

  // invite link: /?game=<room>
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("game")?.toLowerCase();
    if (!code || !ROOM_RE.test(code)) return;
    setRoom(code);
    setIsOpen(true);
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("game:count", setPlaying);
    return () => {
      socket.off("game:count", setPlaying);
    };
  }, [socket]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    setRoom(null);
    const url = new URL(window.location.href);
    if (!url.searchParams.has("game")) return;
    url.searchParams.delete("game");
    window.history.replaceState(null, "", url);
  }, []);

  const value = useMemo(() => ({ isOpen, open, close, playing }), [isOpen, open, close, playing]);

  return (
    <GameContext.Provider value={value}>
      {children}
      {isOpen && socket && <GameOverlay socket={socket} room={room} onClose={close} />}
    </GameContext.Provider>
  );
};
