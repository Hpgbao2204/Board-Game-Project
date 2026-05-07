---
name: git-ops
description: Manage repository hygiene for the board game hub, including scoped commits, .gitignore coverage, README instructions, phase documentation, and safe Git workflows. Use when Codex is asked to add gitignore files, commit changes, write setup docs, prepare PR-ready changes, or keep implementation phases clean and reviewable.
---

# Git Ops

## Commit Discipline

Keep commits small and phase-aligned. Before committing:

- Run `git status --short`.
- Inspect the diff for files you touched.
- Avoid staging unrelated user changes.
- Use concise conventional commit messages.

Good examples:

```txt
chore: add board game project skills
chore: initialize monorepo and shared contracts
feat(server): add websocket room lobby
feat(web): add lobby and room screens
feat(engine): add pluggable game runtime
docs: add setup and game module guide
```

## Ignore Policy

For this repo, `.gitignore` should cover:

- dependencies: `node_modules/`
- build output: `dist/`, `build/`
- logs and local env files
- editor and OS noise
- package manager caches
- test coverage

Do not ignore source folders, shared packages, docs, skills, or lockfiles unless the user asks.

## README Standard

When the app exists, README should include:

- project purpose
- requirements
- install commands
- dev commands for web and server
- how room flow works
- how to add a game module
- current limitations

Keep README practical and accurate to the current phase.
