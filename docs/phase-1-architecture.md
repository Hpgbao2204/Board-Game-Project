# Phase 1 Architecture

This phase establishes the monorepo skeleton and shared contracts for future game modules.

## Chosen Stack

- Frontend: React, Vite, TypeScript
- Backend: Node.js, TypeScript, raw WebSocket via `ws`
- Storage: memory store in the MVP, with store interfaces added in later phases
- MVP game: Tic Tac Toe

## Package Boundaries

- `apps/web` renders lobby, room, and game board screens.
- `apps/server` owns WebSocket connections, rooms, sessions, and authoritative game state.
- `packages/shared` owns protocol and game engine contracts.
- `packages/games` will contain pure game modules.

Game modules must remain independent from React, WebSocket, and database code.
