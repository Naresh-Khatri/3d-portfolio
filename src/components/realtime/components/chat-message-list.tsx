import React, { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Reply, Pencil, Loader2 } from "lucide-react";
import { differenceInMinutes, format, isToday, isYesterday } from "date-fns";
import { ArrowDown, Hash } from "lucide-react";
import { ScrollArea } from "../../ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Message, User, ChatItem, Reaction } from "@/contexts/socketio";
import { THEME } from "../constants";
import { getAvatarUrl } from "@/lib/avatar";
import { SocketContext, isLocalMsg } from "@/contexts/socketio";
import { UNREAD_DIVIDER_ATTR } from "../hooks/use-chat-scroll";
import { useToast } from "@/components/ui/use-toast";
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

type GroupedSystemItem = { _grouped: true; id: string; lastId: string; users: { username: string; flag: string }[] };
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
      result.push({ _grouped: true, id: item.id, lastId: items[i - 1].id, users });
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

type RowLayout =
  | { kind: "system"; key: string; lastId: string; users: { username: string; flag: string }[] }
  | { kind: "msg"; msg: Message; showHeader: boolean; isFirstMsg: boolean; dayLabel: string | null };

function layoutRows(grouped: GroupedItem[]): RowLayout[] {
  const rows: RowLayout[] = [];
  let lastDate: Date | null = null;
  let prev: Message | null = null;
  let hadNonMessageSincePrev = false;

  for (const item of grouped) {
    if ("_grouped" in item) {
      hadNonMessageSincePrev = true;
      rows.push({ kind: "system", key: `sys-${item.id}`, lastId: item.lastId, users: item.users });
      continue;
    }
    if (isSystemMessage(item)) {
      hadNonMessageSincePrev = true;
      rows.push({ kind: "system", key: item.id, lastId: item.id, users: [{ username: item.username, flag: item.flag }] });
      continue;
    }
    const msgDate = new Date(item.createdAt);
    const showHeader =
      !prev ||
      hadNonMessageSincePrev ||
      prev.sessionId !== item.sessionId ||
      differenceInMinutes(item.createdAt, prev.createdAt) > 3;
    const dayLabel = !lastDate || isDifferentDay(msgDate, lastDate) ? formatDaySeparator(msgDate) : null;
    rows.push({ kind: "msg", msg: item, showHeader, isFirstMsg: !prev, dayLabel });
    prev = item;
    lastDate = msgDate;
    hadNonMessageSincePrev = false;
  }
  return rows;
}

const NO_REACTIONS: Reaction[] = [];

// ~50 msgs/page -> stop paging back for a quote after this
const MAX_JUMP_PAGES = 10;

const scrollToMessage = (msgId: string) => {
  const el = document.getElementById(`msg-${msgId}`);
  if (!el) return false;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.add("bg-[#5865f2]/10");
  setTimeout(() => el.classList.remove("bg-[#5865f2]/10"), 1500);
  return true;
};

const UnreadDivider = () => (
  <div {...{ [UNREAD_DIVIDER_ATTR]: "" }} className="flex items-center gap-2 py-2 select-none" role="separator" aria-label="New messages">
    <div className="flex-1 h-px bg-red-500/60" />
    <span className="text-[11px] font-bold uppercase text-red-500">New</span>
  </div>
);

// primitives/stable refs only -> typing, presence and other rows' changes skip re-render
interface MessageRowProps {
  msg: Message;
  displayName: string;
  displayAvatar: string;
  displayColor: string;
  isAdmin: boolean;
  isMe: boolean;
  isOnline: boolean;
  followSocketId: string | undefined;
  showHeader: boolean;
  isFirstMsg: boolean;
  dayLabel: string | null;
  reactions: Reaction[];
  currentSessionId: string | undefined;
  replyAvatar: string | undefined;
  replyColor: string | undefined;
  isActive: boolean;
  isPickerOpen: boolean;
  onJumpTo: (id: string) => void;
  onResend: (id: string) => void;
  onDiscard: (id: string) => void;
  onToggleActive: (id: string) => void;
  onPickerOpenChange: (id: string | null) => void;
  onReact: (id: string, emoji: string) => void;
  onFollow: (socketId: string) => void;
  onReply: (msg: Message) => void;
  onEdit: (msg: Message) => void;
}

