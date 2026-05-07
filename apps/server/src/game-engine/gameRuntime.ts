import type { MoveId, PlayerId, RoomCode, ServerEvent } from "@board-game-hub/shared";
import { getGameModule } from "./gameRegistry";
import type { RoomStore } from "../store/RoomStore";

interface SubmitMoveInput {
  roomCode: RoomCode;
  playerId: PlayerId;
  moveId: MoveId;
  move: unknown;
}

export interface SubmitMoveResult {
  ok: boolean;
  events: ServerEvent[];
}

export class GameRuntime {
  constructor(private readonly store: RoomStore) {}

  submitMove(input: SubmitMoveInput): SubmitMoveResult {
    const storedRoom = this.store.getByCode(input.roomCode);

    if (!storedRoom || !storedRoom.game) {
      return this.reject(input, "Game has not started.");
    }

    const game = getGameModule(storedRoom.game.gameId);

    if (!game) {
      return this.reject(input, `Unknown game: ${storedRoom.game.gameId}`);
    }

    const validation = game.validateMove({
      state: storedRoom.game.state,
      move: input.move,
      playerId: input.playerId,
      ctx: storedRoom.game.ctx
    });

    if (!validation.ok) {
      return this.reject(input, validation.reason ?? "Move is invalid.");
    }

    const moveResult = game.applyMove({
      state: storedRoom.game.state,
      move: input.move,
      playerId: input.playerId,
      ctx: storedRoom.game.ctx
    });

    const updated = this.store.update(input.roomCode, (room) => ({
      ...room,
      room: {
        ...room.room,
        status:
          game.getGameResult(moveResult.state, storedRoom.game!.ctx).status === "in_progress"
            ? "playing"
            : "finished",
        updatedAt: new Date().toISOString()
      },
      game: {
        ...storedRoom.game!,
        state: moveResult.state
      }
    }));

    if (!updated || !updated.game) {
      return this.reject(input, "Room disappeared while applying the move.");
    }

    return {
      ok: true,
      events: [
        {
          type: "move_applied",
          payload: {
            roomCode: input.roomCode,
            playerId: input.playerId,
            moveId: input.moveId,
            events: moveResult.events
          }
        }
      ]
    };
  }

  createGameSnapshotForViewer(roomCode: RoomCode, viewerId: PlayerId): ServerEvent | null {
    const storedRoom = this.store.getByCode(roomCode);

    if (!storedRoom?.game) {
      return null;
    }

    return this.createGameSnapshot(storedRoom, viewerId);
  }

  private createGameSnapshot(
    storedRoom: NonNullable<ReturnType<RoomStore["getByCode"]>>,
    viewerId: PlayerId
  ): ServerEvent {
    const game = getGameModule(storedRoom.game!.gameId);
    const publicState = game
      ? game.getPublicState({
          state: storedRoom.game!.state,
          viewerId,
          ctx: storedRoom.game!.ctx
        })
      : storedRoom.game!.state;

    return {
      type: "game_snapshot",
      payload: {
        roomCode: storedRoom.room.code,
        gameId: storedRoom.game!.gameId,
        state: publicState,
        currentPlayerId: game
          ? game.getCurrentPlayer(storedRoom.game!.state, storedRoom.game!.ctx)
          : null
      }
    };
  }

  private reject(input: SubmitMoveInput, reason: string): SubmitMoveResult {
    return {
      ok: false,
      events: [
        {
          type: "move_rejected",
          payload: {
            roomCode: input.roomCode,
            playerId: input.playerId,
            moveId: input.moveId,
            reason
          }
        }
      ]
    };
  }
}
