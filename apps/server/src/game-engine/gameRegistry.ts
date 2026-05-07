import type { GameModule } from "@board-game-hub/shared";
import { ticTacToeGame } from "@board-game-hub/games";

const registeredGames = new Map<string, GameModule<unknown, unknown, unknown>>([
  [ticTacToeGame.id, ticTacToeGame]
]);

export function getGameModule(gameId: string): GameModule<unknown, unknown, unknown> | null {
  return registeredGames.get(gameId) ?? null;
}

export function listGameModules(): GameModule<unknown, unknown, unknown>[] {
  return [...registeredGames.values()];
}
