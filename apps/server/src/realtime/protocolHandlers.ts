import type { ClientEvent } from "@board-game-hub/shared";
import { GameRuntime } from "../game-engine/gameRuntime";
import { RoomManager } from "../rooms/roomManager";
import { MemoryRoomStore } from "../store/MemoryRoomStore";
import type { ClientConnection, ConnectionRegistry } from "./connectionRegistry";
import { errorEvent } from "./messages";

const store = new MemoryRoomStore();
const roomManager = new RoomManager(store);
const gameRuntime = new GameRuntime(store);

export function handleClientEvent(
  connection: ClientConnection,
  registry: ConnectionRegistry,
  event: ClientEvent
): void {
  console.info(`[event] ${event.type} connection=${connection.id}`);

  switch (event.type) {
    case "create_room":
      handleCreateRoom(connection, registry, event);
      return;
    case "join_room":
      handleJoinRoom(connection, registry, event);
      return;
    case "leave_room":
      handleLeaveRoom(connection, registry, event);
      return;
    case "start_game":
      handleStartGame(connection, registry, event);
      return;
    case "submit_move":
      handleSubmitMove(connection, registry, event);
      return;
    case "request_sync":
      handleRequestSync(connection, registry, event);
      return;
    case "heartbeat":
      registry.send(connection, {
        type: "server_ready",
        payload: {
          service: "board-game-hub-server"
        }
      });
      return;
    default:
      registry.send(connection, errorEvent("unknown_event", "Unknown client event."));
  }
}

export function handleDisconnect(
  connection: ClientConnection,
  registry: ConnectionRegistry
): void {
  if (!connection.roomCode || !connection.playerId) {
    return;
  }

  const result = roomManager.markConnection({
    roomCode: connection.roomCode,
    playerId: connection.playerId,
    connected: false
  });

  if (result.room) {
    registry.broadcast(connection.roomCode, {
      type: "player_disconnected",
      payload: {
        roomCode: connection.roomCode,
        playerId: connection.playerId
      }
    });
    broadcastRoomSnapshot(registry, connection.roomCode);
  }
}

function handleCreateRoom(
  connection: ClientConnection,
  registry: ConnectionRegistry,
  event: Extract<ClientEvent, { type: "create_room" }>
): void {
  const result = roomManager.createRoom(event.payload);

  if (!result.ok || !result.room || !result.playerId) {
    registry.send(connection, errorEvent("create_room_failed", result.error ?? "Create failed."));
    return;
  }

  registry.bindPlayer(connection, result.room.room.code, result.playerId);
  console.info(`[room] created code=${result.room.room.code} host=${result.playerId}`);
  sendRoomSnapshot(registry, connection, result.playerId);
}

function handleJoinRoom(
  connection: ClientConnection,
  registry: ConnectionRegistry,
  event: Extract<ClientEvent, { type: "join_room" }>
): void {
  const result = roomManager.joinRoom(event.payload);

  if (!result.ok || !result.room || !result.playerId) {
    registry.send(connection, errorEvent("join_room_failed", result.error ?? "Join failed."));
    return;
  }

  registry.bindPlayer(connection, result.room.room.code, result.playerId);
  console.info(`[room] joined code=${result.room.room.code} player=${result.playerId}`);
  registry.broadcast(result.room.room.code, {
    type: "player_reconnected",
    payload: {
      roomCode: result.room.room.code,
      playerId: result.playerId
    }
  });
  broadcastRoomSnapshot(registry, result.room.room.code);
}

function handleLeaveRoom(
  connection: ClientConnection,
  registry: ConnectionRegistry,
  event: Extract<ClientEvent, { type: "leave_room" }>
): void {
  const result = roomManager.leaveRoom(event.payload);

  if (!result.ok) {
    registry.send(connection, errorEvent("leave_room_failed", result.error ?? "Leave failed."));
    return;
  }

  if (result.room) {
    console.info(`[room] left code=${event.payload.roomCode} player=${event.payload.playerId}`);
    broadcastRoomSnapshot(registry, event.payload.roomCode);
  }

  connection.roomCode = null;
  connection.playerId = null;
}

function handleStartGame(
  connection: ClientConnection,
  registry: ConnectionRegistry,
  event: Extract<ClientEvent, { type: "start_game" }>
): void {
  const result = roomManager.startGame(event.payload);

  if (!result.ok || !result.room) {
    registry.send(connection, errorEvent("start_game_failed", result.error ?? "Start failed."));
    return;
  }

  broadcastRoomSnapshot(registry, event.payload.roomCode);
  broadcastGameSnapshots(registry, event.payload.roomCode);
  console.info(`[game] started room=${event.payload.roomCode}`);
}

function handleSubmitMove(
  connection: ClientConnection,
  registry: ConnectionRegistry,
  event: Extract<ClientEvent, { type: "submit_move" }>
): void {
  const result = gameRuntime.submitMove(event.payload);

  for (const serverEvent of result.events) {
    if (serverEvent.type === "move_rejected") {
      registry.send(connection, serverEvent);
      continue;
    }

    registry.broadcast(event.payload.roomCode, serverEvent);
  }

  if (result.ok) {
    console.info(
      `[game] move applied room=${event.payload.roomCode} player=${event.payload.playerId} move=${event.payload.moveId}`
    );
    broadcastRoomSnapshot(registry, event.payload.roomCode);
    broadcastGameSnapshots(registry, event.payload.roomCode);
  }
}

function handleRequestSync(
  connection: ClientConnection,
  registry: ConnectionRegistry,
  event: Extract<ClientEvent, { type: "request_sync" }>
): void {
  const storedRoom = roomManager.getRoom(event.payload.roomCode);

  if (!storedRoom) {
    registry.send(connection, errorEvent("sync_failed", "Room not found."));
    return;
  }

  const viewerId = event.payload.playerId ?? connection.playerId ?? undefined;

  registry.send(connection, {
    type: "room_snapshot",
    payload: {
      room: storedRoom.room,
      viewerId
    }
  });

  if (viewerId) {
    const snapshot = gameRuntime.createGameSnapshotForViewer(event.payload.roomCode, viewerId);

    if (snapshot) {
      registry.send(connection, snapshot);
    }
  }
}

function sendRoomSnapshot(
  registry: ConnectionRegistry,
  connection: ClientConnection,
  viewerId?: string
): void {
  if (!connection.roomCode) {
    return;
  }

  const storedRoom = roomManager.getRoom(connection.roomCode);

  if (!storedRoom) {
    return;
  }

  registry.send(connection, {
    type: "room_snapshot",
    payload: {
      room: storedRoom.room,
      viewerId
    }
  });
}

function broadcastRoomSnapshot(registry: ConnectionRegistry, roomCode: string): void {
  const storedRoom = roomManager.getRoom(roomCode);

  if (!storedRoom) {
    return;
  }

  for (const connection of registry.getRoomConnections(roomCode)) {
    registry.send(connection, {
      type: "room_snapshot",
      payload: {
        room: storedRoom.room,
        viewerId: connection.playerId ?? undefined
      }
    });
  }
}

function broadcastGameSnapshots(registry: ConnectionRegistry, roomCode: string): void {
  for (const connection of registry.getRoomConnections(roomCode)) {
    if (!connection.playerId) {
      continue;
    }

    const snapshot = gameRuntime.createGameSnapshotForViewer(roomCode, connection.playerId);

    if (snapshot) {
      registry.send(connection, snapshot);
    }
  }
}
