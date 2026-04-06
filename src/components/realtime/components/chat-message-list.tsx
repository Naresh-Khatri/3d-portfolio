import React, { useContext, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, Reply } from "lucide-react";
import { differenceInMinutes, format, isToday, isYesterday } from "date-fns";
import { ArrowDown, Hash } from "lucide-react";
import { ScrollArea } from "../../ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Message, User, ChatItem } from "@/contexts/socketio";
import { THEME } from "../constants";
import { getAvatarUrl } from "@/lib/avatar";
import { SocketContext } from "@/contexts/socketio";
import { SystemMessageRow } from "./system-message";
import { QuotedMessage } from "./quoted-message";
import { ReactionPicker } from "./reaction-picker";
import { MessageReactions } from "./message-reactions";
import { AdminBadge } from "./admin-badge";

function isSystemMessage(item: ChatItem): item is import("@/contexts/socketio").SystemMessage {
  return "type" in item && item.type === "system";
}

function formatMessageTime(date: Date): string {
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return `Yesterday at ${format(date, "h:mm a")}`;
  return `${format(date, "M/d/yy")} at ${format(date, "h:mm a")}`;
}

function formatDaySeparator(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
}

type GroupedSystemItem = { _grouped: true; users: { username: string; flag: string }[] };
type GroupedItem = ChatItem | GroupedSystemItem;

function groupChatItems(items: ChatItem[]): GroupedItem[] {
  const result: GroupedItem[] = [];
  let i = 0;
  while (i < items.length) {
    const item = items[i];
    if (isSystemMessage(item) && item.subtype === "join") {
      const seen = new Set<string>();
      const users: { username: string; flag: string }[] = [];
      while (i < items.length && isSystemMessage(items[i]) && (items[i] as import("@/contexts/socketio").SystemMessage).subtype === "join") {
        const sys = items[i] as import("@/contexts/socketio").SystemMessage;
        if (!seen.has(sys.sessionId)) {
          seen.add(sys.sessionId);
          users.push({ username: sys.username, flag: sys.flag });
        }
        i++;
      }
      result.push({ _grouped: true, users });
    } else {
      result.push(item);
      i++;
    }
  }
  return result;
}

/** Check if two dates are on different calendar days */
function isDifferentDay(a: Date, b: Date): boolean {
  return a.getFullYear() !== b.getFullYear() || a.getMonth() !== b.getMonth() || a.getDate() !== b.getDate();
}

interface ChatMessageListProps {
  msgs: ChatItem[];
  users: User[];
  currentUser: User | undefined;
  chatContainerRef: React.RefObject<HTMLDivElement>;
  showScrollButton: boolean;
  unreads: number;
  scrollToBottom: (smooth?: boolean) => void;
  isSingleUser: boolean;
  typingUsers: Map<string, { username: string }>;
  getTypingText: () => string | null;
  onReply: (msg: Message) => void;
}

