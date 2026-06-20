---
name: create-task
description: >-
  Draft a new development task for this project — analyze the codebase to
  understand the affected areas, generate a full Portuguese-body preview for
  developer approval, then create a mandatory GitHub Issue with the complete
  template as the body. The Issue number (#N) returned by GitHub becomes the
  canonical identifier for branch and PR. No branches or PRs are created here.
  Use when the user asks to plan a feature, draft a task, describe a bug fix,
  or document upcoming work before implementation.
---

# Create Task

Plan and document a new task by analyzing the codebase, presenting a preview for developer approval, then publishing a GitHub Issue that becomes the source of truth for the work.

This skill does **not** create branches or PRs. That is the job of [implement-client](../implement-client/SKILL.md) and [implement-server](../implement-server/SKILL.md). This skill always creates the GitHub Issue — it is not optional. The Issue number (`#N`) returned by GitHub drives the branch name and PR in downstream skills.

## Prerequisites

- Read [git-workflow.md](./../git-workflow/git-workflow.md) once for the naming convention (heading prefix, slug, branch-name mapping).
- The Portuguese task body template lives in [task-template.md](task-template.md).
- GitHub tooling must be configured: either `gh` CLI ([gh-setup.md](../git-workflow/gh-setup.md)) or the `user-github_style-sync` MCP ([mcp-setup.md](../git-workflow/mcp-setup.md)). Check `.cursor/skills/git-workflow/.last-tool`.

## Heading and naming convention

Every task entry starts with:

```markdown
### {PREFIX-NNN}: {Title}
```

- `{PREFIX}` — alphanumeric prefix that categorizes the task. Reuse an existing prefix when the task belongs to its grouping; only invent a new prefix with developer confirmation:
  - BUS > Business: Business features | e.g. New register user screen
  - FFU > Frontend Foundations: Tech features | e.g. Improve auth structure
  - BFU > Backend Foundations: Tech features | e.g. Migrate file management to AWS
  - HOT > HotFix: Bug fix | e.g. User data loading failed

- `{Title}` — short, in English (matches the GitHub Issue title).
- **There is no pre-assigned number.** The canonical `#N` is the Issue number returned by GitHub after creation in Phase 6. The heading used in the preview and in chat is `{PREFIX}: {Title}` (e.g. `BUS: Login API integration`) — the number is appended only after the Issue is created (e.g. `BUS-42: Login API integration` where `42` = `#N`).

## Workflow

### Phase 1: Clarify intent

1. Receive the request. The developer describes what they need.
2. Ask clarifying questions using `AskQuestion` (or conversationally) before writing anything. Cover at minimum:
   - Exact expected behavior or outcome.
   - Known constraints, edge cases, or business rules already in the developer's head.
   - Priority / urgency.
   - Anything ambiguous in the request.

> Never skip this phase. Ambiguity in the request becomes vagueness in the task entry, which compounds during implementation.

### Phase 2: Codebase analysis

1. Explore the codebase to find code related to the request. Use the `Task` tool with `subagent_type="explore"` for broad searches; use `Grep` / `Glob` / `SemanticSearch` for targeted lookups.
2. Identify the affected areas:
   - Files, modules, layers (controllers/services/repositories on the backend; pages/components/hooks/stores/api on the frontend).
   - Database schemas, Prisma models, or migrations involved.
   - External integrations or dependencies.
   - Shared utilities or helpers that may need changes.
   - Use `Multitask` agent mode: a worker for frontend (client) and another for backend (server) analysis. Each worker returns a clear analysis from each system side to the main worker.
3. Build a mental model **before writing**: current behavior, gap to desired behavior, ripple effects.

### Phase 3: Decide the side(s)

Use `AskQuestion` (if not already obvious from the request):

- Frontend only → `area/frontend`
- Backend only → `area/backend`
- Both → both sides; cross-reference in the body.

Decide whether the work is part of the current sprint or queued for later. Ask if unsure — this affects the GitHub Issue milestone.

### Phase 4: Choose prefix and number

1. Inspect existing GitHub Issues (via `rtk gh issue list` or `list_issues` MCP) to decide which prefix fits the task.
2. Pick a proposed `NNN` that does not collide with an open or closed Issue number:
   - **`gh`**: `rtk gh issue view <N>` — if 404, the number is free.
   - **`mcp`**: `issue_read` on `user-github_style-sync`.
3. Do **not** include a number in the heading shown during the preview — the real `#N` is assigned by GitHub in Phase 6. The heading label uses the prefix only: `BUS: {Title}`.

### Phase 5: Preview for developer approval

Generate the complete Portuguese template body (filled based on codebase analysis and developer input) and present it as a markdown block. The developer must approve before the Issue is created.

Present:

```
**Proposed heading:** BUS: {Title}
**GitHub Issue title:** {Title}
**Side(s):** frontend / backend / both
**Note:** The Issue number (#N) will be assigned by GitHub after approval.

---
{full filled Portuguese template body}
---
```

Use `AskQuestion` with three options:
- **Approve** — proceed to Phase 6 and create the Issue.
- **Adjust** — the developer provides corrections; update the preview and re-present.
- **Cancel** — abort without creating any Issue.

Only advance to Phase 6 after an explicit "Approve".

### Phase 6: Create the GitHub Issue (mandatory, issue-first)

After developer approval of the preview:

1. Verify no duplicate Issue exists with the same title:
   - **`gh`**: `rtk gh issue list --search "<Title>"`
   - **`mcp`**: `search_issues` on `user-github_style-sync`

2. Create the Issue with the full approved body (not a summary):
   - **`gh`**: `gh issue create --title "<Title>" --body "<full PT body>"`
   - **`mcp`**: `issue_write` (`method=create`, `owner`, `repo`, `title`, `body`)

3. Extract `#N` from the Issue number returned by GitHub.

4. Report to the developer:
   - Issue URL and number `#N`.
   - Confirm: branch will be `<N>-<slug>`, PR will reference `Closes #<N>`.
   - If `#N` differs from the proposed `NNN` in the heading, note the discrepancy — the heading prefix is cosmetic; `#N` is canonical.

### Phase 7: Output

Tell the developer:

1. Issue URL and number (`#N`).
2. Heading used (e.g. `BUS-005: Improve test structure`) — note it is a label only; `#N` is the canonical reference.
3. Side(s) affected.
4. Next action: run [implement-client](../implement-client/SKILL.md) or [implement-server](../implement-server/SKILL.md) when ready to code, passing Issue `#N` as the task reference.

## Output summary

| Artifact       | Location      | Language                       | Purpose                      |
| -------------- | ------------- | ------------------------------ | ---------------------------- |
| GitHub Issue   | GitHub `#N`   | English title, Portuguese body | Source of truth for the work |
| Preview (chat) | Conversation  | Portuguese body                | Developer approval gate      |
