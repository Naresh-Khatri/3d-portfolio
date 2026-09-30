"use client";
import { SocketContext } from "@/contexts/socketio";
import { useCursorPositions } from "@/contexts/cursor-positions";
import { useMouse } from "@/hooks/use-mouse";
import { useThrottle } from "@/hooks/use-throttle";
import { getAvatarUrl } from "@/lib/avatar";
import { MousePointer2, X } from "lucide-react";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";

import { AnimatePresence, motion } from "motion/react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useLenis } from "@/lib/lenis";
import { usePerfProfile } from "@/hooks/use-perf-profile";

// TODO: add clicking animation

// Space (px) to keep clear at the right edge so a clamped cursor's pointer
// glyph and avatar pill (which extend right of x) stay on-screen.
const CURSOR_EDGE_RESERVE = 56;

const RemoteCursors = () => {
  const { socket, users: _users, followingId, setFollowingId } = useContext(SocketContext);
  const cursorPositions = useCursorPositions();
  const { reducedMotion } = usePerfProfile();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Track viewport width so we can clamp incoming (desktop-coordinate) cursor
  // positions into the visible range on narrow screens. 0 until mounted so SSR
  // and first paint leave x untouched.
  const [viewport, setViewport] = useState({ w: 0 });
  useEffect(() => {
    const update = () => setViewport({ w: window.innerWidth });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  // Root Lenis instance — resolved via the global store even though this lives
  // outside the <ReactLenis> provider. Driving the follow through Lenis instead
  // of window.scrollTo keeps both on the same RAF loop, so it doesn't stutter.
  const lenis = useLenis();
  const { x, y } = useMouse({ allowPage: true });
  const emitCursor = useCallback((x: number, y: number) => {
    if (!socket?.connected) return;
    socket?.emit("cursor-change", {
      pos: { x, y },
      socketId: socket.id,
    });
  }, [socket]);
  const handleMouseMove = useThrottle(emitCursor, 200);
  useEffect(() => {
    if (isMobile) return;
    handleMouseMove(x, y);
  }, [x, y, isMobile, handleMouseMove]);

  const users = _users.filter((user) => user.isOnline);
  const followedUser = followingId ? users.find((u) => u.socketId === followingId) : null;

  const followedPosition = followingId ? cursorPositions.get(followingId) : undefined;

  // Retarget the scroll only when the followed cursor moves.
  useEffect(() => {
    if (!followedPosition || !followedUser || isMobile) return;

    const top = Math.max(0, followedPosition.y - window.innerHeight / 2);
    if (lenis) {
      // force: true so it still scrolls while Lenis is stopped (see effect below).
      lenis.scrollTo(top, { duration: reducedMotion ? 0 : 1, immediate: reducedMotion, force: true });
    } else {
      window.scrollTo({ top, behavior: reducedMotion ? 'instant' : 'smooth' });
    }
  }, [followedPosition, followedUser, isMobile, lenis, reducedMotion]);

  // Stop Lenis while following so its inertia/virtual-scroll doesn't fight our
  // programmatic follow. We're the sole scroll driver here; Lenis resumes on exit.
  useEffect(() => {
    if (!lenis || !followedUser || isMobile) return;
    lenis.stop();
    return () => lenis.start();
  }, [lenis, followedUser, isMobile]);

  // Exit follow mode on any manual navigation (wheel / touch / Escape).
  // Programmatic scrollTo above doesn't emit wheel/touch events, so this only
  // fires when the user deliberately takes back control — just like Figma.
  useEffect(() => {
    if (!followingId) return;
    const stop = () => setFollowingId(null);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") stop(); };
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchmove", stop, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchmove", stop);
      window.removeEventListener("keydown", onKey);
    };
  }, [followingId, setFollowingId]);

  // Stop following if the target leaves the room.
  useEffect(() => {
    if (followingId && (!followedUser || isMobile)) {
      setFollowingId(null);
    }
  }, [followingId, followedUser, isMobile, setFollowingId]);

  const followColor = followedUser?.color || "#60a5fa";

  return (
    <>
      {/* overflow-x-clip (not -hidden): an expanded cursor pill has a dynamic
          width that the x-clamp below can't account for, so clip anything past
          the right edge to stop it widening the page. `clip` avoids turning
          this into a scroll container or forcing overflow-y to auto, so cursors
          further down the page still render. */}
      <div
        className="absolute top-0 left-0 w-full h-full z-10 animate-fade-in pointer-events-none overflow-x-clip"
        style={{ minHeight: '100vh' }}
      >
        {users
          .filter((user) => user.socketId !== socket?.id && cursorPositions.has(user.socketId))
          .map((user) => {
            const pos = cursorPositions.get(user.socketId)!;
            // Cursors are positioned at absolute coordinates broadcast by other
            // (mostly desktop) users. On a narrow viewport an x like 1500 spills
            // past the right edge and creates horizontal overflow, so clamp x
            // into the visible range — cursors bunch up at the edge instead of
            // pushing the page wider. CURSOR_EDGE_RESERVE leaves room for the
            // cursor glyph + avatar pill that extend to the right of x.
            const x = viewport.w ? Math.min(pos.x, viewport.w - CURSOR_EDGE_RESERVE) : pos.x;
            return (
              <Cursor
                key={user.socketId}
                x={x}
                y={pos.y}
                color={user.color}
                socketId={user.socketId}
                avatar={user.avatar}
                headerText={`${user.location} ${user.flag}`}
                isFocused={followingId === user.socketId}
              />
            );
          })}
      </div>

      {/* Figma-style follow overlay: viewport border + "Following" banner */}
      <AnimatePresence>
        {followedUser && (
          <motion.div
            key="follow-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999998] pointer-events-none"
            style={{ boxShadow: `inset 0 0 0 3px ${followColor}` }}
          >
            <motion.button
              type="button"
              onClick={() => setFollowingId(null)}
              initial={{ x: "-50%", y: reducedMotion ? 0 : 16, opacity: 0 }}
              animate={{ x: "-50%", y: 0, opacity: 1 }}
              exit={{ x: "-50%", y: reducedMotion ? 0 : 16, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
              className="pointer-events-auto absolute bottom-4 left-1/2 flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full shadow-lg text-white text-sm font-medium group"
              style={{ backgroundColor: followColor }}
            >
              <img
                src={getAvatarUrl(followedUser.avatar)}
                alt=""
                className="w-6 h-6 rounded-full ring-2 ring-white/40 flex-shrink-0"
              />
              <span className="whitespace-nowrap">
                Following <span className="font-semibold">{followedUser.name}</span>
              </span>
              <span className="ml-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-white/20 group-hover:bg-white/35 transition-colors">
                <X className="w-3 h-3" strokeWidth={3} />
              </span>
              <span className="hidden sm:inline text-[10px] opacity-70 ml-0.5">Esc</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const Cursor = ({
  color,
  x,
  y,
  headerText,
  socketId,
  avatar,
  isFocused = false,
}: {
  x: number;
  y: number;
  color?: string;
  headerText: string;
  socketId: string;
  avatar: string;
  isFocused?: boolean;
}) => {
  const [showText, setShowText] = useState(false);
  const [msgText, setMsgText] = useState("");
  const messageTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { msgs, users } = useContext(SocketContext);
  const { reducedMotion } = usePerfProfile();
  const cursorUserId = users.find(u => u.socketId === socketId)?.id;

  useEffect(() => {
    setShowText(true);
    const fadeOutTimeout = setTimeout(() => {
      setShowText(false);
    }, 3000); // 1 second

    return () => {
      clearTimeout(fadeOutTimeout);
    };
  }, [x, y, msgText]);


  useEffect(() => {
    const lastMsg = msgs.at(-1);
    const lastMsgSessionId = lastMsg?.sessionId;
    if (lastMsgSessionId === cursorUserId && lastMsg && "content" in lastMsg) {
      const lastMsgContent = lastMsg.content || "";
      const textSlice =
        lastMsgContent.slice(0, 30) + (lastMsgContent.length > 30 ? "..." : "");
      const timeToRead = Math.max(4000, Math.max(textSlice.length * 100, 1000));
      setMsgText(textSlice);
      if (messageTimeout.current) clearTimeout(messageTimeout.current);
      messageTimeout.current = setTimeout(() => {
        setMsgText("");
      }, timeToRead);
    }
  }, [msgs, cursorUserId]);

  useEffect(() => () => {
    if (messageTimeout.current) clearTimeout(messageTimeout.current);
  }, []);

  return (
    <motion.div
      animate={{
        left: x,
        top: y,
      }}
      className="absolute w-6 h-6 pointer-events-auto"
      transition={reducedMotion ? { duration: 0 } : {
        type: "spring",
        damping: 30,
        stiffness: 200,
        mass: 0.5,
      }}
      onMouseEnter={() => setShowText(true)}
      onMouseLeave={() => setShowText(false)}
    >
      {/* Pulse Effect for Focus */}
      <AnimatePresence>
        {isFocused && !reducedMotion && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: [1, 1.5, 1.2],
              opacity: [0.5, 0.2, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut"
            }}
            className="absolute inset-0 rounded-full"
            style={{
              backgroundColor: color,
              filter: `blur(20px)`,
              width: '40px',
              height: '40px',
              left: '-8px',
              top: '-8px',
              zIndex: -1
            }}
          />
        )}
      </AnimatePresence>

      {/* Cursor pointer */}
      <MousePointer2
        className="w-6 h-6 z-[9999999] absolute top-0 left-0"
        style={{
          color: color,
          filter: isFocused ? `drop-shadow(0 0 8px ${color})` : undefined
        }}
        strokeWidth={7.2}
      />

      {/* Avatar pill that expands to show text */}
      <motion.div
        className="absolute top-4 left-4 flex items-center rounded-full border-2 shadow-lg overflow-hidden"
        style={{
          borderColor: color,
          backgroundColor: color + '60',
        }}
        initial={false}
        animate={{
          width: showText && headerText ? 'auto' : 40,
        }}
        transition={{
          duration: reducedMotion ? 0 : 0.3,
          ease: 'easeOut',
        }}
      >
        {/* Avatar image */}
        <img
          src={getAvatarUrl(avatar)}
          alt=""
          className="w-10 h-10 rounded-full flex-shrink-0"
        />

        {/* Text content - always rendered but clipped when collapsed */}
        <AnimatePresence>
          {showText && headerText && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.3, ease: 'easeOut' }}
              className="flex flex-col justify-center pl-2 pr-3 py-1 whitespace-nowrap"
            >
              <div className="text-xs font-medium text-white">{headerText}</div>
              {msgText && (
                <div className="text-xs font-mono text-white/90 max-w-44 truncate">
                  {msgText}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default RemoteCursors;
