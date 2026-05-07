import { useCallback, useEffect, useRef, useState } from "react";
import type { ClientEvent, ServerEvent } from "@board-game-hub/shared";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

const DEFAULT_WS_URL = "ws://127.0.0.1:8787";

export function useGameSocket(url = DEFAULT_WS_URL) {
  const socketRef = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const [events, setEvents] = useState<ServerEvent[]>([]);

  useEffect(() => {
    const socket = new WebSocket(url);
    socketRef.current = socket;
    setConnectionStatus("connecting");

    socket.addEventListener("open", () => {
      setConnectionStatus("connected");
    });

    socket.addEventListener("message", (message) => {
      try {
        const event = JSON.parse(message.data) as ServerEvent;
        setEvents((currentEvents) => [...currentEvents, event]);
      } catch {
        setEvents((currentEvents) => [
          ...currentEvents,
          {
            type: "error",
            payload: {
              code: "bad_server_message",
              message: "Server sent an unreadable message."
            }
          }
        ]);
      }
    });

    socket.addEventListener("close", () => {
      setConnectionStatus("disconnected");
    });

    socket.addEventListener("error", () => {
      setConnectionStatus("disconnected");
    });

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [url]);

  const sendEvent = useCallback((event: ClientEvent): boolean => {
    const socket = socketRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    socket.send(JSON.stringify(event));
    return true;
  }, []);

  return {
    connectionStatus,
    events,
    sendEvent
  };
}
