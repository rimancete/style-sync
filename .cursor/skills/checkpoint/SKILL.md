---
name: checkpoint
description: >-
  Saves the current chat context to local Engram (user-engram-personal, project
  style-sync) so it can be restored in a new chat session. Use when the user
  says "checkpoint", "save context", "prepare handoff", "context is getting
  full", or "start a new chat".
disable-model-invocation: true
---

# Checkpoint

Snapshot the current conversation state into local Engram so the next session can continue.

Do **not** write markdown under `~/dev/active/` or `~/dev/tasks/active/`.

## Step 1 — Determine Task Name

Infer the task name from the current conversation (kebab-case, concise, e.g. `refactor-auth-flow`).
If ambiguous, ask: _"What should I call this task?"_

## Step 2 — Persist to Engram

Follow `.cursor/rules/engram.mdc`: `GetDynamicTools` on `user-engram-personal`, then `CallDynamicTool`. Pin `project: "style-sync"` on every call.

1. `mem_save` — one observation covering the handoff:
   - `title`: the task name
   - `type`: `decision` (or `architecture` if that is the bulk of the work)
   - `content` using `**What**` / `**Why**` / `**Where**` / `**Learned**`:
     - What: objective and current state
     - Why: agreed approach and key decisions that must not be revisited
     - Where: files touched (paths only, not contents)
     - Learned: blockers, open questions, env notes (branch, Issue `#N`, tool versions)
   - Include completed vs pending work in **Learned** so the next session can resume the checklist.

2. If `mem_save` returns `judgment_required`, resolve via `mem_judge` per the Engram rule.

3. `mem_session_summary` with:

```
## Goal
[One sentence]

## Instructions
[How the user wants this done, if notable]

## Discoveries
- [Gotchas]

## Accomplished
- ✅ [Done]
- 🔲 [Not yet]

## Next Steps
- [For the next session]

## Relevant Files
- path — [why it matters]
```

## Step 3 — Print Handoff Summary

After Engram accepts the save, output a ready-to-paste block for the next chat:

```
---
## Continuing: <task-name>

Load local Engram (`user-engram-personal`, project `style-sync`): mem_context + mem_search for "<task-name>".
Say "continue <task-name>" to resume.
---
```

## Notes

- Memories go in the personal Engram store (`~/.engram-personal`), keyed as `style-sync` from `.engram/config.json`. That store is shared by other personal projects — do not save under a different key. Do not commit `.engram/` DB files (see `.gitignore`).
- A task is done when `mem_session_summary` has no remaining Next Steps / pending items. No filesystem archive step.
