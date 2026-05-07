import type { GameModuleMetadata } from "@board-game-hub/shared";

const plannedMvpGame: GameModuleMetadata = {
  id: "tic-tac-toe",
  name: "Tic Tac Toe",
  minPlayers: 2,
  maxPlayers: 2,
  supportsTeams: false
};

export function App() {
  return (
    <main>
      <h1>Board Game Hub</h1>
      <p>Phase 1 foundation is ready.</p>
      <p>
        MVP game: {plannedMvpGame.name} ({plannedMvpGame.minPlayers}-
        {plannedMvpGame.maxPlayers} players)
      </p>
    </main>
  );
}
