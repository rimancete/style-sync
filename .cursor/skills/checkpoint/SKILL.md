---
name: checkpoint
description: >-
  Saves the current chat context to ~/dev/active/<task>/ so it can be restored
  in a new chat session. Writes three plain-markdown files (plan, context, tasks)
  that are tool-agnostic and readable by any AI assistant. Use when the user says
  "checkpoint", "save context", "prepare handoff", "context is getting full", or
  "start a new chat".
disable-model-invocation: true
---

# Checkpoint

Snapshot the current conversation state so any AI tool can continue the work in a new session.

## Step 1 — Determine Task Name

Infer the task name from the current conversation (kebab-case, concise, e.g. `refactor-auth-flow`).
If ambiguous, ask: _"What should I call this task?"_

## Step 2 — Create/Update Files

Write all three files to `~/dev/active/<task-name>/`. Overwrite if they already exist.

### `<task>-plan.md`
```
# Plan: <task-name>

## Objective
[One-sentence goal]

## Approach
[Bullet points of the agreed strategy]

## Key Decisions
[Decisions already made that must not be revisited]

_Last Updated: <ISO timestamp>_
```

### `<task>-context.md`
```
# Context: <task-name>

## Current State
[What has been done so far, in chronological order]

## Files Touched
[List of files created or modified, with brief note on each]

## Blockers / Open Questions
[Anything unresolved]

## Environment Notes
[Relevant env vars, branch names, tool versions, etc.]

_Last Updated: <ISO timestamp>_
```

### `<task>-tasks.md`
```
# Tasks: <task-name>

## Completed
- [x] Task A
- [x] Task B

## Pending
- [ ] Task C
- [ ] Task D

_Last Updated: <ISO timestamp>_
```

## Step 3 — Print Handoff Summary

After writing the files, output a ready-to-paste block the user can drop into the next chat:

```
---
## Continuing: <task-name>

Context files loaded from ~/dev/active/<task-name>/.
Say "continue <task-name>" to resume.
---
```

## Notes

- Files are plain Markdown — readable by Claude.ai, Gemini, Windsurf, or any other tool.
- The `~/dev/active/` directory is outside any repo — nothing is committed.
- Cursor-specific behavior (this skill + the `context-engineering` rule) is isolated in `~/.cursor/`.
- A task is "done" when all items in `<task>-tasks.md` are `[x]`. Archive by moving the directory: `mv ~/dev/active/<task> ~/dev/done/<task>`.
