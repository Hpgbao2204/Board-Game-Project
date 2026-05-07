import type { GameModuleMetadata } from "../types/game";

export const GAME_CATALOG = [
  {
    id: "tic-tac-toe",
    name: "Tic Tac Toe",
    minPlayers: 2,
    maxPlayers: 2,
    supportsTeams: false,
    description: "Classic 3x3 duel. Good for testing the realtime game loop."
  },
  {
    id: "royal-messenger",
    name: "Royal Messenger",
    minPlayers: 2,
    maxPlayers: 4,
    supportsTeams: false,
    description: "A quick hidden-hand court card duel inspired by famous micro card games."
  }
] as const satisfies readonly GameModuleMetadata[];
