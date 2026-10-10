"use client";

import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { SocketContext } from "./socketio";
import { ROOM_RE } from "@/components/game/protocol";
import { readRoomCode, roomUrl } from "@/components/game/room-url";

// three.js stays out of the main bundle until the game opens
const GameOverlay = dynamic(() => import("@/components/game/game-overlay"), { ssr: false });

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

  useEffect(() => {
    const syncInvite = () => {
      const code = readRoomCode(window.location.href);
      setRoom(code);
      setIsOpen(code !== null);
    };
    syncInvite();
    window.addEventListener("popstate", syncInvite);
    return () => window.removeEventListener("popstate", syncInvite);
  }, []);

  const onRoomJoined = useCallback((code: string) => {
    if (!ROOM_RE.test(code)) return;
    const url = roomUrl(window.location.href, code);
    window.history.replaceState(window.history.state, "", url);
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
    const url = roomUrl(window.location.href, null);
    window.history.replaceState(window.history.state, "", url);
  }, []);

  const value = useMemo(() => ({ isOpen, open, close, playing }), [isOpen, open, close, playing]);

  return (
    <GameContext.Provider value={value}>
      {children}
      {isOpen && socket && <GameOverlay key={room ?? "new"} socket={socket} room={room} onRoomJoined={onRoomJoined} onClose={close} />}
    </GameContext.Provider>
  );
};