const MessageRow = memo(function MessageRow({
  msg,
  displayName,
  displayAvatar,
  displayColor,
  isAdmin,
  isMe,
  isOnline,
  followSocketId,
  showHeader,
  isFirstMsg,
  dayLabel,
  reactions,
  currentSessionId,
  replyAvatar,
  replyColor,
  isActive,
  isPickerOpen,
  onJumpTo,
  onResend,
  onDiscard,
  onToggleActive,
  onPickerOpenChange,
  onReact,
  onFollow,
  onReply,
  onEdit,
}: MessageRowProps) {
  const msgDate = new Date(msg.createdAt);
  const follow = followSocketId ? () => onFollow(followSocketId) : undefined;
  const isLocal = !!msg.status;

  return (
    <>
      {dayLabel && (
        <div className={cn("flex items-center gap-3 py-3 select-none", THEME.text.secondary)}>
          <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
          <span className="text-[11px] font-semibold">{dayLabel}</span>
          <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
        </div>
      )}
      <div
        id={`msg-${msg.id}`}
        onPointerUp={(e) => {
          if (e.pointerType === "mouse") return;
          onToggleActive(msg.id);
        }}
        className={cn(
          "group relative flex gap-3 pr-2 py-0.5 -mx-2 px-2 rounded transition-colors",
          "hover:bg-black/[0.03] dark:hover:bg-white/[0.03]",
          isActive && "bg-black/[0.03] dark:bg-white/[0.03]",
          showHeader && !isFirstMsg && "!mt-4"
        )}
      >
        {showHeader ? (
          <div
            className={cn("relative w-10 h-10 flex-shrink-0 mt-0.5", follow && "cursor-pointer")}
            onClick={follow}
          >
            <img
              src={getAvatarUrl(displayAvatar)}
              alt={displayName}
              className="w-10 h-10 rounded-full"
              style={{ backgroundColor: displayColor }}
            />
            {isOnline && (
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

        <div className="flex-1 min-w-0 overflow-hidden">
          {showHeader && (
            <div className="flex items-center gap-2 flex-wrap">
              <div
                className={cn("flex items-center gap-2", follow && "cursor-pointer group/name")}
                onClick={follow}
              >
                <span
                  className={cn("font-medium hover:underline", THEME.text.header)}
                  style={{ color: displayColor }}
                >
                  {displayName}
                </span>
              </div>
              <span>{msg.flag}</span>
              {isAdmin && <AdminBadge />}
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
              avatar={replyAvatar}
              color={replyColor}
              onClickQuote={() => onJumpTo(msg.replyTo!.id)}
            />
          )}

          <p className={cn(
            "whitespace-pre-wrap break-words leading-[1.375rem] text-sm font-medium",
            THEME.text.primary,
            msg.status === "pending" && "opacity-50",
            msg.status === "failed" && "text-red-500 dark:text-red-400"
          )}>
            {msg.content}
            {msg.editedAt && (
              <span className={cn("text-[10px] ml-1.5 opacity-50 select-none", THEME.text.secondary)}>(edited)</span>
            )}
          </p>

          {msg.status === "failed" && (
            <div className="flex items-center gap-2 mt-0.5 text-xs">
              <span className="text-red-500 dark:text-red-400">Not sent.</span>
              <button type="button" className="font-semibold text-[#5865f2] hover:underline" onClick={() => onResend(msg.id)}>
                Retry
              </button>
              <button type="button" className={cn("hover:underline", THEME.text.secondary)} onClick={() => onDiscard(msg.id)}>
                Discard
              </button>
            </div>
          )}

          <MessageReactions
            reactions={reactions}
            currentSessionId={currentSessionId}
            onToggle={(emoji) => onReact(msg.id, emoji)}
            onPickerOpen={() => onPickerOpenChange(isPickerOpen ? null : msg.id)}
          />
        </div>

        {/* Hover actions; none until the server has an id for it */}
        {!isLocal && <div
          onPointerUp={(e) => e.stopPropagation()}
          className={cn(
          "absolute -top-3 right-3 flex items-center rounded-md border shadow-sm opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-10",
          // open picker lives inside the toolbar -> keep it visible off-hover
          (isActive || isPickerOpen) && "opacity-100",
          THEME.bg.secondary, THEME.border.primary
        )}>
          <ReactionPicker
            onReact={(emoji) => onReact(msg.id, emoji)}
            open={isPickerOpen}
            onOpenChange={(open) => onPickerOpenChange(open ? msg.id : null)}
          />
          {isMe && differenceInMinutes(new Date(), msgDate) < 5 && (
            <button
              type="button"
              className={cn("p-1.5 rounded transition-colors", THEME.bg.hover, THEME.text.secondary)}
              aria-label="Edit message"
              title="Edit"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onEdit(msg)}
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            className={cn("p-1.5 rounded transition-colors", THEME.bg.hover, THEME.text.secondary)}
            aria-label="Reply"
            title="Reply"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onReply(msg)}
          >
            <Reply className="w-4 h-4" />
          </button>
        </div>}
      </div>
    </>
  );
});

interface ChatMessageListProps {
  msgs: ChatItem[];
  users: User[];
  currentUser: User | undefined;
  chatContainerRef: React.Ref<HTMLDivElement>;
  showScrollButton: boolean;
  unreads: number;
  scrollToBottom: (smooth?: boolean) => void;
  isSingleUser: boolean;
  typingUsers: Map<string, { username: string }>;
  getTypingText: () => string | null;
  onReply: (msg: Message) => void;
  onEdit: (msg: Message) => void;
  hasMoreMessages: boolean;
  loadingHistory: boolean;
  onLoadMore: () => void;
  initStatus: "idle" | "loading" | "loaded";
  unreadAfterId: string | null;
}

const MessageListSkeleton = () => {
  const widths = [["60%", "85%"], ["75%", "50%", "65%"], ["55%", "70%"], ["80%"], ["45%", "60%", "55%"]];
  return (
    <div className="space-y-5 py-2" aria-busy="true" aria-live="polite">
      {widths.map((lines, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.25 }}
          className="flex gap-3"
        >
          <div className={cn("w-10 h-10 rounded-full shrink-0 animate-pulse", "bg-black/10 dark:bg-white/10")} />
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex items-center gap-2">
              <div className={cn("h-3 w-20 rounded animate-pulse", "bg-black/10 dark:bg-white/10")} />
              <div className={cn("h-2.5 w-12 rounded animate-pulse", "bg-black/[0.06] dark:bg-white/[0.06]")} />
            </div>
            {lines.map((w, j) => (
              <div
                key={j}
                className={cn("h-3 rounded animate-pulse", "bg-black/[0.07] dark:bg-white/[0.07]")}
                style={{ width: w }}
              />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

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
  onEdit,
  hasMoreMessages,
  loadingHistory,
  onLoadMore,
  initStatus,
  unreadAfterId,
}: ChatMessageListProps) => {
  const { setFollowingId, socket, reactions, profileMap, resendMessage, discardMessage } = useContext(SocketContext);
  const { toast } = useToast();
  const [pickerOpenFor, setPickerOpenFor] = useState<string | null>(null);
  // touch has no hover -> tap a message to reveal its actions
  const [activeMsgId, setActiveMsgId] = useState<string | null>(null);

  // auto-load older history when the top comes into view
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const firstMsgId = msgs[0]?.id;
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasMoreMessages) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) onLoadMore(); },
      { root: el.closest("[data-radix-scroll-area-viewport]"), rootMargin: "200px 0px 0px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // firstMsgId: re-observe after each page so a still-visible sentinel keeps loading
  }, [hasMoreMessages, onLoadMore, firstMsgId]);

  const rows = useMemo(() => layoutRows(groupChatItems(msgs)), [msgs]);
  const usersById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const msgsById = useMemo(() => {
    const map = new Map<string, Message>();
    for (const m of msgs) if (!isSystemMessage(m)) map.set(m.id, m);
    return map;
  }, [msgs]);

  const handleReaction = useCallback((messageId: string, emoji: string) => {
    socket?.emit("reaction-toggle", { messageId, emoji });
    setPickerOpenFor(null);
  }, [socket]);

  const toggleActive = useCallback((id: string) => {
    setActiveMsgId((cur) => (cur === id ? null : id));
  }, []);

  // resend needs current profile; ref keeps the row callback stable across presence updates
  const currentUserRef = useRef(currentUser);
  useEffect(() => { currentUserRef.current = currentUser; });
  const handleResend = useCallback((id: string) => {
    if (currentUserRef.current) resendMessage(id, currentUserRef.current);
  }, [resendMessage]);

  // quote target not loaded -> page back through history until it shows up
  const [jump, setJump] = useState<{ id: string; pages: number } | null>(null);
  const handleJumpTo = useCallback((id: string) => {
    if (!scrollToMessage(id)) setJump({ id, pages: 0 });
  }, []);
  useEffect(() => {
    if (!jump || loadingHistory) return;
    if (scrollToMessage(jump.id)) {
      setJump(null);
    } else if (hasMoreMessages && jump.pages < MAX_JUMP_PAGES) {
      onLoadMore();
      setJump({ ...jump, pages: jump.pages + 1 });
    } else {
      setJump(null);
      const { dismiss } = toast({ title: "Original message isn't available", description: "It was deleted or is too far back." });
      setTimeout(dismiss, 3000);
    }
  }, [jump, loadingHistory, hasMoreMessages, onLoadMore, toast]);

  // sr-only: announce others' new messages; whole-list live region would also read history prepends
  const lastIncoming = useMemo(() => {
    for (let i = msgs.length - 1; i >= 0; i--) {
      const m = msgs[i];
      if (isSystemMessage(m)) continue;
      if (m.sessionId === currentUser?.id) return null;
      return m;
    }
    return null;
  }, [msgs, currentUser?.id]);

  return (
    <div className="flex-1 relative overflow-hidden flex flex-col">
      <ScrollArea className="h-[400px] chat-scroll-area" data-lenis-prevent ref={chatContainerRef} type="always">
        <div className="p-4 space-y-0" role="log" aria-live="off" aria-label="Chat messages">
          {msgs.length > 0 && hasMoreMessages && (
            <div ref={loadMoreRef} className="flex justify-center pb-3">
              <button
                type="button"
                onClick={onLoadMore}
                disabled={loadingHistory}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                  "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10",
                  THEME.text.secondary,
                  loadingHistory && "opacity-50 cursor-not-allowed"
                )}
              >
                {loadingHistory ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load older messages"
                )}
              </button>
            </div>
          )}

          {initStatus !== "loaded" && msgs.length === 0 && (
            <MessageListSkeleton />
          )}

          {initStatus === "loaded" && msgs.length === 0 && (
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

          {rows.map((row) => {
            if (row.kind === "system") {
              return (
                <React.Fragment key={row.key}>
                  <SystemMessageRow users={row.users} />
                  {row.lastId === unreadAfterId && <UnreadDivider />}
                </React.Fragment>
              );
            }
            const { msg } = row;
            const profile = profileMap.get(msg.sessionId);
            const user = usersById.get(msg.sessionId);
            const isMe = msg.sessionId === currentUser?.id;
            const replyOrig = msg.replyTo ? msgsById.get(msg.replyTo.id) : undefined;
            return (
              <React.Fragment key={msg.id}>
              <MessageRow
                msg={msg}
                displayName={profile?.name ?? msg.username}
                displayAvatar={profile?.avatar ?? msg.avatar}
                displayColor={profile?.color ?? msg.color ?? "#60a5fa"}
                isAdmin={!!profile?.isAdmin}
                isMe={isMe}
                isOnline={!!user?.isOnline}
                followSocketId={isMe ? undefined : user?.socketId}
                showHeader={row.showHeader}
                isFirstMsg={row.isFirstMsg}
                dayLabel={row.dayLabel}
                reactions={reactions.get(String(msg.id)) ?? NO_REACTIONS}
                currentSessionId={currentUser?.id}
                replyAvatar={replyOrig?.avatar}
                replyColor={replyOrig?.color}
                isActive={activeMsgId === msg.id}
                isPickerOpen={pickerOpenFor === msg.id}
                onToggleActive={toggleActive}
                onPickerOpenChange={setPickerOpenFor}
                onReact={handleReaction}
                onFollow={setFollowingId}
                onReply={onReply}
                onEdit={onEdit}
                onJumpTo={handleJumpTo}
                onResend={handleResend}
                onDiscard={discardMessage}
              />
              {msg.id === unreadAfterId && <UnreadDivider />}
              </React.Fragment>
            );
          })}
        </div>
      </ScrollArea>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {lastIncoming && `${profileMap.get(lastIncoming.sessionId)?.name ?? lastIncoming.username}: ${lastIncoming.content}`}
      </div>

      {/* row always reserved: popover opens upward, so a mounting row would shove the whole panel */}
      <div className={cn("h-6 px-4 flex items-center", THEME.bg.primary)} aria-live="polite">
        <AnimatePresence>
          {typingUsers.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="flex items-center gap-2 min-w-0"
            >
              <div className="flex items-center gap-0.5 mt-1" aria-hidden="true">
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
              </div>
              <span className={cn("text-xs font-bold truncate", THEME.text.secondary)}>
                {getTypingText()}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
