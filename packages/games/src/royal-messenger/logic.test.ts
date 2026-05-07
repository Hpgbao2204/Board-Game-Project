import { describe, expect, it } from "vitest";
import type { GameContext } from "@board-game-hub/shared";
import { royalMessengerGame } from "./logic";

const ctx: GameContext = {
  roomId: "room-royal",
  startedAt: "2026-05-07T00:00:00.000Z",
  randomSeed: "royal-seed",
  seats: [
    {
      playerId: "alice",
      order: 0
    },
    {
      playerId: "bob",
      order: 1
    }
  ]
};

describe("royalMessengerGame", () => {
  it("deals one hidden hand plus a drawn turn card to the first player", () => {
    const state = royalMessengerGame.createInitialState(ctx);

    expect(state.players.alice.hand).toHaveLength(2);
    expect(state.players.bob.hand).toHaveLength(1);
    expect(state.currentPlayerId).toBe("alice");
  });

  it("hides other players hands in public state", () => {
    const state = royalMessengerGame.createInitialState(ctx);
    const publicState = royalMessengerGame.getPublicState({
      state,
      viewerId: "alice",
      ctx
    });

    expect(publicState.players.alice.hand[0]).not.toBe("hidden");
    expect(publicState.players.bob.hand).toEqual(["hidden"]);
  });

  it("rejects out of turn moves", () => {
    const state = royalMessengerGame.createInitialState(ctx);

    expect(
      royalMessengerGame.validateMove({
        state,
        move: {
          cardIndex: 0
        },
        playerId: "bob",
        ctx
      })
    ).toEqual({
      ok: false,
      reason: "It is not this player's turn."
    });
  });
});
