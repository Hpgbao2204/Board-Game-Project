import type { PlayerId, RoomSnapshot } from "@board-game-hub/shared";

type TicTacToeMark = "X" | "O";
type TicTacToeCell = TicTacToeMark | null;

export interface TicTacToePublicState {
  board: TicTacToeCell[];
  playerMarks: Record<PlayerId, TicTacToeMark>;
  currentPlayerId: PlayerId;
  winnerPlayerId: PlayerId | null;
  winningLine: number[] | null;
  isDraw: boolean;
}

interface TicTacToeBoardProps {
  currentPlayerId: PlayerId | null;
  onMove: (move: { cellIndex: number }) => void;
  room: RoomSnapshot;
  state: TicTacToePublicState;
  viewerId: PlayerId;
}

export function TicTacToeBoard({
  currentPlayerId,
  onMove,
  room,
  state,
  viewerId
}: TicTacToeBoardProps) {
  const currentPlayer = room.players.find((player) => player.id === currentPlayerId);
  const winner = state.winnerPlayerId
    ? room.players.find((player) => player.id === state.winnerPlayerId)
    : null;
  const viewerMark = state.playerMarks[viewerId];
  const isViewerTurn = currentPlayerId === viewerId;
  const isGameOver = Boolean(state.winnerPlayerId || state.isDraw);

  return (
    <section className="panel game-panel">
      <div className="game-summary">
        <div>
          <p className="eyebrow">Your Symbol</p>
          <strong className="player-mark">{viewerMark}</strong>
        </div>
        <div>
          <p className="eyebrow">Current Turn</p>
          <strong>{currentPlayer ? currentPlayer.displayName : "Game over"}</strong>
        </div>
      </div>

      <div className="tic-tac-toe-board" role="grid" aria-label="Tic Tac Toe board">
        {state.board.map((cell, index) => (
          <button
            aria-label={`Cell ${index + 1}`}
            className={`tic-tac-toe-cell ${state.winningLine?.includes(index) ? "is-winning" : ""}`}
            disabled={Boolean(cell) || !isViewerTurn || isGameOver}
            key={index}
            onClick={() =>
              onMove({
                cellIndex: index
              })
            }
            type="button"
          >
            {cell}
          </button>
        ))}
      </div>

      <p className="game-message">
        {winner
          ? `${winner.displayName} wins.`
          : state.isDraw
            ? "Draw."
            : isViewerTurn
              ? "Your turn."
              : "Waiting for the other player."}
      </p>
    </section>
  );
}
