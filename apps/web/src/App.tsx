import { useMemo, useState } from "react";
import type { PlayerId, RoomSnapshot, ServerEvent } from "@board-game-hub/shared";
import { useGameSocket } from "./lib/realtime/useGameSocket";

const MVP_GAME_ID = "tic-tac-toe";

export function App() {
  const { connectionStatus, events, sendEvent } = useGameSocket();
  const [createName, setCreateName] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const latestRoomSnapshot = useMemo(() => getLatestRoomSnapshot(events), [events]);
  const latestError = useMemo(() => getLatestError(events), [events]);
  const viewerId = latestRoomSnapshot?.viewerId;
  const room = latestRoomSnapshot?.room;
  const isHost = Boolean(room && viewerId && room.hostId === viewerId);
  const canStartGame = Boolean(isHost && room && room.players.length >= 2 && room.status === "lobby");

  function handleCreateRoom(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendEvent({
      type: "create_room",
      payload: {
        displayName: createName,
        gameId: MVP_GAME_ID
      }
    });
  }

  function handleJoinRoom(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendEvent({
      type: "join_room",
      payload: {
        displayName: joinName,
        roomCode: joinCode.trim().toUpperCase()
      }
    });
  }

  function handleStartGame() {
    if (!room || !viewerId) {
      return;
    }

    sendEvent({
      type: "start_game",
      payload: {
        roomCode: room.code,
        playerId: viewerId
      }
    });
  }

  return (
    <main className="app-shell">
      <section className="app-header">
        <div>
          <h1>Board Game Hub</h1>
          <p>Tic Tac Toe MVP</p>
        </div>
        <span className={`connection-badge connection-badge--${connectionStatus}`}>
          {connectionStatus}
        </span>
      </section>

      {room && viewerId ? (
        <RoomWaitingArea
          canStartGame={canStartGame}
          isHost={isHost}
          onStartGame={handleStartGame}
          room={room}
          viewerId={viewerId}
        />
      ) : (
        <section className="lobby-grid">
          <form className="panel" onSubmit={handleCreateRoom}>
            <h2>Create Room</h2>
            <label>
              Display name
              <input
                autoComplete="name"
                onChange={(event) => setCreateName(event.target.value)}
                placeholder="Alice"
                required
                value={createName}
              />
            </label>
            <button disabled={connectionStatus !== "connected"} type="submit">
              Create
            </button>
          </form>

          <form className="panel" onSubmit={handleJoinRoom}>
            <h2>Join Room</h2>
            <label>
              Display name
              <input
                autoComplete="name"
                onChange={(event) => setJoinName(event.target.value)}
                placeholder="Bob"
                required
                value={joinName}
              />
            </label>
            <label>
              Room code
              <input
                autoCapitalize="characters"
                onChange={(event) => setJoinCode(event.target.value)}
                placeholder="ABCDE"
                required
                value={joinCode}
              />
            </label>
            <button disabled={connectionStatus !== "connected"} type="submit">
              Join
            </button>
          </form>
        </section>
      )}

      {latestError ? <p className="error-message">{latestError}</p> : null}
    </main>
  );
}

interface RoomWaitingAreaProps {
  canStartGame: boolean;
  isHost: boolean;
  onStartGame: () => void;
  room: RoomSnapshot;
  viewerId: PlayerId;
}

function RoomWaitingArea({
  canStartGame,
  isHost,
  onStartGame,
  room,
  viewerId
}: RoomWaitingAreaProps) {
  return (
    <section className="panel room-panel">
      <div className="room-heading">
        <div>
          <p className="eyebrow">Room Code</p>
          <h2>{room.code}</h2>
        </div>
        <span className="room-status">{room.status}</span>
      </div>

      <ul className="player-list">
        {room.players.map((player) => (
          <li key={player.id}>
            <span>
              {player.displayName}
              {player.id === viewerId ? " (you)" : ""}
              {player.id === room.hostId ? " - host" : ""}
            </span>
            <span className={`player-status player-status--${player.connectionStatus}`}>
              {player.connectionStatus}
            </span>
          </li>
        ))}
      </ul>

      {isHost ? (
        <button disabled={!canStartGame} onClick={onStartGame} type="button">
          Start Game
        </button>
      ) : (
        <p className="muted">Waiting for host to start.</p>
      )}
    </section>
  );
}

function getLatestRoomSnapshot(events: ServerEvent[]) {
  return [...events].reverse().find((event) => event.type === "room_snapshot")?.payload;
}

function getLatestError(events: ServerEvent[]) {
  return [...events].reverse().find((event) => event.type === "error")?.payload.message;
}
