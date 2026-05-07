import type { PlayerId } from "@board-game-hub/shared";

export type TicTacToeMark = "X" | "O";
export type TicTacToeCell = TicTacToeMark | null;

export interface TicTacToeState {
  board: TicTacToeCell[];
  playerMarks: Record<PlayerId, TicTacToeMark>;
  currentPlayerId: PlayerId;
  winnerPlayerId: PlayerId | null;
  winningLine: number[] | null;
  isDraw: boolean;
}

export interface TicTacToeMove {
  cellIndex: number;
}
