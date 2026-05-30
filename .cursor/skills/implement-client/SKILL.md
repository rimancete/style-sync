---
name: implement-client
path: client/**/*
description: >-
  Implement a frontend task end-to-end in this TypeScript/React project —
  load the mandatory frontend context (architecture, technical, status,
  tasks), plan the change, create the `{N}-{slug}` branch and draft PR via
  the `git-workflow` skill, implement with strict typing and React best
  practices, keep `docs/frontend/status.md` and the PR description in sync,
  run `pnpm lint`, wait for smooth tests or developer approval, then offer the `review-pr` skill before asking for push
  confirmation. Never auto-runs review; never pushes without explicit
  developer approval.
  Use when the user asks to implement, build, fix, or refactor anything
  inside `client/**`, or to pick up an existing frontend task from
  `tasks/client/*`.
---

# Implement Client (Frontend)

End-to-end implementation workflow for the React + Vite + TanStack + Tailwind + shadcn frontend in `client/`.

This skill orchestrates other skills: it calls [git-workflow](../git-workflow/SKILL.md) for the branch + draft PR + final PR update, it waits for smooth tests and it **offers** (never auto-invokes) the [review-pr](../review-pr/SKILL.md) skill before the push confirmation step.

## Prerequisites

- The `git-workflow` skill must be wired ([gh-setup](../git-workflow/gh-setup.md) or [mcp-setup](../git-workflow/mcp-setup.md)). Tooling choice persists in `.cursor/skills/git-workflow/.last-tool`.
- A linked GitHub Issue exists (or [create-task](../create-task/SKILL.md) is used first to draft the task, then the developer creates / confirms the Issue).

## Mandatory startup reads

Before touching code, read these files. They are the contract for any frontend change:

- [docs/frontend/architecture.mermaid](../../../docs/frontend/architecture.mermaid) — frontend system architecture and component relationships.
- [docs/frontend/architecture.md](../../../docs/frontend/architecture.md) — descriptive architecture, guidelines, patterns.
- [docs/frontend/technical.md](../../../docs/frontend/technical.md) — technical specifications.
- [tasks/client/frontendTasks.md](../../../tasks/client/frontendTasks.md) — current development tasks and requirements.
- [tasks/client/backlog.md](../../../tasks/client/backlog.md) — only when the task is in the backlog.
- [docs/frontend/status.md](../../../docs/frontend/status.md) — current frontend progress and state.

If any of these files are missing, **stop and notify the developer** rather than proceeding blind.

## Workflow

### Phase 1: Context load and task parse

1. Read the mandatory startup files (above).
2. Locate the task entry: `### {PREFIX-NNN}: {Title}` in [tasks/client/frontendTasks.md](../../../tasks/client/frontendTasks.md) or [tasks/client/backlog.md](../../../tasks/client/backlog.md). Extract:
   - `{N}` (numeric part) — drives the branch name and Issue number.
   - Title — used in the PR title.
   - Body — Descrição, Objetivos, Regras de Negócio, Requisitos Funcionais, Requisitos Não Funcionais, Critérios de Aceitação.
3. Confirm the linked GitHub Issue number matches `{N}`. If no Issue exists, stop and either ask the developer or hand off to [create-task](../create-task/SKILL.md) → `git-workflow` to create it.

### Phase 2: Plan

1. Switch to plan mode (`SwitchMode` → `plan`) to collaboratively design the approach.
2. Explore the frontend codebase for existing patterns relevant to the task. Use `Task` with `subagent_type="explore"` when the surface area is broad. Pay attention to:
   - State management split: **Zustand** (global: Auth, Theme, Global Settings) vs **Constate + React Context** (page-level local state). Pick the layer that already owns the concern.
   - Data fetching: **TanStack Query** is the canonical layer for server state. Don't reinvent caching.
   - Forms: **React Hook Form + Zod**.
   - Routing: **TanStack Router**.
   - Styling: **Tailwind + shadcn/ui**.
   - Tests: **Vitest + MSW**.
3. Draft an ordered plan:
   - High-level approach and rationale.
   - Tasks (one logical unit per item).
   - For each task: files to create / modify, what changes, and why.
   - Tests to add (mapped to Critérios de Aceitação checkboxes from the task entry).
   - Independent tasks that could parallelize (only if the scope is large enough to justify it).
   - Risks or things to validate with the developer.
4. Present the plan and wait for developer approval. Adjust until confirmed.

### Phase 3: Branch and draft PR

Hand off to [git-workflow](../git-workflow/SKILL.md) for:

- `git fetch origin`
- Branch from `develop`: `git checkout develop && git pull && git checkout -b <N>-<slug>`
- Initial empty push (or after the first commit) and PR creation as **draft** with the body filled from the [PR template](../../../.github/pull_request_template.md):
  - `## Summary` — from the task Descrição + chosen approach.
  - `## Issue` — `Closes #<N>`.
  - `## Type` — check `Feature / task` (or `Hotfix` if applicable; if hotfix, base is `main`).
  - The matching checklist filled as work progresses.
  - `## Notes` — risks, follow-ups, screenshots.

