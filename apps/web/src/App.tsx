import { useMemo, useState } from "react";
import { GAME_CATALOG } from "@board-game-hub/shared";
import type { GameId, PlayerId, RoomSnapshot, ServerEvent } from "@board-game-hub/shared";
import { GameRenderer } from "./games/GameRenderer";
import { useGameSocket } from "./lib/realtime/useGameSocket";

export function App() {
  const { connectionStatus, events, sendEvent } = useGameSocket();
  const [createName, setCreateName] = useState("");
  const [selectedGameId, setSelectedGameId] = useState<GameId>(GAME_CATALOG[0].id);
  const [joinName, setJoinName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const latestRoomSnapshot = useMemo(() => getLatestRoomSnapshot(events), [events]);
  const latestGameSnapshot = useMemo(() => getLatestGameSnapshot(events), [events]);
  const latestError = useMemo(() => getLatestError(events), [events]);
  const viewerId = latestRoomSnapshot?.viewerId;
  const room = latestRoomSnapshot?.room;
  const selectedGame = GAME_CATALOG.find((game) => game.id === selectedGameId) ?? GAME_CATALOG[0];
  const gameState = latestGameSnapshot?.state;
  const isHost = Boolean(room && viewerId && room.hostId === viewerId);
  const canStartGame = Boolean(isHost && room && room.players.length >= 2 && room.status === "lobby");

  function handleCreateRoom(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendEvent({
      type: "create_room",
      payload: {
        displayName: createName,
        gameId: selectedGameId
      }
    });
  }

  function handleMove(move: unknown) {
    if (!room || !viewerId || !gameState) {
      return;
    }

    sendEvent({
      type: "make_move",
      payload: {
        roomCode: room.code,
        playerId: viewerId,
        moveId: crypto.randomUUID(),
        move
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
          <p>Pick a game, create a room, invite friends.</p>
        </div>
        <span className={`connection-badge connection-badge--${connectionStatus}`}>
          {connectionStatus}
        </span>
      </section>

      {room && viewerId ? (
        <section className="game-layout">
          <RoomWaitingArea
            canStartGame={canStartGame}
            isHost={isHost}
            onStartGame={handleStartGame}
            room={room}
            viewerId={viewerId}
          />

          {gameState ? (
            <GameRenderer
              currentPlayerId={latestGameSnapshot?.currentPlayerId ?? null}
              gameId={room.settings.gameId}
              onMove={handleMove}
              room={room}
              state={gameState}
              viewerId={viewerId}
            />
          ) : null}
        </section>
      ) : (
        <section className="lobby-grid">
          <form className="panel create-room-panel" onSubmit={handleCreateRoom}>
            <h2>Create Room</h2>
            <GameCatalog selectedGameId={selectedGameId} onSelectGame={setSelectedGameId} />
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
              Create {selectedGame.name} Room
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

interface GameCatalogProps {
  onSelectGame: (gameId: GameId) => void;
  selectedGameId: GameId;
}

function GameCatalog({ onSelectGame, selectedGameId }: GameCatalogProps) {
  return (
    <fieldset className="game-catalog">
      <legend>Game Catalog</legend>
      {GAME_CATALOG.map((game) => (
        <label
          className={`game-card ${selectedGameId === game.id ? "is-selected" : ""}`}
          key={game.id}
        >
          <input
            checked={selectedGameId === game.id}
            name="game"
            onChange={() => onSelectGame(game.id)}
            type="radio"
          />
          <span>
            <strong>{game.name}</strong>
            <small>
              {game.minPlayers}-{game.maxPlayers} players
            </small>
            <small>{game.description}</small>
          </span>
        </label>
      ))}
    </fieldset>
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
          <p className="muted">Game: {getGameName(room.settings.gameId)}</p>
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

function getGameName(gameId: string) {
  return GAME_CATALOG.find((game) => game.id === gameId)?.name ?? gameId;
}

function getLatestRoomSnapshot(events: ServerEvent[]) {
  return [...events].reverse().find((event) => event.type === "room_snapshot")?.payload;
}

function getLatestGameSnapshot(events: ServerEvent[]) {
  return [...events].reverse().find((event) => event.type === "game_snapshot")?.payload;
}

function getLatestError(events: ServerEvent[]) {
  return [...events].reverse().find((event) => event.type === "error")?.payload.message;
}
