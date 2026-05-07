import type { GameContext, RoomCode, RoomSnapshot } from "@board-game-hub/shared";

export interface StoredGame {
  gameId: string;
  ctx: GameContext;
  state: unknown;
}

export interface StoredRoom {
  room: RoomSnapshot;
  game: StoredGame | null;
}

export interface RoomStore {
  create(room: StoredRoom): StoredRoom;
  getByCode(roomCode: RoomCode): StoredRoom | null;
  update(roomCode: RoomCode, updater: (room: StoredRoom) => StoredRoom): StoredRoom | null;
  delete(roomCode: RoomCode): boolean;
  list(): StoredRoom[];
}