export const ChatMessageList = ({
  msgs,
  users,
  currentUser,
  chatContainerRef,
  showScrollButton,
  unreads,
  scrollToBottom,
  isSingleUser,
  typingUsers,
  getTypingText,
  onReply,
}: ChatMessageListProps) => {
  const { setFocusedCursorId, socket, reactions, profileMap } = useContext(SocketContext);
  const [pickerOpenFor, setPickerOpenFor] = useState<string | null>(null);

  const grouped = useMemo(() => groupChatItems(msgs), [msgs]);

  const handleReaction = (messageId: string, emoji: string) => {
    socket?.emit("reaction-toggle", { messageId, emoji });
    setPickerOpenFor(null);
  };

  const scrollToMessage = (msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-[#5865f2]/10");
      setTimeout(() => el.classList.remove("bg-[#5865f2]/10"), 1500);
    }
  };

  let lastRenderedDate: Date | null = null;
  let prevRegularMsg: Message | null = null;
  let hadNonMessageSincePrev = false;

  return (
    <div className="flex-1 relative overflow-hidden flex flex-col">
      <ScrollArea className="h-[400px]" data-lenis-prevent ref={chatContainerRef} type="always">
        <div className="p-4 space-y-0">
          {msgs.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-70 mt-10">
              <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mb-2", THEME.bg.welcome)}>
                <Hash className={cn("w-10 h-10", THEME.text.header)} />
              </div>
              <h3 className={cn("text-xl font-bold", THEME.text.header)}>Welcome to #general!</h3>
              <p className={cn("text-sm max-w-[200px]", THEME.text.secondary)}>
                This is the start of the legendary conversation.
                {isSingleUser && <span className="block mt-2 text-yellow-600 dark:text-yellow-400/80 text-xs">(It&apos;s just you right now, invite a friend!)</span>}
              </p>
            </div>
          )}

          {grouped.map((item, groupIdx) => {
            // Grouped system messages
            if ("_grouped" in item) {
              hadNonMessageSincePrev = true;
              return <SystemMessageRow key={`sys-${groupIdx}`} users={item.users} />;
            }

            // Single system message
            if (isSystemMessage(item)) {
              hadNonMessageSincePrev = true;
              return <SystemMessageRow key={item.id} users={[{ username: item.username, flag: item.flag }]} />;
            }

            // Regular message
            const msg = item;
            const profile = profileMap.get(msg.sessionId);
            const user = users.find((u) => u.id === msg.sessionId);
            const displayName = profile?.name ?? msg.username;
            const displayAvatar = profile?.avatar ?? msg.avatar;
            const displayColor = profile?.color ?? msg.color ?? '#60a5fa';
            const isMe = msg.sessionId === currentUser?.id;
            const msgDate = new Date(msg.createdAt);

            const isFirstMsg = !prevRegularMsg;
            const showHeader =
              isFirstMsg ||
              hadNonMessageSincePrev ||
              prevRegularMsg!.sessionId !== msg.sessionId ||
              differenceInMinutes(msg.createdAt, prevRegularMsg!.createdAt) > 3;

            prevRegularMsg = msg;
            hadNonMessageSincePrev = false;

            // Day separator
            let daySeparator: React.ReactNode = null;
            if (!lastRenderedDate || isDifferentDay(msgDate, lastRenderedDate)) {
              daySeparator = (
                <div className={cn("flex items-center gap-3 py-3 select-none", THEME.text.secondary)}>
                  <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
                  <span className="text-[11px] font-semibold">{formatDaySeparator(msgDate)}</span>
                  <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
                </div>
              );
            }
            lastRenderedDate = msgDate;

            const msgReactions = reactions.get(msg.id) || [];

            return (
              <React.Fragment key={msg.id}>
                {daySeparator}
                <div
                  id={`msg-${msg.id}`}
                  className={cn(
                    "group relative flex gap-3 pr-2 py-0.5 -mx-2 px-2 rounded transition-colors",
                    "hover:bg-black/[0.03] dark:hover:bg-white/[0.03]",
                    showHeader && !isFirstMsg && "!mt-4"
                  )}
                >
                  {showHeader ? (
                    <div
                      className={cn(
                        "relative w-10 h-10 flex-shrink-0 mt-0.5",
                        !isMe && user?.socketId && "cursor-pointer"
                      )}
                      onClick={() => {
                        if (!isMe && user?.socketId) {
                          setFocusedCursorId(user.socketId);
                        }
                      }}
                    >
                      <img
                        src={getAvatarUrl(displayAvatar)}
                        alt={displayName}
                        className="w-10 h-10 rounded-full"
                        style={{ backgroundColor: displayColor }}
                      />
                      {user?.isOnline && (
                        <div className={cn("absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2", THEME.border.status)} />
                      )}
                    </div>
                  ) : (
                    <div className={cn("w-10 flex-shrink-0 flex items-center justify-end pr-1")}>
                      <span className={cn("text-[10px] opacity-0 group-hover:opacity-100 select-none tabular-nums", THEME.text.secondary)}>
                        {format(msgDate, "h:mm")}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    {showHeader && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <div
                          className={cn("flex items-center gap-2", !isMe && user?.socketId && "cursor-pointer group/name")}
                          onClick={() => {
                            if (!isMe && user?.socketId) {
                              setFocusedCursorId(user.socketId);
                            }
                          }}
                        >
                          <span
                            className={cn("font-medium hover:underline", THEME.text.header)}
                            style={{ color: displayColor }}
                          >
                            {displayName}
                          </span>
                          {/* {!isMe && user?.socketId && ( */}
                          {/*   <motion.div */}
                          {/*     initial={{ opacity: 0, x: -5 }} */}
                          {/*     whileHover={{ opacity: 1, x: 0 }} */}
                          {/*     className="group-hover/name:opacity-100 opacity-0 transition-all flex items-center" */}
                          {/*   > */}
                          {/*     <Users className={cn("w-3 h-3", THEME.text.secondary)} /> */}
                          {/*   </motion.div> */}
                          {/* )} */}
                        </div>
                        <span>{msg.flag}</span>
                        {profile?.isAdmin && <AdminBadge />}
                        {isMe && (
                          <span className="bg-[#5865f2] text-white text-[10px] px-1 rounded font-bold">YOU</span>
                        )}
                        <span className={cn("text-xs", THEME.text.secondary)}>
                          {formatMessageTime(msgDate)}
                        </span>
                      </div>
                    )}

                    {msg.replyTo && (
                      <QuotedMessage
                        username={msg.replyTo.username}
                        content={msg.replyTo.content}
                        avatar={(() => {
                          const orig = msgs.find(m => !isSystemMessage(m) && m.id === msg.replyTo!.id) as Message | undefined;
                          return orig?.avatar;
                        })()}
                        color={(() => {
                          const orig = msgs.find(m => !isSystemMessage(m) && m.id === msg.replyTo!.id) as Message | undefined;
                          return orig?.color;
                        })()}
                        onClickQuote={() => scrollToMessage(msg.replyTo!.id)}
                      />
                    )}

                    <p className={cn("whitespace-pre-wrap break-words leading-[1.375rem] text-sm font-light", THEME.text.primary)}>
                      {msg.content}
                    </p>

                    <MessageReactions
                      reactions={msgReactions}
                      currentSessionId={currentUser?.id}
                      onToggle={(emoji) => handleReaction(msg.id, emoji)}
                      onPickerOpen={() => setPickerOpenFor(pickerOpenFor === msg.id ? null : msg.id)}
                    />
                  </div>

                  {/* Hover actions */}
                  <div className={cn(
                    "absolute -top-3 right-3 flex items-center rounded-md border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10",
                    THEME.bg.secondary, THEME.border.primary
                  )}>
                    <ReactionPicker
                      onReact={(emoji) => handleReaction(msg.id, emoji)}
                      open={pickerOpenFor === msg.id}
                      onOpenChange={(open) => setPickerOpenFor(open ? msg.id : null)}
                    />
                    <button
                      type="button"
                      className={cn("p-1.5 rounded transition-colors", THEME.bg.hover, THEME.text.secondary)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        onReply(msg);
                      }}
                    >
                      <Reply className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </ScrollArea>

      {/* Typing Indicator */}
      {typingUsers.size > 0 && (
        <div className={cn("h-6 px-4 flex items-center", THEME.bg.primary)}>
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="flex items-center gap-2"
          >
            <div className="flex items-center gap-0.5 mt-1">
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
            </div>
            <span className={cn("text-xs font-bold", THEME.text.secondary)}>
              {getTypingText()}
            </span>
          </motion.div>
        </div>
      )}

      {/* New Message / Scroll Button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={() => scrollToBottom(true)}
            className={cn(
              "absolute bottom-20 left-1/2 -translate-x-1/2 z-10",
              "flex items-center gap-2 px-3 py-1.5 rounded-full shadow-lg",
              "bg-[#5865f2] hover:bg-[#4752c4] text-white transition-colors",
              "text-xs font-bold cursor-pointer"
            )}
          >
            {unreads > 0 ? (
              <>
                <span>{unreads} new messages</span>
                <ArrowDown className="w-3 h-3" />
              </>
            ) : (
              <>
                <span>Jump to present</span>
                <ArrowDown className="w-3 h-3" />
              </>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