Update the PR description as implementation progresses (see Phase 5).

### Phase 4: Implement

1. Create a `TodoWrite` list mirroring the plan tasks.
2. Execute tasks sequentially by default. For each task:
   - Mark `in_progress`.
   - Implement.
   - Commit using Conventional Commits: `feat(client/<scope>): ...`, `fix(client/<scope>): ...`, `refactor(client/<scope>): ...`, etc.
   - Mark `completed`.
3. Parallel execution is allowed only for large, clearly independent tasks (4+ tasks, no shared files, no ordering dependencies). Use up to 4 subagents via the `Multitask` tool; integrate their output afterwards.

#### TypeScript / React guidelines

- Strict typing; **no `any`**. Use `unknown` + narrowing or precise types.
- Follow SOLID principles.
- Write unit tests for all required features.
- React components: use the `function` declaration form, not `const Component = () =>`.
- Prefer `type` over `interface` for type declarations (consistency with current codebase style).
- Reuse existing components / utilities before introducing new ones.
- Magic numbers / strings → named constants.
- Errors are not swallowed; user-facing failures have clear feedback (toasts, inline messages — match existing UX patterns).

### Phase 5: Keep docs and PR in sync after each milestone

After each logical milestone (not after every micro-commit), update:

- [docs/frontend/status.md](../../../docs/frontend/status.md): current progress, new issues encountered, completed items.
- PR description: check off completed items in the chosen Type checklist; refine `## Notes` if anything new surfaced. Use [git-workflow](../git-workflow/SKILL.md) → `gh pr edit` or `update_pull_request` (MCP).

Do **not** push at this stage unless an existing PR is already open and the developer expects continuous updates; the rule is that push happens only at Phase 7.

### Phase 6: Smooth tests

Generate a playbook with manual tests by developer and wait the developer approval. Use "Critérios de Aceitação" session from `frontendTasks.md` as reference for manual tests.

If there would be any implementation issue, the developer can ask for fix, You have to clarify intention using one of the `AskUser`, `Plan` or `Multitask` mode.

### Phase 7: Final validation and doc updates

Before considering the task done:

1. Update [docs/frontend/implementationHistory.md](../../../docs/frontend/implementationHistory.md) — document the implementation (what was built, key decisions, references).
2. Update [docs/frontend/architecture.mermaid](../../../docs/frontend/architecture.mermaid) — only add / adjust what is genuinely new and important. Keep consistency.
3. Verify changes against [docs/frontend/technical.md](../../../docs/frontend/technical.md) specifications.
4. Verify task progress against the task entry; mark Critérios de Aceitação checkboxes as `- [x]` when their backing / smooth tests pass.
5. Run `pnpm lint` (and any frontend test command configured) locally. CI must stay green. If lint fails, fix and re-run.

Validation rules:

1. Find and fix TypeScript compilation and lint errors.
2. Verify type consistency.
3. Check for potential `null` / `undefined`.
4. Validate against business rules (Regras de Negócio in the task entry).
5. Ensure error handling.

### Phase 8: Offer `review-pr`, then ask before pushing

1. **Offer** (do not auto-run) the [review-pr](../review-pr/SKILL.md) skill:

   > "Implementation is complete locally. Want me to run the `review-pr` skill before you push? It will check code quality, business-rule coverage, and PR completeness against `.github/pull_request_template.md`, then output a prioritized list of findings."

   Use `AskQuestion` with options: **Run review-pr** / **Skip**.

   - If **Run review-pr**: invoke the [review-pr](../review-pr/SKILL.md) skill and surface its findings. Wait for the developer to address (or accept) anything Critical / Suggestion before continuing.
   - If **Skip**: proceed.

2. **Push confirmation** — always ask explicitly:

   > "Are you ready to push the branch to the remote?"

   `AskQuestion` options: **Push now** / **Not yet**.

3. Push only when confirmed:

   ```bash
   git push -u origin HEAD
   ```

4. After push, report: remote branch URL, PR link, summary of commits pushed, any open review findings still pending.

> **Never push without explicit developer confirmation.** Commits stay local until the developer says go.

## Output

At the end of the workflow:

1. PR link.
2. Summary of what was implemented.
3. List of commits pushed (or held locally if push was declined).
4. Doc files updated (`status.md`, `implementationHistory.md`, `architecture.mermaid`).
5. Review findings (if `review-pr` was run), grouped by severity.
6. Push status — pushed or pending developer approval.

## Decision: when to parallelize

Only use parallel subagents when **all** are true:

- The task has 2+ clearly independent units of work.
- No shared files or ordering dependencies.
- Each unit is self-contained enough for a subagent to execute without follow-up questions.
- The developer approved parallelization in the plan review.

Default to sequential — it is simpler and less error-prone.

## Handling plan adjustments mid-implementation

If the plan needs to change (unexpected complexity, new requirements, blockers):

1. Pause implementation.
2. Tell the developer what changed and why.
3. Propose the adjusted plan.
4. Get approval.
5. Update the PR description to reflect the new plan.
