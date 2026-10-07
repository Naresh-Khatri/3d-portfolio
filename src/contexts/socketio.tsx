"use client";
import React, {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { useToast } from "@/components/ui/use-toast";
import { createCursorStore, CursorStoreContext } from "@/contexts/cursor-positions";
import { getDeviceType, type DeviceType } from "@/lib/device-type";

export type User = {
  id: string;
  socketId: string;
  name: string;
  avatar: string;
  color: string;
  isOnline: boolean;
  location: string;
  flag: string;
  deviceType?: DeviceType;
  lastSeen: string;
  createdAt: string;
  isAdmin?: boolean;
};
export type Message = {
  id: string;
  sessionId: string;
  flag: string;
  country: string;
  username: string;
  avatar: string;
  color?: string;
  content: string;
  createdAt: string | Date;
  editedAt?: string | Date;
  replyTo?: { id: string; username: string; content: string };
  // client-only: optimistic send not yet echoed back
  status?: "pending" | "failed";
};

export type SystemMessage = {
  id: string;
  type: "system";
  subtype: "join";
  sessionId: string;
  username: string;
  flag: string;
  createdAt: string | Date;
};

export type ChatItem = Message | SystemMessage;

const LOCAL_ID_PREFIX = "local-";
const SEND_TIMEOUT_MS = 8000;
export const isLocalMsg = (m: ChatItem): m is Message => String(m.id).startsWith(LOCAL_ID_PREFIX);

// names aligned w/ sessionIds; optional -> older backend omits it
export type Reaction = { emoji: string; sessionIds: string[]; names?: string[] };

export type UserProfile = { name: string; avatar: string; color: string; flag?: string; deviceType?: DeviceType; isAdmin?: boolean };

type SocketContextType = {
  socket: Socket | null;
  users: User[];
  setUsers: Dispatch<SetStateAction<User[]>>;
  msgs: ChatItem[];
  reactions: Map<string, Reaction[]>;
  profileMap: Map<string, UserProfile>;
  followingId: string | null;
  setFollowingId: Dispatch<SetStateAction<string | null>>;
  hasMoreMessages: boolean;
  loadingHistory: boolean;
  fetchOlderMessages: () => void;
  initStatus: "idle" | "loading" | "loaded";
  fetchInitialMessages: () => void;
  sendMessage: (content: string, me: User, replyTo?: Message | null) => void;
  resendMessage: (localId: string, me: User) => void;
  discardMessage: (localId: string) => void;
};

const INITIAL_STATE: SocketContextType = {
  socket: null,
  users: [],
  setUsers: () => { },
  msgs: [],
  reactions: new Map(),
  profileMap: new Map(),
  followingId: null,
  setFollowingId: () => { },
  hasMoreMessages: true,
  loadingHistory: false,
  fetchOlderMessages: () => { },
  initStatus: "idle",
  fetchInitialMessages: () => { },
  sendMessage: () => { },
  resendMessage: () => { },
  discardMessage: () => { },
};

export const SocketContext = createContext<SocketContextType>(INITIAL_STATE);

const SESSION_ID_KEY = "portfolio-site-session-id";

const SocketContextProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [msgs, setMsgs] = useState<ChatItem[]>([]);
  const msgsRef = useRef(msgs);
  msgsRef.current = msgs;
  const [reactions, setReactions] = useState<Map<string, Reaction[]>>(new Map());
  const [profileMap, setProfileMap] = useState<Map<string, UserProfile>>(new Map());
  const [cursorStore] = useState(createCursorStore);
  const [followingId, setFollowingId] = useState<string | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  // sync guard: state lags a render, so rapid triggers could double-fetch
  const loadingHistoryRef = useRef(false);
  const [initStatus, setInitStatus] = useState<"idle" | "loading" | "loaded">("idle");
  const socketRef = useRef<Socket | null>(null);
  const initStatusRef = useRef<"idle" | "loading" | "loaded">("idle");

  const fetchInitialMessages = useCallback(() => {
    if (initStatusRef.current !== "idle") return;
    const s = socketRef.current;
    if (!s) return;
    initStatusRef.current = "loading";
    setInitStatus("loading");
    s.emit("msgs-fetch-init");
  }, []);

  const fetchOlderMessages = useCallback(() => {
    const s = socketRef.current;
    if (!s || loadingHistoryRef.current || !hasMoreMessages) return;
    const oldestId = Number(msgsRef.current[0]?.id);
    if (!oldestId) return;
    loadingHistoryRef.current = true;
    setLoadingHistory(true);
    s.emit("msgs-fetch-history", { before: oldestId });
  }, [hasMoreMessages]);

  const localSeq = useRef(0);
  const sendMessage = useCallback((content: string, me: User, replyTo?: Message | null) => {
    const s = socketRef.current;
    if (!s) return;
    const id = `${LOCAL_ID_PREFIX}${++localSeq.current}`;
    const pending: Message = {
      id,
      sessionId: me.id,
      flag: me.flag,
      country: me.location,
      username: me.name,
      avatar: me.avatar,
      color: me.color,
      content,
      createdAt: new Date(),
      replyTo: replyTo ? { id: replyTo.id, username: replyTo.username, content: replyTo.content } : undefined,
      status: "pending",
    };
    setMsgs(p => [...p, pending]);
    s.emit("msg-send", { content, ...(replyTo && { replyTo: replyTo.id }) });
    setTimeout(() => {
      setMsgs(p => p.map(m => m.id === id && (m as Message).status === "pending" ? { ...m, status: "failed" } : m));
    }, SEND_TIMEOUT_MS);
  }, []);

  const discardMessage = useCallback((localId: string) => {
    setMsgs(p => p.filter(m => m.id !== localId));
  }, []);

  const resendMessage = useCallback((localId: string, me: User) => {
    const failed = msgsRef.current.find(m => m.id === localId) as Message | undefined;
    if (!failed) return;
    discardMessage(localId);
    const replyTo = failed.replyTo ? ({ ...failed.replyTo } as Message) : null;
    sendMessage(failed.content, me, replyTo);
  }, [discardMessage, sendMessage]);

  // Keep profileMap in sync — only adds/updates, never removes
  useEffect(() => {
    if (users.length === 0) return;
    setProfileMap(prev => {
      const next = new Map(prev);
      for (const u of users) {
        const flag = u.flag && u.flag !== "??" ? u.flag : prev.get(u.id)?.flag;
        const deviceType = u.deviceType ?? prev.get(u.id)?.deviceType;
        next.set(u.id, { name: u.name, avatar: u.avatar, color: u.color, flag, deviceType, isAdmin: u.isAdmin });
      }
      return next;
    });
  }, [users]);
  const { toast } = useToast();

  // SETUP SOCKET.IO
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_WS_URL) return;
    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL!, {
      auth: {
        sessionId: localStorage.getItem(SESSION_ID_KEY),
        deviceType: getDeviceType(navigator.userAgent, navigator.maxTouchPoints),
      },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelayMax: 5000,
    });
    setSocket(newSocket);
    socketRef.current = newSocket;
    newSocket.on("connect", () => {
      // Resync the latest history after a reconnect (e.g. waking from sleep)
      if (initStatusRef.current === "loaded") {
        newSocket.emit("msgs-fetch-init");
      }
    });
    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });
    newSocket.on("disconnect", (reason) => {
      cursorStore.reset();
      setFollowingId(null);
      setUsers([]);
      // Transport drops auto-reconnect; only a server disconnect needs a manual nudge
      if (reason === "io server disconnect") {
        newSocket.connect();
      }
    });
    newSocket.on("users-updated", (data: User[]) => {
      const onlineIds = new Set(data.filter((user) => user.isOnline).map((user) => user.socketId));
      cursorStore.retain(onlineIds);
      setFollowingId((current) => current && !onlineIds.has(current) ? null : current);
      setUsers(data);
    });
    newSocket.on("cursor-changed", (data: { pos: { x: number; y: number }; socketId: string }) => {
      cursorStore.update(data.socketId, data.pos);
    });
    newSocket.on("msgs-receive-init", (msgs: ChatItem[]) => {
      // unconfirmed sends survive a resync
      setMsgs(prev => [...msgs, ...prev.filter(isLocalMsg)]);
      setHasMoreMessages(true);
      // re-init after reconnect -> any in-flight history reply is gone
      loadingHistoryRef.current = false;
      setLoadingHistory(false);
      initStatusRef.current = "loaded";
      setInitStatus("loaded");
    });
    newSocket.on("msgs-receive-history", (data: { messages: ChatItem[]; hasMore: boolean; reactions: Record<string, Reaction[]> }) => {
      setMsgs(prev => [...data.messages, ...prev]);
      setHasMoreMessages(data.hasMore);
      loadingHistoryRef.current = false;
      setLoadingHistory(false);
      if (data.reactions) {
        setReactions(prev => {
          const next = new Map(prev);
          for (const [msgId, rxns] of Object.entries(data.reactions)) {
            if (rxns.length === 0) next.delete(msgId);
            else next.set(msgId, rxns);
          }
          return next;
        });
      }
    });
    newSocket.on("session", ({ sessionId }) => {
      localStorage.setItem(SESSION_ID_KEY, (sessionId));
    });

    newSocket.on("msg-receive", (msgs) => {
      // Drop live messages until the popover is opened and init has been fetched.
      // The init fetch returns the latest 50 user messages anyway, so nothing is lost.
      if (initStatusRef.current !== "loaded") return;
      setMsgs((p) => {
        const incoming = msgs as ChatItem;
        // own echo confirms a pending send: same content first (server may rewrite it), else oldest
        const mine = (m: ChatItem) =>
          isLocalMsg(m) && m.status === "pending" && m.sessionId === incoming.sessionId;
        let i = p.findIndex(m => mine(m) && (m as Message).content === (incoming as Message).content);
        if (i < 0) i = p.findIndex(mine);
        const rest = i < 0 ? p : p.filter((_, k) => k !== i);
        // locals stay last so server order holds for confirmed messages
        return [...rest.filter(m => !isLocalMsg(m)), incoming, ...rest.filter(isLocalMsg)];
      });
    });

    newSocket.on("warning", (data: { message: string }) => {
      if (data.message.includes("msg-send")) {
        // rate-limited send is dropped server-side -> newest pending failed
        setMsgs(p => {
          const i = p.findLastIndex(m => isLocalMsg(m) && m.status === "pending");
          return i < 0 ? p : p.map((m, k) => (k === i ? { ...m, status: "failed" as const } : m));
        });
      }
      toast({
        variant: "destructive",
        title: "System Warning",
        description: data.message,
      });
    });

    newSocket.on("msg-delete", (data: { id: string | number }) => {
      setMsgs((prev) => prev.filter((m) => String(m.id) !== String(data.id)));
    });

    newSocket.on("msg-update", (data: { id: string; content: string; editedAt: string }) => {
      setMsgs((prev) => prev.map((m) =>
        String(m.id) === String(data.id) && (!("type" in m) || !m.type)
          ? { ...m, content: data.content, editedAt: data.editedAt }
          : m
      ));
    });

    newSocket.on("reactions-init", (data: Record<string, Reaction[]>) => {
      setReactions(new Map(Object.entries(data)));
    });
    newSocket.on("reaction-update", (data: { messageId: string; reactions: Reaction[] }) => {
      setReactions(prev => {
        const next = new Map(prev);
        if (data.reactions.length === 0) next.delete(data.messageId);
        else next.set(data.messageId, data.reactions);
        return next;
      });
    });

    // Kick a reconnect on wake/refocus/network-return; backoff timers can stall through sleep
    const ensureConnected = () => {
      if (!newSocket.connected) newSocket.connect();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") ensureConnected();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", ensureConnected);
    window.addEventListener("focus", ensureConnected);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", ensureConnected);
      window.removeEventListener("focus", ensureConnected);
      newSocket.removeAllListeners();
      newSocket.disconnect();
      cursorStore.reset();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SocketContext.Provider value={{ socket, users, setUsers, msgs, reactions, profileMap, followingId, setFollowingId, hasMoreMessages, loadingHistory, fetchOlderMessages, initStatus, fetchInitialMessages, sendMessage, resendMessage, discardMessage }}>
      <CursorStoreContext.Provider value={cursorStore}>{children}</CursorStoreContext.Provider>
    </SocketContext.Provider>
  );
};

export default SocketContextProvider;
