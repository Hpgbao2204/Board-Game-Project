import type { GameContext } from "./GameContext";
import type { GameResult } from "../types/game";
import type { PlayerId } from "../types/player";

export interface ValidationResult {
  ok: boolean;
  reason?: string;
}

export interface MoveResult<State> {
  state: State;
  events?: GameEvent[];
}

export interface GameEvent {
  type: string;
  payload?: unknown;
}

export interface GameModule<State, Move, PublicState = unknown> {
  id: string;
  name: string;
  minPlayers: number;
  maxPlayers: number;
  supportsTeams: boolean;

  createInitialState(ctx: GameContext): State;

  getCurrentPlayer(state: State, ctx: GameContext): PlayerId | null;

  validateMove(input: {
    state: State;
    move: Move;
    playerId: PlayerId;
    ctx: GameContext;
  }): ValidationResult;

  applyMove(input: {
    state: State;
    move: Move;
    playerId: PlayerId;
    ctx: GameContext;
  }): MoveResult<State>;

  getGameResult(state: State, ctx: GameContext): GameResult;

  getPublicState(input: {
    state: State;
    viewerId: PlayerId;
    ctx: GameContext;
  }): PublicState;
}
