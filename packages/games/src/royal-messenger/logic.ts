import type {
  GameContext,
  GameModule,
  GameResult,
  PlayerId,
  ValidationResult
} from "@board-game-hub/shared";
import { createRoyalDeck, ROYAL_CARDS } from "./cards";
import type {
  RoyalCardId,
  RoyalMessengerMove,
  RoyalMessengerPublicState,
  RoyalMessengerState
} from "./types";

function getPlayerIds(ctx: GameContext): PlayerId[] {
  return [...ctx.seats]
    .sort((a, b) => a.order - b.order)
    .map((seat) => seat.playerId);
}

function shuffle(deck: RoyalCardId[], seed: string): RoyalCardId[] {
  const next = [...deck];
  let value = [...seed].reduce((acc, char) => acc + char.charCodeAt(0), 0) || 1;

  for (let index = next.length - 1; index > 0; index -= 1) {
    value = (value * 9301 + 49297) % 233280;
    const swapIndex = value % (index + 1);
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

function drawCard(state: RoyalMessengerState, playerId: PlayerId): RoyalMessengerState {
  if (state.deck.length === 0) {
    return state;
  }

  const [card, ...deck] = state.deck;
  return {
    ...state,
    deck,
    players: {
      ...state.players,
      [playerId]: {
        ...state.players[playerId],
        hand: [...state.players[playerId].hand, card]
      }
    }
  };
}

function getActivePlayers(state: RoyalMessengerState): PlayerId[] {
  return state.playerOrder.filter((playerId) => !state.players[playerId].eliminated);
}

function getNextPlayerId(state: RoyalMessengerState): PlayerId | null {
  const activePlayers = getActivePlayers(state);

  if (activePlayers.length <= 1) {
    return null;
  }

  const currentIndex = state.playerOrder.indexOf(state.currentPlayerId);

  for (let offset = 1; offset <= state.playerOrder.length; offset += 1) {
    const candidate = state.playerOrder[(currentIndex + offset) % state.playerOrder.length];

    if (!state.players[candidate].eliminated) {
      return candidate;
    }
  }

  return null;
}

function determineDeckOutWinner(state: RoyalMessengerState): PlayerId {
  return getActivePlayers(state)
    .map((playerId) => ({
      playerId,
      rank: ROYAL_CARDS[state.players[playerId].hand[0]].rank,
      discardScore: state.players[playerId].discard.reduce(
        (total, cardId) => total + ROYAL_CARDS[cardId].rank,
        0
      )
    }))
    .sort((a, b) => b.rank - a.rank || b.discardScore - a.discardScore)[0].playerId;
}

function validationError(reason: string): ValidationResult {
  return {
    ok: false,
    reason
  };
}

export const royalMessengerGame: GameModule<
  RoyalMessengerState,
  RoyalMessengerMove,
  RoyalMessengerPublicState
> = {
  id: "royal-messenger",
  name: "Royal Messenger",
  minPlayers: 2,
  maxPlayers: 4,
  supportsTeams: false,

  createInitialState(ctx) {
    const playerOrder = getPlayerIds(ctx);

    if (playerOrder.length < 2 || playerOrder.length > 4) {
      throw new Error("Royal Messenger requires 2-4 players.");
    }

    let deck = shuffle(createRoyalDeck(), ctx.randomSeed);
    const players: RoyalMessengerState["players"] = {};

    for (const playerId of playerOrder) {
      const [card, ...remainingDeck] = deck;
      deck = remainingDeck;
      players[playerId] = {
        hand: [card],
        discard: [],
        eliminated: false,
        protected: false
      };
    }

    const initialState: RoyalMessengerState = {
      deck,
      players,
      playerOrder,
      currentPlayerId: playerOrder[0],
      winnerPlayerId: null,
      log: ["The royal court is seated."]
    };

    return drawCard(initialState, playerOrder[0]);
  },

  getCurrentPlayer(state) {
    return state.winnerPlayerId ? null : state.currentPlayerId;
  },

  validateMove({ state, move, playerId }) {
    if (state.winnerPlayerId) {
      return validationError("Game is already finished.");
    }

    if (playerId !== state.currentPlayerId) {
      return validationError("It is not this player's turn.");
    }

    const player = state.players[playerId];
    const cardId = player.hand[move.cardIndex];

    if (!cardId) {
      return validationError("Selected card is not in hand.");
    }

    if (["page", "scout", "duelist"].includes(cardId)) {
      if (!move.targetPlayerId) {
        return validationError("This card requires a target.");
      }

      if (move.targetPlayerId === playerId) {
        return validationError("You cannot target yourself.");
      }

      const target = state.players[move.targetPlayerId];

      if (!target || target.eliminated) {
        return validationError("Target is not active.");
      }

      if (target.protected) {
        return validationError("Target is protected.");
      }
    }

    if (cardId === "page" && (!move.guessedCardId || move.guessedCardId === "page")) {
      return validationError("Page must guess a non-Page card.");
    }

    return {
      ok: true
    };
  },

  applyMove({ state, move, playerId, ctx }) {
    const validation = this.validateMove({ state, move, playerId, ctx });

    if (!validation.ok) {
      throw new Error(validation.reason);
    }

    const cardId = state.players[playerId].hand[move.cardIndex];
    let nextState: RoyalMessengerState = {
      ...state,
      players: {
        ...state.players,
        [playerId]: {
          ...state.players[playerId],
          hand: state.players[playerId].hand.filter((_, index) => index !== move.cardIndex),
          discard: [...state.players[playerId].discard, cardId],
          protected: false
        }
      },
      log: [`${ROYAL_CARDS[cardId].name} was played.`, ...state.log].slice(0, 8)
    };

    const targetId = move.targetPlayerId;

    if (cardId === "shield") {
      nextState.players[playerId].protected = true;
      nextState.log = ["Shield protects its player.", ...nextState.log].slice(0, 8);
    }

    if (targetId && cardId === "page" && move.guessedCardId) {
      const targetHand = nextState.players[targetId].hand[0];

      if (targetHand === move.guessedCardId) {
        nextState.players[targetId].eliminated = true;
        nextState.log = ["The Page guessed correctly.", ...nextState.log].slice(0, 8);
      } else {
        nextState.log = ["The Page guessed wrong.", ...nextState.log].slice(0, 8);
      }
    }

    if (targetId && cardId === "scout") {
      nextState.log = ["The Scout gathered secret information.", ...nextState.log].slice(0, 8);
    }

    if (targetId && cardId === "duelist") {
      const playerRank = ROYAL_CARDS[nextState.players[playerId].hand[0]].rank;
      const targetRank = ROYAL_CARDS[nextState.players[targetId].hand[0]].rank;

      if (playerRank > targetRank) {
        nextState.players[targetId].eliminated = true;
        nextState.log = ["The Duelist defeated the target.", ...nextState.log].slice(0, 8);
      } else if (targetRank > playerRank) {
        nextState.players[playerId].eliminated = true;
        nextState.log = ["The Duelist lost the duel.", ...nextState.log].slice(0, 8);
      } else {
        nextState.log = ["The duel ended in a tie.", ...nextState.log].slice(0, 8);
      }
    }

    const activePlayers = getActivePlayers(nextState);

    if (activePlayers.length === 1) {
      nextState = {
        ...nextState,
        winnerPlayerId: activePlayers[0]
      };
    } else if (nextState.deck.length === 0) {
      nextState = {
        ...nextState,
        winnerPlayerId: determineDeckOutWinner(nextState)
      };
    } else {
      const nextPlayerId = getNextPlayerId(nextState);
      nextState = nextPlayerId
        ? drawCard(
            {
              ...nextState,
              currentPlayerId: nextPlayerId,
              players: {
                ...nextState.players,
                [nextPlayerId]: {
                  ...nextState.players[nextPlayerId],
                  protected: false
                }
              }
            },
            nextPlayerId
          )
        : nextState;
    }

    return {
      state: nextState,
      events: [
        {
          type: "royal_messenger_card_played",
          payload: {
            cardId,
            playerId,
            targetPlayerId: targetId
          }
        }
      ]
    };
  },

  getGameResult(state): GameResult {
    if (state.winnerPlayerId) {
      return {
        status: "won",
        winnerPlayerIds: [state.winnerPlayerId],
        reason: "The court has chosen a winner."
      };
    }

    return {
      status: "in_progress"
    };
  },

  getPublicState({ state, viewerId }) {
    return {
      deckCount: state.deck.length,
      playerOrder: state.playerOrder,
      currentPlayerId: state.winnerPlayerId ? null : state.currentPlayerId,
      winnerPlayerId: state.winnerPlayerId,
      log: state.log,
      players: Object.fromEntries(
        Object.entries(state.players).map(([playerId, playerState]) => [
          playerId,
          {
            hand:
              playerId === viewerId
                ? playerState.hand
                : playerState.hand.map(() => "hidden" as const),
            handCount: playerState.hand.length,
            discard: playerState.discard,
            eliminated: playerState.eliminated,
            protected: playerState.protected
          }
        ])
      )
    };
  }
};
