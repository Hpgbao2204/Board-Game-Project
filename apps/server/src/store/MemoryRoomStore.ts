import type { RoomCode } from "@board-game-hub/shared";
import type { RoomStore, StoredRoom } from "./RoomStore";

export class MemoryRoomStore implements RoomStore {
  private readonly roomsByCode = new Map<RoomCode, StoredRoom>();

  create(room: StoredRoom): StoredRoom {
    this.roomsByCode.set(room.room.code, room);
    return room;
  }

  getByCode(roomCode: RoomCode): StoredRoom | null {
    return this.roomsByCode.get(roomCode) ?? null;
  }

  update(roomCode: RoomCode, updater: (room: StoredRoom) => StoredRoom): StoredRoom | null {
    const existing = this.getByCode(roomCode);

    if (!existing) {
      return null;
    }

    const next = updater(existing);
    this.roomsByCode.set(roomCode, next);
    return next;
  }

  delete(roomCode: RoomCode): boolean {
    return this.roomsByCode.delete(roomCode);
  }

  list(): StoredRoom[] {
    return [...this.roomsByCode.values()];
  }
}
