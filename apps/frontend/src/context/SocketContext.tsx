import { type ReactNode, createContext, useContext, useEffect, useState } from "react";
import { type Socket, io } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionError: string | null;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  connectionError: null,
});

export const useSocket = () => useContext(SocketContext);

// TODO: Make this configurable via env vars
const SERVER_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    const newSocket = io(SERVER_URL, {
      transports: ["websocket"],
      autoConnect: true,
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    newSocket.on("connect_error", (err: Error) => {
      console.error("Socket connection error:", err);
      setIsConnected(false);
      setConnectionError("No se pudo conectar al servidor.");
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, connectionError }}>
      {children}
    </SocketContext.Provider>
  );
};
