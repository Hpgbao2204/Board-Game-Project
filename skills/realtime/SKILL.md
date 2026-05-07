---
name: realtime
description: Design and implement WebSocket realtime behavior for the board game hub, including room creation, room code joins, state snapshots, event broadcast, player sessions, disconnect/reconnect, heartbeat, and move rejection. Use when Codex changes backend WebSocket code, frontend realtime hooks, shared protocol messages, or room synchronization flows.
---

# Realtime

## Protocol Rules

Keep the wire protocol explicit and typed in `packages/shared`.

Client events should include:

```txt
create_room
join_room
leave_room
start_game
submit_move
request_sync
heartbeat
```

Server events should include:

```txt
room_snapshot
game_snapshot
move_applied
move_rejected
player_disconnected
player_reconnected
error
```

## Server Responsibilities

- Assign or accept a stable `playerId` for reconnect.
- Track each WebSocket connection separately from each player.
- Keep room membership in the room store, not inside the socket object.
- Broadcast snapshots after state-changing events.
- Reject invalid messages with typed errors instead of throwing raw exceptions.
- Keep memory store behind an interface so SQLite/PostgreSQL can replace it later.

## Reconnect Model

Use this MVP behavior:

1. Client stores `playerId` locally.
2. Client reconnects with `roomCode` and `playerId`.
3. Server marks the player connected again if the room still exists.
4. Server sends a fresh `room_snapshot` and `game_snapshot`.

Use heartbeat only to detect stale sockets; do not make game progress depend on perfect network timing.

## Sync Strategy

Prefer authoritative server snapshots over client reconciliation for MVP. The client may animate events, but the rendered truth comes from the latest snapshot.
