---
name: game-engine
description: Design and implement the pluggable board game module contract for initial state, move validation, turn handling, public/private state, win/draw conditions, and game registration. Use when Codex is creating or changing shared game interfaces, backend game runtime code, or a new game module such as Tic Tac Toe, card games, team games, or hidden-information games.
---

# Game Engine

## Core Contract

Keep game modules pure and deterministic. A module must not know about WebSocket connections, React components, database drivers, or server process state.

Use a contract shaped around:

- `createInitialState(ctx)`
- `getCurrentPlayer(state, ctx)`
- `validateMove({ state, move, playerId, ctx })`
- `applyMove({ state, move, playerId, ctx })`
- `getGameResult(state, ctx)`
- `getPublicState({ state, viewerId, ctx })`

## Design Rules

- Treat every move as untrusted input.
- Validate turn, player membership, move payload shape, and game-specific rules before mutation.
- Return a new state object or a deliberate immutable update pattern.
- Emit domain events from game logic, but let the server decide how to broadcast them.
- Keep randomization injectable through context or a seeded helper when the result matters for replay/testing.
- Use `getPublicState` for hidden information such as hands, roles, decks, or unrevealed tiles.

## Team And Player Support

Represent players and teams separately. Do not assume one player equals one side.

Useful concepts:

```txt
PlayerId
TeamId
SeatId
TurnOrder
GameResult
PublicGameState
PrivateGameState
```

Support 2 players first, but keep `minPlayers`, `maxPlayers`, optional teams, and seat order in the shared contract.

## First Game Standard

Use Tic Tac Toe as the first module because it proves:

- create initial state
- legal and illegal moves
- turn switching
- win detection
- draw detection
- public state rendering
