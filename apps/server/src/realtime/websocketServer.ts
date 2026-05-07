import { WebSocketServer } from "ws";
import { ConnectionRegistry } from "./connectionRegistry";
import { errorEvent, parseClientEvent } from "./messages";
import { handleClientEvent, handleDisconnect } from "./protocolHandlers";

export interface WebSocketServerOptions {
  port: number;
}

export function startWebSocketServer(options: WebSocketServerOptions): WebSocketServer {
  const server = new WebSocketServer({
    port: options.port
  });
  const registry = new ConnectionRegistry();

  server.on("connection", (socket) => {
    const connection = registry.add(socket);
    console.info(`[ws] connected ${connection.id}`);

    socket.send(
      JSON.stringify({
        type: "server_ready",
        payload: {
          service: "board-game-hub-server"
        }
      })
    );

    socket.on("pong", () => {
      connection.isAlive = true;
    });

    socket.on("message", (raw) => {
      const event = parseClientEvent(raw.toString());

      if (!event) {
        registry.send(connection, errorEvent("bad_message", "Message is not valid JSON."));
        return;
      }

      handleClientEvent(connection, registry, event);
    });

    socket.on("close", () => {
      handleDisconnect(connection, registry);
      registry.remove(connection.id);
      console.info(`[ws] disconnected ${connection.id}`);
    });
  });

  const heartbeat = setInterval(() => {
    for (const connection of registry.list()) {
      if (!connection.isAlive) {
        connection.socket.terminate();
        continue;
      }

      connection.isAlive = false;
      connection.socket.ping();
    }
  }, 30_000);

  heartbeat.unref();

  server.on("listening", () => {
    console.log(`Board Game Hub WebSocket server listening on :${options.port}`);
  });

  return server;
}
