import { useEffect, useMemo, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import type { User } from '@/contexts/socketio';

const TYPING_TTL_MS = 3000;

type Typer = { username: string; expiresAt: number };

export const useTyping = (socket: Socket | null, currentUser: { name: string } | undefined, users: User[]) => {
  const [typers, setTypers] = useState<Map<string, Typer>>(new Map());
  const lastTypingSent = useRef<number>(0);

  useEffect(() => {
    if (!socket) return;

    const handleTypingReceive = (data: { socketId: string, username: string, isTyping: boolean }) => {
      if (data.socketId === socket.id) return;
      setTypers(prev => {
        const next = new Map(prev);
        if (data.isTyping) next.set(data.socketId, { username: data.username, expiresAt: Date.now() + TYPING_TTL_MS });
        else next.delete(data.socketId);
        return next;
      });
    };
    const handleDisconnect = () => setTypers(new Map());

    socket.on("typing-receive", handleTypingReceive);
    socket.on("disconnect", handleDisconnect);
    return () => {
      socket.off("typing-receive", handleTypingReceive);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket]);

  // expiry timer derived from state (not created in updaters) -> remount/HMR can't orphan an entry
  useEffect(() => {
    if (typers.size === 0) return;
    const soonest = Math.min(...Array.from(typers.values(), t => t.expiresAt));
    const id = setTimeout(() => {
      const now = Date.now();
      // always a new map: a timer firing a hair early still re-schedules instead of stalling
      setTypers(prev => new Map([...prev].filter(([, t]) => t.expiresAt > now)));
    }, Math.max(0, soonest - Date.now()));
    return () => clearTimeout(id);
  }, [typers]);

  // closed tab/disconnect -> drop right away instead of waiting out the ttl
  const typingUsers = useMemo(() => {
    const online = new Set(users.filter(u => u.isOnline).map(u => u.socketId));
    return new Map([...typers].filter(([socketId]) => online.has(socketId)));
  }, [typers, users]);

  const handleTyping = () => {
    if (!socket || !currentUser) return;

    const now = Date.now();
    // Throttle typing events to once every 2 seconds
    if (now - lastTypingSent.current > 2000) {
      socket.emit("typing-send", { username: currentUser.name || "Anonymous" });
      lastTypingSent.current = now;
    }
  };

  const getTypingText = () => {
    if (typingUsers.size === 0) return null;
    const names = Array.from(typingUsers.values()).map(u => u.username);
    if (names.length === 1) return `${names[0]} is typing...`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;
    if (names.length === 3) return `${names[0]}, ${names[1]}, and ${names[2]} are typing...`;
    return "Several people are typing...";
  };

  return {
    typingUsers,
    handleTyping,
    getTypingText
  };
};
