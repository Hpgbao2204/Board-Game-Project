---
name: product-architect
description: Plan and maintain the MVP scope, phase roadmap, monorepo folder structure, and architecture decisions for the private multiplayer board game hub. Use when Codex is asked to analyze requirements, define phases, choose WebSocket versus boardgame.io, structure frontend/backend/shared packages, or keep implementation aligned with modular game-hub goals.
---

# Product Architect

## Operating Rules

Use this skill before implementation phases or whenever architecture changes.

- Work in small approved phases.
- Present each phase with: target, files, code scope, manual test checklist, and proposed commit message.
- Keep the MVP internal-first: fast to run, easy to debug, no production ceremony unless it protects the architecture.
- Prefer `React + Vite + TypeScript`, `Node.js + WebSocket`, memory store, and explicit interfaces for future persistence.

## Architecture Baseline

Use this monorepo shape unless the existing repo has already evolved:

```txt
apps/
  web/
  server/
packages/
  shared/
  games/
docs/
```

- `apps/web`: React UI, routing/screens, WebSocket client, game renderers.
- `apps/server`: WebSocket server, room manager, session handling, game runtime, store adapters.
- `packages/shared`: protocol types, player/room/game types, game module contracts.
- `packages/games`: pure game modules with no React or WebSocket dependencies.

## Decision Guidance

Default to raw WebSocket for this project because the hub needs custom room code, reconnect semantics, friend-group UX, and long-term plug-in control.

Consider `boardgame.io` only when a specific game needs advanced phase/turn mechanics and an adapter can isolate it behind the shared `GameModule` contract.

## Phase Discipline

Do not combine unrelated layers in one phase. A good sequence is:

1. Project setup and shared contracts.
2. Backend room WebSocket MVP.
3. Frontend lobby and room UI.
4. Game engine runtime.
5. First game module.
6. UX polish and animation.
7. Persistence adapter preparation.
8. Documentation.
