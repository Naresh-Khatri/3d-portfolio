"use client";
import React, {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { generateRandomCursor } from "../lib/generate-random-cursor"

export type User = {
  socketId: string;
  name: string;
  color: string;
  pos: {
    x: number;
    y: number;
  };
  location: string;
  flag: string;
};
export type Message = {
  socketId: string;
  content: string;
  time: Date;
  username: string;
};

export type UserMap = Map<string, User>;

type SocketContextType = {
  socket: Socket | null;
  users: UserMap;
  setUsers: Dispatch<SetStateAction<UserMap>>;
  msgs: Message[];
};

const INITIAL_STATE: SocketContextType = {
  socket: null,
  users: new Map(),
  setUsers: () => {},
  msgs: [],
};

export const SocketContext = createContext<SocketContextType>(INITIAL_STATE);

const SocketContextProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [users, setUsers] = useState<UserMap>(new Map());
  const [msgs, setMsgs] = useState<Message[]>([]);

  // SETUP SOCKET.IO
  useEffect(() => {
    // Only connect if WS_URL is provided
    if (!process.env.NEXT_PUBLIC_WS_URL) {
      return;
    }
    
    const username = localStorage.getItem("username") || generateRandomCursor().name;
    const socket = io(process.env.NEXT_PUBLIC_WS_URL, {
      query: { username },
      reconnection: false, // Disable auto-reconnection to prevent console spam
      timeout: 5000,
    });
    
    setSocket(socket);
    
    socket.on("connect", () => {
      console.log("Socket connected");
    });
    
    socket.on("connect_error", (error) => {
      // Silently handle connection errors
      console.debug("Socket connection error:", error.message);
    });
    
    socket.on("msgs-receive-init", (msgs) => {
      setMsgs(msgs);
    });
    
    socket.on("msg-receive", (msgs) => {
      setMsgs((p) => [...p, msgs]);
    });
    
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socket, users, setUsers, msgs }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContextProvider;
