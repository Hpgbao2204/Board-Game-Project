import type { GameId, MoveId } from "../types/game";
import type { PlayerId } from "../types/player";
import type { RoomCode, RoomSnapshot } from "../types/room";

export type ServerEvent =
  | {
      type: "server_ready";
      payload: {
        service: string;
      };
    }
  | {
      type: "room_snapshot";
      payload: {
        room: RoomSnapshot;
        viewerId?: PlayerId;
      };
    }
  | {
      type: "game_snapshot";
      payload: {
        roomCode: RoomCode;
        gameId: GameId;
        state: unknown;
        currentPlayerId: PlayerId | null;
      };
    }
  | {
      type: "move_applied";
      payload: {
        roomCode: RoomCode;
        playerId: PlayerId;
        moveId: MoveId;
        events?: unknown[];
      };
    }
  | {
      type: "move_rejected";
      payload: {
        roomCode: RoomCode;
        playerId: PlayerId;
        moveId?: MoveId;
        reason: string;
      };
    }
  | {
      type: "player_disconnected";
      payload: {
        roomCode: RoomCode;
        playerId: PlayerId;
      };
    }
  | {
      type: "player_reconnected";
      payload: {
        roomCode: RoomCode;
        playerId: PlayerId;
      };
    }
  | {
      type: "error";
      payload: {
        code: string;
        message: string;
      };
    };
