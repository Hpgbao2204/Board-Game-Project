import type { PlayerId, TeamId } from "./player";

export type GameId = string;
export type MoveId = string;

export interface GameModuleMetadata {
  id: GameId;
  name: string;
  minPlayers: number;
  maxPlayers: number;
  supportsTeams: boolean;
  description?: string;
}

export type GameResult =
  | {
      status: "in_progress";
    }
  | {
      status: "draw";
      reason?: string;
    }
  | {
      status: "won";
      winnerPlayerIds?: PlayerId[];
      winnerTeamId?: TeamId;
      reason?: string;
    };
