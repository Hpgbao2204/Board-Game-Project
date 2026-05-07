import type { PlayerId, RoomSnapshot } from "@board-game-hub/shared";
import {
  RoyalMessengerBoard,
  type RoyalMessengerPublicState
} from "./royal-messenger/RoyalMessengerBoard";
import { TicTacToeBoard, type TicTacToePublicState } from "./tic-tac-toe/TicTacToeBoard";

interface GameRendererProps {
  currentPlayerId: PlayerId | null;
  gameId: string;
  onMove: (move: unknown) => void;
  room: RoomSnapshot;
  state: unknown;
  viewerId: PlayerId;
}

export function GameRenderer({
  currentPlayerId,
  gameId,
  onMove,
  room,
  state,
  viewerId
}: GameRendererProps) {
  if (gameId === "tic-tac-toe") {
    return (
      <TicTacToeBoard
        currentPlayerId={currentPlayerId}
        onMove={onMove}
        room={room}
        state={state as TicTacToePublicState}
        viewerId={viewerId}
      />
    );
  }

  if (gameId === "royal-messenger") {
    return (
      <RoyalMessengerBoard
        currentPlayerId={currentPlayerId}
        onMove={onMove}
        room={room}
        state={state as RoyalMessengerPublicState}
        viewerId={viewerId}
      />
    );
  }

  return (
    <section className="panel game-panel">
      <h2>Unsupported Game</h2>
      <p className="muted">No renderer is registered for {gameId} yet.</p>
    </section>
  );
}
