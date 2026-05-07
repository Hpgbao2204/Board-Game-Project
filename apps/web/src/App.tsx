import { useMemo, useState } from "react";
import {
  Bell,
  BookOpen,
  ChevronLeft,
  Gamepad2,
  LogIn,
  MessageSquare,
  Moon,
  Play,
  Search,
  Sparkles,
  Sun,
  Trophy,
  UserRound,
  UsersRound
} from "lucide-react";
import { GAME_CATALOG } from "@board-game-hub/shared";
import type { GameId, PlayerId, RoomSnapshot, ServerEvent } from "@board-game-hub/shared";
import { GameRenderer } from "./games/GameRenderer";
import { useGameSocket } from "./lib/realtime/useGameSocket";

const catalogDetails: Record<string, { cover: string; complexity: string; playtime: string }> = {
  "tic-tac-toe": {
    cover: "from-cyan-400 via-blue-500 to-indigo-700",
    complexity: "Easy",
    playtime: "3 min"
  }
};

export function App() {
  const { connectionStatus, events, sendEvent } = useGameSocket();
  const [createName, setCreateName] = useState("");
  const [selectedGameId, setSelectedGameId] = useState<GameId>(GAME_CATALOG[0].id);
  const [joinName, setJoinName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const latestRoomSnapshot = useMemo(() => getLatestRoomSnapshot(events), [events]);
  const latestGameSnapshot = useMemo(() => getLatestGameSnapshot(events), [events]);
  const latestError = useMemo(() => getLatestError(events), [events]);
  const viewerId = latestRoomSnapshot?.viewerId;
  const room = latestRoomSnapshot?.room;
  const selectedGame = GAME_CATALOG.find((game) => game.id === selectedGameId) ?? GAME_CATALOG[0];
  const gameState = latestGameSnapshot?.state;
  const displayName = room?.players.find((player) => player.id === viewerId)?.displayName ?? "Guest";
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

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <main className="min-h-screen bg-slate-100 text-slate-950 transition-colors dark:bg-slate-950 dark:text-slate-100">
        <div className="flex min-h-screen">
          <Sidebar collapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed((v) => !v)} />

          <section className="min-w-0 flex-1">
            <TopNav
              connectionStatus={connectionStatus}
              displayName={displayName}
              isDarkMode={isDarkMode}
              onToggleTheme={() => setIsDarkMode((v) => !v)}
            />

            <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-5 sm:px-6 lg:px-8">
              {room && viewerId ? (
                <TableLobby
                  canStartGame={canStartGame}
                  currentPlayerId={latestGameSnapshot?.currentPlayerId ?? null}
                  gameState={gameState}
                  isHost={isHost}
                  onMove={handleMove}
                  onStartGame={handleStartGame}
                  room={room}
                  viewerId={viewerId}
                />
              ) : (
                <Dashboard
                  createName={createName}
                  joinCode={joinCode}
                  joinName={joinName}
                  onCreateRoom={handleCreateRoom}
                  onJoinRoom={handleJoinRoom}
                  onSelectGame={setSelectedGameId}
                  selectedGameId={selectedGameId}
                  selectedGameName={selectedGame.name}
                  setCreateName={setCreateName}
                  setJoinCode={setJoinCode}
                  setJoinName={setJoinName}
                  socketReady={connectionStatus === "connected"}
                />
              )}

              {latestError ? (
                <p className="rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-700 dark:text-red-200">
                  {latestError}
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const items = [
    { icon: Play, label: "Play" },
    { icon: Gamepad2, label: "Games Catalog" },
    { icon: UsersRound, label: "Community" },
    { icon: UserRound, label: "Profile" }
  ];

  return (
    <aside
      className={`hidden border-r border-white/10 bg-slate-900 text-slate-100 transition-all lg:block ${
        collapsed ? "w-20" : "w-72"
      }`}
    >
      <div className="flex h-full flex-col gap-6 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-500 shadow-glow">
              <Gamepad2 size={22} />
            </div>
            {!collapsed ? (
              <div>
                <p className="text-sm font-black uppercase tracking-wide">Board Hub</p>
                <p className="text-xs text-slate-400">Private tables</p>
              </div>
            ) : null}
          </div>
          <button
            className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 p-0 text-slate-200"
            onClick={onToggle}
            type="button"
          >
            <ChevronLeft className={collapsed ? "rotate-180" : ""} size={18} />
          </button>
        </div>

        <nav className="grid gap-2">
          {items.map((item) => (
            <a
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-slate-300 hover:bg-white/10 hover:text-white"
              href="#"
              key={item.label}
            >
              <item.icon size={19} />
              {!collapsed ? <span>{item.label}</span> : null}
            </a>
          ))}
        </nav>

        {!collapsed ? (
          <div className="mt-auto rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4">
            <p className="text-sm font-black">Friend Hub MVP</p>
            <p className="mt-1 text-xs text-slate-300">Add games one module at a time.</p>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function TopNav({
  connectionStatus,
  displayName,
  isDarkMode,
  onToggleTheme
}: {
  connectionStatus: string;
  displayName: string;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/80 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-slate-950/80 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="relative hidden flex-1 sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className="h-11 w-full max-w-xl rounded-xl border border-slate-200 bg-slate-100 pl-10 text-sm outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5"
            placeholder="Search games, tables, friends..."
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className={`connection-pill connection-pill--${connectionStatus}`}>
            {connectionStatus}
          </span>
          <button
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white p-0 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
            onClick={onToggleTheme}
            type="button"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white p-0 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
            <Bell size={18} />
          </button>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/5">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-sm font-black text-white">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-black">{displayName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Casual player</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Dashboard({
  createName,
  joinCode,
  joinName,
  onCreateRoom,
  onJoinRoom,
  onSelectGame,
  selectedGameId,
  selectedGameName,
  setCreateName,
  setJoinCode,
  setJoinName,
  socketReady
}: {
  createName: string;
  joinCode: string;
  joinName: string;
  onCreateRoom: (event: React.FormEvent<HTMLFormElement>) => void;
  onJoinRoom: (event: React.FormEvent<HTMLFormElement>) => void;
  onSelectGame: (gameId: GameId) => void;
  selectedGameId: GameId;
  selectedGameName: string;
  setCreateName: (value: string) => void;
  setJoinCode: (value: string) => void;
  setJoinName: (value: string) => void;
  socketReady: boolean;
}) {
  return (
    <>
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900 text-white shadow-2xl">
        <div className="grid gap-8 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.5),_transparent_34%),linear-gradient(135deg,_rgba(15,23,42,0.95),_rgba(30,41,59,0.9))] p-6 sm:p-8 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="grid content-center gap-5">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-cyan-200">
              <Sparkles size={15} /> Browser board games
            </span>
            <div>
              <h1 className="text-4xl font-black leading-tight sm:text-5xl">Find a table. Pick a game. Play now.</h1>
              <p className="mt-4 max-w-2xl text-base text-slate-300">
                A private Board Game Arena-style hub for your friend group, built to plug in more games over time.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a className="inline-flex h-12 items-center gap-2 rounded-xl bg-blue-500 px-5 text-sm font-black text-white shadow-glow" href="#catalog">
                <Play size={18} /> Play {selectedGameName}
              </a>
              <a className="inline-flex h-12 items-center gap-2 rounded-xl bg-white/10 px-5 text-sm font-black text-white" href="#join">
                <LogIn size={18} /> Join by code
              </a>
            </div>
          </div>

          <form className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur" onSubmit={onCreateRoom}>
            <p className="text-sm font-black uppercase tracking-wide text-cyan-200">Create Table</p>
            <label className="mt-4 grid gap-2 text-sm font-bold text-slate-200">
              Display name
              <input
                autoComplete="name"
                className="h-12 rounded-xl border border-white/10 bg-slate-950/50 px-3 text-white outline-none focus:border-blue-400"
                onChange={(event) => setCreateName(event.target.value)}
                placeholder="Alice"
                required
                value={createName}
              />
            </label>
            <button className="mt-4 w-full" disabled={!socketReady} type="submit">
              Create {selectedGameName} Table
            </button>
          </form>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div id="catalog" className="grid gap-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-blue-600 dark:text-cyan-300">Games Catalog</p>
              <h2 className="text-2xl font-black">Available games</h2>
            </div>
            <span className="text-sm font-bold text-slate-500">{GAME_CATALOG.length} game ready</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {GAME_CATALOG.map((game) => (
              <GameCatalogCard
                gameId={game.id}
                key={game.id}
                onSelectGame={onSelectGame}
                selected={selectedGameId === game.id}
              />
            ))}
          </div>
        </div>

        <form id="join" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-white/5" onSubmit={onJoinRoom}>
          <p className="text-sm font-black uppercase tracking-wide text-blue-600 dark:text-cyan-300">Join Table</p>
          <div className="mt-4 grid gap-4">
            <label className="grid gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
              Display name
              <input
                autoComplete="name"
                className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-slate-950"
                onChange={(event) => setJoinName(event.target.value)}
                placeholder="Bob"
                required
                value={joinName}
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
              Room code
              <input
                autoCapitalize="characters"
                className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 uppercase tracking-[0.25em] outline-none focus:border-blue-500 dark:border-white/10 dark:bg-slate-950"
                onChange={(event) => setJoinCode(event.target.value)}
                placeholder="ABCDE"
                required
                value={joinCode}
              />
            </label>
            <button disabled={!socketReady} type="submit">
              Join Table
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

function GameCatalogCard({
  gameId,
  onSelectGame,
  selected
}: {
  gameId: GameId;
  onSelectGame: (gameId: GameId) => void;
  selected: boolean;
}) {
  const game = GAME_CATALOG.find((item) => item.id === gameId) ?? GAME_CATALOG[0];
  const details = catalogDetails[game.id] ?? {
    cover: "from-slate-500 to-slate-800",
    complexity: "Unknown",
    playtime: "Varies"
  };

  return (
    <button
      className={`group overflow-hidden rounded-3xl border p-0 text-left shadow-xl transition hover:-translate-y-1 ${
        selected
          ? "border-blue-500 bg-blue-50 dark:border-cyan-300 dark:bg-cyan-400/10"
          : "border-slate-200 bg-white dark:border-white/10 dark:bg-white/5"
      }`}
      onClick={() => onSelectGame(game.id)}
      type="button"
    >
      <div className={`h-36 bg-gradient-to-br ${details.cover} p-4 text-white`}>
        <div className="flex justify-between">
          <span className="rounded-full bg-black/25 px-3 py-1 text-xs font-black">{details.complexity}</span>
          <Trophy size={22} />
        </div>
        <div className="mt-9 text-5xl font-black opacity-90">XO</div>
      </div>
      <div className="grid gap-3 p-4">
        <div>
          <h3 className="text-lg font-black">{game.name}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{game.description}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-black text-slate-600 dark:text-slate-300">
          <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-white/10">
            {game.minPlayers}-{game.maxPlayers} players
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-white/10">{details.playtime}</span>
        </div>
      </div>
    </button>
  );
}

function TableLobby({
  canStartGame,
  currentPlayerId,
  gameState,
  isHost,
  onMove,
  onStartGame,
  room,
  viewerId
}: {
  canStartGame: boolean;
  currentPlayerId: PlayerId | null;
  gameState: unknown;
  isHost: boolean;
  onMove: (move: unknown) => void;
  onStartGame: () => void;
  room: RoomSnapshot;
  viewerId: PlayerId;
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="grid gap-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-blue-600 dark:text-cyan-300">Table Lobby</p>
              <h1 className="mt-1 text-3xl font-black">{getGameName(room.settings.gameId)}</h1>
              <p className="mt-1 text-sm font-bold text-slate-500">Room code: {room.code}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black capitalize dark:bg-white/10">
              {room.status}
            </span>
          </div>

          <div className="mt-6 rounded-[2rem] border border-amber-900/20 bg-gradient-to-br from-amber-700 to-amber-950 p-5 shadow-inner">
            <div className="grid min-h-[300px] place-items-center rounded-[1.5rem] border border-white/10 bg-emerald-900/70 p-4">
              <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
                {Array.from({ length: room.settings.maxPlayers }).map((_, index) => {
                  const player = room.players[index];
                  return (
                    <div
                      className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur"
                      key={index}
                    >
                      <p className="text-xs font-black uppercase tracking-wide text-emerald-200">
                        Seat {index + 1}
                      </p>
                      <div className="mt-3 flex items-center gap-3">
                        <div className="grid h-12 w-12 place-items-center rounded-full bg-white/20 text-lg font-black">
                          {player ? player.displayName.slice(0, 1).toUpperCase() : "?"}
                        </div>
                        <div>
                          <p className="font-black">{player ? player.displayName : "Empty"}</p>
                          <p className="text-xs text-emerald-100">
                            {player
                              ? `${player.connectionStatus}${player.id === room.hostId ? " · host" : ""}`
                              : "Waiting"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {isHost ? (
            <button className="mt-5" disabled={!canStartGame} onClick={onStartGame} type="button">
              Start Game
            </button>
          ) : (
            <p className="mt-5 text-sm font-bold text-slate-500">Waiting for host to start.</p>
          )}
        </div>

        {gameState ? (
          <GameRenderer
            currentPlayerId={currentPlayerId}
            gameId={room.settings.gameId}
            onMove={onMove}
            room={room}
            state={gameState}
            viewerId={viewerId}
          />
        ) : null}
      </div>

      <aside className="grid gap-4">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} />
            <h2 className="font-black">Table Chat</h2>
          </div>
          <div className="mt-4 grid h-64 content-end gap-3 rounded-2xl bg-slate-100 p-3 dark:bg-slate-900">
            <p className="rounded-xl bg-white p-3 text-sm font-semibold text-slate-600 shadow-sm dark:bg-white/10 dark:text-slate-300">
              Chat placeholder. Table messages will land here later.
            </p>
          </div>
          <input
            className="mt-3 h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none dark:border-white/10 dark:bg-slate-950"
            disabled
            placeholder="Chat coming soon"
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center gap-2">
            <BookOpen size={18} />
            <h2 className="font-black">Table Info</h2>
          </div>
          <div className="mt-4 grid gap-3 text-sm font-bold text-slate-500 dark:text-slate-400">
            <p>Game: {getGameName(room.settings.gameId)}</p>
            <p>Players: {room.players.length}/{room.settings.maxPlayers}</p>
            <p>Mode: realtime</p>
          </div>
        </section>
      </aside>
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
