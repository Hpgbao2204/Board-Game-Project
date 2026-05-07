import type { RoomId } from "../types/room";
import type { PlayerId, TeamId } from "../types/player";

export interface GameSeat {
  playerId: PlayerId;
  teamId?: TeamId;
  order: number;
}

export interface GameContext {
  roomId: RoomId;
  seats: GameSeat[];
  startedAt: string;
  randomSeed: string;
}
