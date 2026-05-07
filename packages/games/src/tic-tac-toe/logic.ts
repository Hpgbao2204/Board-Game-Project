import type {
  GameContext,
  GameModule,
  GameResult,
  PlayerId,
  ValidationResult
} from "@board-game-hub/shared";
import type { TicTacToeMove, TicTacToeState } from "./types";

const BOARD_SIZE = 9;

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

function getPlayerIds(ctx: GameContext): PlayerId[] {
  return [...ctx.seats]
    .sort((a, b) => a.order - b.order)
    .map((seat) => seat.playerId);
}

function getNextPlayerId(ctx: GameContext, currentPlayerId: PlayerId): PlayerId {
  const playerIds = getPlayerIds(ctx);
  const currentIndex = playerIds.indexOf(currentPlayerId);
  return playerIds[(currentIndex + 1) % playerIds.length];
}

function findWinningLine(board: TicTacToeState["board"]): number[] | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    const mark = board[a];

    if (mark && mark === board[b] && mark === board[c]) {
      return line;
    }
  }

  return null;
}

function validationError(reason: string): ValidationResult {
  return {
    ok: false,
    reason
  };
}

export const ticTacToeGame: GameModule<TicTacToeState, TicTacToeMove, TicTacToeState> = {
  id: "tic-tac-toe",
  name: "Tic Tac Toe",
  minPlayers: 2,
  maxPlayers: 2,
  supportsTeams: false,

  createInitialState(ctx) {
    const playerIds = getPlayerIds(ctx);

    if (playerIds.length !== 2) {
      throw new Error("Tic Tac Toe requires exactly 2 players.");
    }

    return {
      board: Array.from({ length: BOARD_SIZE }, () => null),
      playerMarks: {
        [playerIds[0]]: "X",
        [playerIds[1]]: "O"
      },
      currentPlayerId: playerIds[0],
      winnerPlayerId: null,
      winningLine: null,
      isDraw: false
    };
  },

  getCurrentPlayer(state) {
    if (state.winnerPlayerId || state.isDraw) {
      return null;
    }

    return state.currentPlayerId;
  },

  validateMove({ state, move, playerId }) {
    if (state.winnerPlayerId || state.isDraw) {
      return validationError("Game is already finished.");
    }

    if (playerId !== state.currentPlayerId) {
      return validationError("It is not this player's turn.");
    }

    if (!Number.isInteger(move.cellIndex)) {
      return validationError("Cell index must be an integer.");
    }

    if (move.cellIndex < 0 || move.cellIndex >= BOARD_SIZE) {
      return validationError("Cell index is out of range.");
    }

    if (state.board[move.cellIndex] !== null) {
      return validationError("Cell is already occupied.");
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

    const board = [...state.board];
    board[move.cellIndex] = state.playerMarks[playerId];

    const winningLine = findWinningLine(board);
    const winnerPlayerId = winningLine ? playerId : null;
    const isDraw = !winnerPlayerId && board.every(Boolean);

    const nextState: TicTacToeState = {
      ...state,
      board,
      currentPlayerId:
        winnerPlayerId || isDraw ? state.currentPlayerId : getNextPlayerId(ctx, playerId),
      winnerPlayerId,
      winningLine,
      isDraw
    };

    return {
      state: nextState,
      events: [
        {
          type: "tic_tac_toe_mark_placed",
          payload: {
            cellIndex: move.cellIndex,
            playerId
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
        reason: "Three marks in a row."
      };
    }

    if (state.isDraw) {
      return {
        status: "draw",
        reason: "The board is full."
      };
    }

    return {
      status: "in_progress"
    };
  },

  getPublicState({ state }) {
    return state;
  }
};
