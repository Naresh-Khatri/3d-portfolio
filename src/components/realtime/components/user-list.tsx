import React, { useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Edit } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { User } from "@/contexts/socketio";
import { SocketContext } from "@/contexts/socketio";
import type { Socket } from "socket.io-client";
import { THEME } from "../constants";
import { getAvatarUrl } from "@/lib/avatar";

interface UserListProps {
  users: User[];
  socket: Socket | null;
  updateProfile: (data: { name: string; avatar: string; color: string }) => void;
  showUserList: boolean;
  onClose: () => void;
  onEditProfile: () => void;
}

export const UserList = ({ users, socket, updateProfile, showUserList, onClose, onEditProfile }: UserListProps) => {
  const { setFocusedCursorId } = useContext(SocketContext);
  const sortedUsers = [...users].sort((a, b) => {
    if (a.socketId === socket?.id) return -1;
    if (b.socketId === socket?.id) return 1;
    return 0;
  });

  return (
    <AnimatePresence>
      {showUserList && (
        <>
          {/* Overlay to close user list when clicking on messages area */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-10 cursor-pointer"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            className={cn("absolute inset-y-0 right-0 w-60 shadow-xl z-20 flex flex-col border-l", THEME.bg.secondary, THEME.border.primary)}
          >
            <div className="p-4 pb-2">
              <h3 className={cn("text-xs font-bold uppercase tracking-wide mb-2", THEME.text.secondary)}>
                Online — {users.length}
              </h3>
            </div>
            <ScrollArea className="flex-1 px-2" data-lenis-prevent >
              <div className="space-y-0.5 pb-4">
                {sortedUsers.map((user) => (
                  <UserItem
                    key={user.socketId}
                    user={user}
                    socket={socket}
                    onEditProfile={onEditProfile}
                    onScrollToCursor={setFocusedCursorId}
                  />
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const UserItem = ({
  user,
  socket,
  onEditProfile,
  onScrollToCursor,
}: {
  user: User;
  socket: Socket | null;
  onEditProfile: () => void;
  onScrollToCursor: (socketId: string) => void;
}) => {
  const isMe = user.socketId === socket?.id;

  return (
    <div
      className={cn(
        "group flex flex-col p-2 rounded transition-colors relative",
        THEME.bg.itemHover,
        !isMe && "cursor-pointer"
      )}
      onClick={() => {
        if (!isMe) {
          onScrollToCursor(user.socketId);
        }
      }}
    >
      <div className="flex items-center gap-3 w-full">
        <div className="relative">
          <img
            src={getAvatarUrl(user.avatar)}
            alt={user.name}
            className="w-8 h-8 rounded-full"
            style={{ backgroundColor: user.color || '#60a5fa' }}
          />
          <div className={cn("absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2", THEME.border.status)} />
        </div>

        <div className="flex-1 min-w-0">
          <div
            className={cn("flex items-center justify-between", isMe && "cursor-pointer")}
            onClick={(e) => {
              if (isMe) {
                e.stopPropagation();
                onEditProfile();
              }
            }}
          >
            <div className="flex gap-1 items-center">
              <span
                className={cn("font-medium truncate text-sm", isMe ? THEME.text.header : cn(THEME.text.secondary, THEME.text.hover))}
                style={{ color: !isMe ? user.color : undefined }}
              >
                {user.name}
              </span>
              {isMe && <span className="bg-[#5865f2] text-white text-[10px] px-1 rounded font-bold">YOU</span>}
            </div>
            {isMe ? (
              <Button variant={'ghost'} size={'icon'} className="w-5 h-5">
                <Edit className={cn("w-3 h-3 hover:text-[#060607] dark:hover:text-white", THEME.text.secondary)} />
              </Button>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 5 }}
                whileHover={{ opacity: 1, x: 0 }}
                className="group-hover:opacity-100 opacity-0 transition-all"
              >
                <Users className={cn("w-3 h-3", THEME.text.secondary)} />
              </motion.div>
            )}
          </div>
          <div className={cn("text-[10px] truncate space-x-1", THEME.text.secondary)}>
            <span>{user.location}</span>
            <span>{user.flag}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
