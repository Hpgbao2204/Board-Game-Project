# Board Game Hub

Private multiplayer board game hub for a small friend group.

## Phase 1 Status

The repository now contains the base monorepo structure and shared TypeScript contracts for future phases.

```txt
apps/
  web/
  server/
packages/
  shared/
  games/
docs/
skills/
```

## Planned MVP

- Raw WebSocket realtime server.
- Lobby and room code flow.
- Pluggable game engine contract.
- Tic Tac Toe as the first game module.
- Memory store first, persistence adapter later.
