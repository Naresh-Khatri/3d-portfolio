import { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';

export const useTyping = (socket: Socket | null, currentUser: { name: string } | undefined) => {
  const [typingUsers, setTypingUsers] = useState<Map<string, { username: string, timeout: NodeJS.Timeout }>>(new Map());
  const typingUsersRef = useRef(typingUsers);
  typingUsersRef.current = typingUsers;
  const lastTypingSent = useRef<number>(0);

  // Handle typing events
  useEffect(() => {
    if (!socket) return;

    const handleTypingReceive = (data: { socketId: string, username: string, isTyping: boolean }) => {
      // Don't show typing for self
      if (data.socketId === socket.id) return;

      if (!data.isTyping) {
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          if (newMap.has(data.socketId)) {
            clearTimeout(newMap.get(data.socketId)!.timeout);
            newMap.delete(data.socketId);
          }
          return newMap;
        });
        return;
      }

      setTypingUsers(prev => {
        const newMap = new Map(prev);

        // Clear existing timeout if any
        if (newMap.has(data.socketId)) {
          clearTimeout(newMap.get(data.socketId)!.timeout);
        }

        // Set new timeout to clear typing status after 3 seconds
        const timeout = setTimeout(() => {
          setTypingUsers(current => {
            const updated = new Map(current);
            updated.delete(data.socketId);
            return updated;
          });
        }, 3000);

        newMap.set(data.socketId, { username: data.username, timeout });
        return newMap;
      });
    };

    socket.on("typing-receive", handleTypingReceive);

    return () => {
      socket.off("typing-receive", handleTypingReceive);
      // Clear all pending timeouts to prevent state updates after unmount
      typingUsersRef.current.forEach(({ timeout }) => clearTimeout(timeout));
    };
  }, [socket]);

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
