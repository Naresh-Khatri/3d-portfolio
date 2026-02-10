"use client";
import { SocketContext, type User } from "@/contexts/socketio";
import { useMouse } from "@/hooks/use-mouse";
import { useThrottle } from "@/hooks/use-throttle";
import { getAvatarUrl } from "@/lib/avatar";
import { MousePointer2 } from "lucide-react";
import React, { useContext, useEffect, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";

// TODO: add clicking animation
// TODO: listen to socket disconnect
const RemoteCursors = () => {
  const { socket, users: _users, setUsers, focusedCursorId, setFocusedCursorId } = useContext(SocketContext);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { x, y } = useMouse({ allowPage: true });
  useEffect(() => {
    if (typeof window === "undefined" || !socket || isMobile) return;
    socket.on("cursor-changed", (data) => {
      setUsers((prev: User[]) => {
        const newUsers = [...prev]
        const user = newUsers.find(u => u.socketId === data.socketId)
        if (user) {
          user.posX = data.pos.x;
          user.posY = data.pos.y
        } else {
          newUsers.push({
            ...data,
          });
        }
        return newUsers;
      });
    });
    socket.on("users-updated", (data: User[]) => {
      setUsers(data);
    });
    return () => {
      socket.off("cursor-changed");
    };
  }, [socket, isMobile]);
  const handleMouseMove = useThrottle((x, y) => {
    socket?.emit("cursor-change", {
      pos: { x, y },
      socketId: socket.id,
    });
  }, 200);
  useEffect(() => {
    if (isMobile) return;
    handleMouseMove(x, y);
  }, [x, y, isMobile]);

  const users = Array.from(_users.values());

  // Handle scroll to focused cursor
  useEffect(() => {
    if (!focusedCursorId || isMobile) return;

    const user = users.find(u => u.socketId === focusedCursorId);
    if (!user) return;

    const targetX = user.posX - window.innerWidth / 2;
    const targetY = user.posY - window.innerHeight / 2;

    window.scrollTo({
      left: Math.max(0, targetX),
      top: Math.max(0, targetY),
      behavior: 'smooth'
    });

    // Clear focus after animation completes
    const timeout = setTimeout(() => {
      setFocusedCursorId(null);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [focusedCursorId, users, isMobile, setFocusedCursorId]);


  return (
    <div
      //  className="h-0 z-10 relative "
      className="absolute top-0 left-0 w-full h-full z-10 animate-fade-in pointer-events-none overflow-visible"
      style={{ minHeight: '100vh' }}
    >
      {users
        .filter((user) => user.socketId !== socket?.id)
        .map((user) => (
          <Cursor
            key={user.socketId}
            x={user.posX}
            y={user.posY}
            color={user.color}
            socketId={user.socketId}
            avatar={user.avatar}
            headerText={`${user.location} ${user.flag}`}
            isFocused={focusedCursorId === user.socketId}
          />
        ))}
    </div>
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
  const { msgs, users } = useContext(SocketContext);

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
    const lastMsgSessionId = msgs.at(-1)?.sessionId;
    const cursorUserId = users.find(u => u.socketId === socketId)?.id;
    if (lastMsgSessionId === cursorUserId) {
      const lastMsgContent = msgs.at(-1)?.content || "";
      const textSlice =
        lastMsgContent.slice(0, 30) + (lastMsgContent.length > 30 ? "..." : "");
      const timeToRead = Math.max(4000, Math.max(textSlice.length * 100, 1000));
      setMsgText(textSlice);
      // setShowText(true);
      const t = setTimeout(() => {
        setMsgText("");
        clearTimeout(t);
        // setShowText(false);
      }, timeToRead);
    }
  }, [msgs]);

  return (
    <motion.div
      animate={{
        x: x,
        y: y,
      }}
      className="w-6 h-6 pointer-events-auto"
      transition={{
        duration: 0.2, // Adjust duration for smoothness
        ease: "easeOut", // Choose an easing function
      }}
      onMouseEnter={() => setShowText(true)}
      onMouseLeave={() => setShowText(false)}
    >
      {/* Pulse Effect for Focus */}
      <AnimatePresence>
        {isFocused && (
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
          duration: 0.3,
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
              transition={{ duration: 0.3, ease: 'easeOut' }}
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
