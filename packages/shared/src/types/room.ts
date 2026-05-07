import type { GameId } from "./game";
import type { Player, PlayerId } from "./player";

export type RoomId = string;
export type RoomCode = string;

export type RoomStatus = "lobby" | "playing" | "finished";

export interface RoomSettings {
  gameId: GameId;
  maxPlayers: number;
  allowSpectators: boolean;
}

export interface RoomSnapshot {
  id: RoomId;
  code: RoomCode;
  hostId: PlayerId;
  status: RoomStatus;
  settings: RoomSettings;
  players: Player[];
  createdAt: string;
  updatedAt: string;
}
