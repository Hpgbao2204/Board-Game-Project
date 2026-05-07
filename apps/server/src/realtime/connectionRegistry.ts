import type { PlayerId, RoomCode, ServerEvent } from "@board-game-hub/shared";
import { WebSocket } from "ws";

export interface ClientConnection {
  id: string;
  socket: WebSocket;
  playerId: PlayerId | null;
  roomCode: RoomCode | null;
  isAlive: boolean;
}

export class ConnectionRegistry {
  private readonly connections = new Map<string, ClientConnection>();

  add(socket: WebSocket): ClientConnection {
    const connection: ClientConnection = {
      id: crypto.randomUUID(),
      socket,
      playerId: null,
      roomCode: null,
      isAlive: true
    };

    this.connections.set(connection.id, connection);
    return connection;
  }

  remove(connectionId: string): void {
    this.connections.delete(connectionId);
  }

  bindPlayer(connection: ClientConnection, roomCode: RoomCode, playerId: PlayerId): void {
    connection.roomCode = roomCode;
    connection.playerId = playerId;
  }

  getRoomConnections(roomCode: RoomCode): ClientConnection[] {
    return [...this.connections.values()].filter((connection) => connection.roomCode === roomCode);
  }

  getPlayerConnection(roomCode: RoomCode, playerId: PlayerId): ClientConnection | null {
    return (
      this.getRoomConnections(roomCode).find((connection) => connection.playerId === playerId) ??
      null
    );
  }

  list(): ClientConnection[] {
    return [...this.connections.values()];
  }

  send(connection: ClientConnection, event: ServerEvent): void {
    if (connection.socket.readyState === WebSocket.OPEN) {
      connection.socket.send(JSON.stringify(event));
    }
  }

  broadcast(roomCode: RoomCode, event: ServerEvent): void {
    for (const connection of this.getRoomConnections(roomCode)) {
      this.send(connection, event);
    }
  }
}
