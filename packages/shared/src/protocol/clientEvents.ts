import type { GameId, MoveId } from "../types/game";
import type { PlayerId } from "../types/player";
import type { RoomCode } from "../types/room";

export type ClientEvent =
  | {
      type: "create_room";
      payload: {
        displayName: string;
        gameId: GameId;
      };
    }
  | {
      type: "join_room";
      payload: {
        roomCode: RoomCode;
        displayName: string;
        playerId?: PlayerId;
      };
    }
  | {
      type: "leave_room";
      payload: {
        roomCode: RoomCode;
        playerId: PlayerId;
      };
    }
  | {
      type: "start_game";
      payload: {
        roomCode: RoomCode;
        playerId: PlayerId;
      };
    }
  | {
      type: "submit_move";
      payload: {
        roomCode: RoomCode;
        playerId: PlayerId;
        moveId: MoveId;
        move: unknown;
      };
    }
  | {
      type: "make_move";
      payload: {
        roomCode: RoomCode;
        playerId: PlayerId;
        moveId: MoveId;
        move: unknown;
      };
    }
  | {
      type: "request_sync";
      payload: {
        roomCode: RoomCode;
        playerId?: PlayerId;
      };
    }
  | {
      type: "heartbeat";
      payload: {
        playerId?: PlayerId;
      };
    };
