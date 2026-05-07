import { describe, expect, it } from "vitest";
import type { GameContext } from "@board-game-hub/shared";
import { ticTacToeGame } from "./logic";

const ctx: GameContext = {
  roomId: "room-1",
  startedAt: "2026-05-07T00:00:00.000Z",
  randomSeed: "seed",
  seats: [
    {
      playerId: "player-1",
      order: 0
    },
    {
      playerId: "player-2",
      order: 1
    }
  ]
};

describe("ticTacToeGame", () => {
  it("creates an empty board and assigns marks by seat order", () => {
    const state = ticTacToeGame.createInitialState(ctx);

    expect(state.board).toHaveLength(9);
    expect(state.board.every((cell) => cell === null)).toBe(true);
    expect(state.playerMarks["player-1"]).toBe("X");
    expect(state.playerMarks["player-2"]).toBe("O");
    expect(state.currentPlayerId).toBe("player-1");
  });

  it("rejects moves outside the current turn", () => {
    const state = ticTacToeGame.createInitialState(ctx);

    expect(
      ticTacToeGame.validateMove({
        state,
        move: {
          cellIndex: 0
        },
        playerId: "player-2",
        ctx
      })
    ).toEqual({
      ok: false,
      reason: "It is not this player's turn."
    });
  });

  it("detects a win", () => {
    let state = ticTacToeGame.createInitialState(ctx);

    state = ticTacToeGame.applyMove({
      state,
      move: { cellIndex: 0 },
      playerId: "player-1",
      ctx
    }).state;
    state = ticTacToeGame.applyMove({
      state,
      move: { cellIndex: 3 },
      playerId: "player-2",
      ctx
    }).state;
    state = ticTacToeGame.applyMove({
      state,
      move: { cellIndex: 1 },
      playerId: "player-1",
      ctx
    }).state;
    state = ticTacToeGame.applyMove({
      state,
      move: { cellIndex: 4 },
      playerId: "player-2",
      ctx
    }).state;
    state = ticTacToeGame.applyMove({
      state,
      move: { cellIndex: 2 },
      playerId: "player-1",
      ctx
    }).state;

    const result = ticTacToeGame.getGameResult(state, ctx);

    expect(result.status).toBe("won");
    expect(result.status === "won" ? result.winnerPlayerIds : []).toEqual(["player-1"]);
    expect(state.winningLine).toEqual([0, 1, 2]);
  });
});
