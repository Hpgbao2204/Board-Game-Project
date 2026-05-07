import type {
  GameContext,
  Player,
  PlayerId,
  RoomCode,
  RoomSettings
} from "@board-game-hub/shared";
import { getGameModule } from "../game-engine/gameRegistry";
import type { RoomStore, StoredRoom } from "../store/RoomStore";
import { createRoomCode } from "./roomCode";

interface CreateRoomInput {
  displayName: string;
  gameId: string;
}

interface JoinRoomInput {
  roomCode: RoomCode;
  displayName: string;
  playerId?: PlayerId;
}

interface PlayerRoomInput {
  roomCode: RoomCode;
  playerId: PlayerId;
}

export interface RoomActionResult {
  ok: boolean;
  room?: StoredRoom;
  playerId?: PlayerId;
  error?: string;
}

export class RoomManager {
  constructor(private readonly store: RoomStore) {}

  createRoom(input: CreateRoomInput): RoomActionResult {
    const game = getGameModule(input.gameId);

    if (!game) {
      return {
        ok: false,
        error: `Unknown game: ${input.gameId}`
      };
    }

    const now = new Date().toISOString();
    const host = this.createPlayer(input.displayName);
    const code = createRoomCode(new Set(this.store.list().map((storedRoom) => storedRoom.room.code)));
    const settings: RoomSettings = {
      gameId: game.id,
      maxPlayers: game.maxPlayers,
      allowSpectators: false
    };

    const room: StoredRoom = {
      room: {
        id: crypto.randomUUID(),
        code,
        hostId: host.id,
        status: "lobby",
        settings,
        players: [host],
        createdAt: now,
        updatedAt: now
      },
      game: null
    };

    return {
      ok: true,
      room: this.store.create(room),
      playerId: host.id
    };
  }

  joinRoom(input: JoinRoomInput): RoomActionResult {
    const existing = this.store.getByCode(input.roomCode);

    if (!existing) {
      return {
        ok: false,
        error: "Room not found."
      };
    }

    if (existing.room.status !== "lobby") {
      return {
        ok: false,
        error: "Room is not accepting new players."
      };
    }

    const matchingPlayer = input.playerId
      ? existing.room.players.find((player) => player.id === input.playerId)
      : undefined;

    if (matchingPlayer) {
      return this.markConnection({
        roomCode: input.roomCode,
        playerId: matchingPlayer.id,
        connected: true
      });
    }

    if (existing.room.players.length >= existing.room.settings.maxPlayers) {
      return {
        ok: false,
        error: "Room is full."
      };
    }

    const player = this.createPlayer(input.displayName);
    const updated = this.store.update(input.roomCode, (storedRoom) => ({
      ...storedRoom,
      room: {
        ...storedRoom.room,
        players: [...storedRoom.room.players, player],
        updatedAt: new Date().toISOString()
      }
    }));

    return {
      ok: Boolean(updated),
      room: updated ?? undefined,
      playerId: player.id,
      error: updated ? undefined : "Room not found."
    };
  }

  leaveRoom(input: PlayerRoomInput): RoomActionResult {
    const existing = this.store.getByCode(input.roomCode);

    if (!existing) {
      return {
        ok: false,
        error: "Room not found."
      };
    }

    const remainingPlayers = existing.room.players.filter((player) => player.id !== input.playerId);

    if (remainingPlayers.length === existing.room.players.length) {
      return {
        ok: false,
        error: "Player is not in this room."
      };
    }

    if (remainingPlayers.length === 0) {
      this.store.delete(input.roomCode);
      return {
        ok: true,
        playerId: input.playerId
      };
    }

    const hostId =
      existing.room.hostId === input.playerId ? remainingPlayers[0].id : existing.room.hostId;

    const updated = this.store.update(input.roomCode, (storedRoom) => ({
      ...storedRoom,
      room: {
        ...storedRoom.room,
        hostId,
        players: remainingPlayers,
        updatedAt: new Date().toISOString()
      }
    }));

    return {
      ok: Boolean(updated),
      room: updated ?? undefined,
      playerId: input.playerId,
      error: updated ? undefined : "Room not found."
    };
  }

  markConnection(input: PlayerRoomInput & { connected: boolean }): RoomActionResult {
    const updated = this.store.update(input.roomCode, (storedRoom) => ({
      ...storedRoom,
      room: {
        ...storedRoom.room,
        players: storedRoom.room.players.map((player) =>
          player.id === input.playerId
            ? {
                ...player,
                connectionStatus: input.connected ? "connected" : "disconnected"
              }
            : player
        ),
        updatedAt: new Date().toISOString()
      }
    }));

    return {
      ok: Boolean(updated),
      room: updated ?? undefined,
      playerId: input.playerId,
      error: updated ? undefined : "Room not found."
    };
  }

  startGame(input: PlayerRoomInput): RoomActionResult {
    const existing = this.store.getByCode(input.roomCode);

    if (!existing) {
      return {
        ok: false,
        error: "Room not found."
      };
    }

    if (existing.room.hostId !== input.playerId) {
      return {
        ok: false,
        error: "Only the host can start the game."
      };
    }

    const game = getGameModule(existing.room.settings.gameId);

    if (!game) {
      return {
        ok: false,
        error: `Unknown game: ${existing.room.settings.gameId}`
      };
    }

    if (
      existing.room.players.length < game.minPlayers ||
      existing.room.players.length > game.maxPlayers
    ) {
      return {
        ok: false,
        error: `This game requires ${game.minPlayers}-${game.maxPlayers} players.`
      };
    }

    const now = new Date().toISOString();
    const ctx: GameContext = {
      roomId: existing.room.id,
      startedAt: now,
      randomSeed: crypto.randomUUID(),
      seats: existing.room.players.map((player, order) => ({
        playerId: player.id,
        teamId: player.teamId,
        order
      }))
    };

    const updated = this.store.update(input.roomCode, (storedRoom) => ({
      ...storedRoom,
      room: {
        ...storedRoom.room,
        status: "playing",
        updatedAt: now
      },
      game: {
        gameId: game.id,
        ctx,
        state: game.createInitialState(ctx)
      }
    }));

    return {
      ok: Boolean(updated),
      room: updated ?? undefined,
      playerId: input.playerId,
      error: updated ? undefined : "Room not found."
    };
  }

  getRoom(roomCode: RoomCode): StoredRoom | null {
    return this.store.getByCode(roomCode);
  }

  private createPlayer(displayName: string): Player {
    return {
      id: crypto.randomUUID(),
      displayName: displayName.trim() || "Player",
      connectionStatus: "connected"
    };
  }
}
