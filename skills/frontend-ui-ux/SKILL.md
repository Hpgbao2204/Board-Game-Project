---
name: frontend-ui-ux
description: Build and refine the React Vite TypeScript frontend for the private board game hub, including lobby, room, game board screens, reusable UI components, realtime connection state, small animations, and ergonomic multiplayer UX. Use when Codex edits frontend screens, components, styling, game renderers, or client-side WebSocket hooks.
---

# Frontend UI UX

## Product Feel

Build a quiet, practical game hub for friends. The first screen should be usable, not a marketing page.

Prioritize:

- fast room creation and join by code
- obvious player list and host controls
- clear current turn state
- readable errors when a move is rejected
- reconnect status that does not panic the user

## Component Shape

Keep screens and reusable components separate:

```txt
src/
  components/
    lobby/
    room/
    ui/
  games/
    tic-tac-toe/
  lib/
    realtime/
  styles/
```

Game renderers should depend on public game state and a `submitMove` callback. They should not own WebSocket protocol details.

## UI Rules

- Use stable board dimensions so turns, labels, and animations do not shift layout.
- Use icons for clear tool actions when an icon library exists.
- Use restrained transitions for join, start game, turn changes, card flips, or tile placement.
- Keep text inside controls short and responsive.
- Show connection state in a compact place that does not block play.

## Manual UX Checks

For every UI phase, check:

- desktop and mobile widths
- room code copy/readability
- current player visibility
- disabled states for unavailable actions
- rejected move feedback
- reconnect display
