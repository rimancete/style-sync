---
name: implement-server
path: server/**/*
description: >-
  Implement a backend task end-to-end in this TypeScript/NestJS project —
  load the mandatory backend context (architecture, technical, status) and
  the linked GitHub Issue (#N) as the task source of truth, plan the change,
  create the `{N}-{slug}` branch and draft PR via the `git-workflow` skill,
  implement with strict typing, SOLID, JSDoc, and contract tests, update
  `docs/backend/postman-collection.json` when the API surface changes, keep
  `docs/backend/status.md` and the PR description in sync, run `pnpm lint`,
  then offer the `review-pr` skill before asking for push confirmation.
  Never auto-runs review; never pushes without explicit developer approval.
  Use when the user asks to implement, build, fix, or refactor anything
  inside `server/**`, or to pick up a backend task referenced by a GitHub
  Issue number.
---

# Implement Server (Backend)

End-to-end implementation workflow for the NestJS + Prisma + PostgreSQL backend in `server/`.

This skill orchestrates other skills: it calls [git-workflow](../git-workflow/SKILL.md) for the branch + draft PR + final PR update, it waits for smooth tests and it **offers** (never auto-invokes) the [review-pr](../review-pr/SKILL.md) skill before the push confirmation step.

## Prerequisites

- The `git-workflow` skill must be wired ([gh-setup](../git-workflow/gh-setup.md) or [mcp-setup](../git-workflow/mcp-setup.md)). Tooling choice persists in `.cursor/skills/git-workflow/.last-tool`.
- A linked GitHub Issue `#N` must exist. If not, use [create-task](../create-task/SKILL.md) first to create it.

## Mandatory startup reads

Before touching code, read these files. They are the contract for any backend change:

- [.spec-kit/constitution.md](../../../.spec-kit/constitution.md) — technical principles, conventions, forbidden patterns, code standards.
- [.spec-kit/architecture.md](../../../.spec-kit/architecture.md) — module structure, layers, data flow, multi-tenancy rules.
- [.spec-kit/domain.md](../../../.spec-kit/domain.md) — entities, business rules, glossary.
- [.spec-kit/endpoints.md](../../../.spec-kit/endpoints.md) — HTTP routes catalogue and API contracts.
- [.spec-kit/references.md](../../../.spec-kit/references.md) — dependencies, environment setup, key commands.
- [docs/backend/architecture.mermaid](../../../docs/backend/architecture.mermaid) — visual backend system diagram (component relationships).
- [docs/backend/status.md](../../../docs/backend/status.md) — current backend progress and state.
- **GitHub Issue `#N`** — source of truth for the task. Read via `rtk gh issue view <N>` (or `issue_read` MCP) to extract: Descrição, Objetivos, Regras de Negócio, Requisitos Funcionais, Requisitos Não Funcionais, and Critérios de Aceitação.

If any of these are missing or the Issue does not exist, **stop and notify the developer** rather than proceeding blind.

## Workflow

### Phase 1: Context load and task parse

1. Read the mandatory startup files (above).
2. Read the GitHub Issue `#N` body via `rtk gh issue view <N>` (or `issue_read` MCP). Extract:
   - `{N}` — the Issue number; drives the branch name (`<N>-<slug>`) and the `Closes #<N>` in the PR.
   - Title — used in the PR title.
   - Body sections — Descrição, Objetivos, Regras de Negócio, Requisitos Funcionais, Requisitos Não Funcionais, Critérios de Aceitação.
3. If the Issue does not exist or has no structured body, stop and ask the developer to run [create-task](../create-task/SKILL.md) first.

### Phase 2: Plan

1. Switch to plan mode (`SwitchMode` → `plan`) to collaboratively design the approach.
2. Explore the backend codebase for existing patterns. Use `Task` with `subagent_type="explore"` when the surface area is broad. Pay attention to:
   - **NestJS module structure**: controller → service → repository (or Prisma client). Keep boundaries clean.
   - **Prisma schema** changes — any model edit requires a migration. Discuss naming and reversibility upfront.
   - **DTOs + class-validator / class-transformer** at controller boundaries. Never accept raw `any` bodies.
   - **Auth**: JWT tokens. Re-use existing guards / decorators before adding new ones.
   - **Swagger / OpenAPI** — controllers must stay properly decorated so the generated spec stays current.
   - **Tests**: contract / integration tests in `server/test`.
3. Draft an ordered plan:
   - High-level approach and rationale.
   - Tasks (one logical unit per item).
   - For each task: files to create / modify, what changes, and why.
   - Tests to add (mapped to Critérios de Aceitação checkboxes).
   - Migration steps (if Prisma schema is touched): generate, review SQL, apply locally, document in PR.
   - Postman collection updates if the API surface changes.
   - Independent tasks that could parallelize (only if scope justifies it).
   - Risks or things to validate with the developer (data-loss risk, breaking-change risk, performance).
4. Present the plan and wait for developer approval. Adjust until confirmed.

### Phase 3: Branch and draft PR

Hand off to [git-workflow](../git-workflow/SKILL.md) for:

- `git fetch origin`
- Branch from `develop`: `git checkout develop && rtk git pull && git checkout -b <N>-<slug>` (use `main` for hotfixes).
- PR creation as **draft** with the body filled from the [PR template](../../../.github/pull_request_template.md):
  - `## Summary` — from the task Descrição + chosen approach.
  - `## Issue` — `Closes #<N>`.
  - `## Type` — check `Feature / task` (or `Hotfix` if applicable).
  - The matching checklist filled as work progresses.
  - `## Notes` — risks (especially around migrations), follow-ups.

Update the PR description as implementation progresses (see Phase 5).

### Phase 4: Implement

1. Create a `TodoWrite` list mirroring the plan tasks.
2. Execute tasks sequentially by default. For each task:
   - Mark `in_progress`.
   - Implement.
   - Commit using Conventional Commits: `feat(server/<scope>): ...`, `fix(server/<scope>): ...`, `refactor(server/<scope>): ...`, etc.
   - Mark `completed`.
3. Parallel execution is allowed only for large, clearly independent tasks (4+ tasks, no shared files, no ordering dependencies). Use up to 4 subagents via the `Multitask` tool; integrate their output afterwards.

#### TypeScript / NestJS guidelines

- Strict typing; **no `any`**.
- SOLID principles. Single-responsibility services. Inject dependencies, don't `new` them inside methods.
- **Unit tests** for all public methods.
- **JSDoc** on public methods that participate in the API surface or domain logic.
- DTOs always validated with `class-validator`. Transform with `class-transformer`.
- Errors: throw `HttpException` (or a specific subclass) with a meaningful message and status code. Don't swallow.
- Logging: use NestJS `Logger`, never `console.log`.
- Prisma access stays in repository / service layer; controllers must not import Prisma directly.

### Phase 5: Keep docs and PR in sync after each milestone

After each logical milestone update:

- [docs/backend/status.md](../../../docs/backend/status.md): current progress, new issues encountered, completed items.
- PR description: check off completed items in the chosen Type checklist; refine `## Notes` for any new risk or migration step.

Do **not** push at this stage unless the PR is already open and continuous updates are expected; the push happens only at Phase 8.

### Phase 6: Smooth tests

Generate a playbook with manual tests by developer and wait the developer approval. Use the "Critérios de Aceitação" section from GitHub Issue `#N` as reference for manual tests.

If there would be any implementation issue, the developer can ask for fix, You have to clarify intention using one of the `AskUser`, `Plan` or `Multitask` mode.

### Phase 7: Final validation and doc updates

Before considering the task done:

1. **Contract / integration tests** — every new endpoint or behavioral change has a backing test in `server/test` (or the equivalent location). Critérios de Aceitação checkboxes map to tests.
2. **Postman collection** — update [docs/backend/postman-collection.json](../../../docs/backend/postman-collection.json) when the API surface changes: new endpoint, new field, removed field, renamed param, changed status code. The collection is the manual-testing source of truth.
3. Update [docs/backend/implementationHistory.md](../../../docs/backend/implementationHistory.md) — document the implementation (what was built, key decisions, migration notes).
4. Update [docs/backend/architecture.mermaid](../../../docs/backend/architecture.mermaid) — only add / adjust what is genuinely new and important.
5. Evaluate spec-kit staleness against the changes made (see spec-kit Phase 5 rules). If any document is stale, notify the developer.
6. Verify task progress against Issue `#N`; mark Critérios de Aceitação as `- [x]` in the Issue body (via `gh issue edit` or `issue_write` update) when their tests pass.
7. Run `rtk pnpm lint` and `rtk vitest` (or any backend test command configured). CI must stay green. If lint or tests fail, fix and re-run.

Validation rules:

1. Find and fix TypeScript compilation and lint errors.
2. Verify type consistency.
3. Check for potential `null` / `undefined`.
4. Validate against business rules (Regras de Negócio in the task entry).
5. Ensure error handling, including failure-path tests.

### Phase 8: Offer `review-pr`, then ask before pushing

1. **Offer** (do not auto-run) the [review-pr](../review-pr/SKILL.md) skill:

   > "Implementation is complete locally. Want me to run the `review-pr` skill before you push? It will check code quality, business-rule coverage, and PR completeness against `.github/pull_request_template.md`, then output a prioritized list of findings."

   `AskQuestion` options: **Run review-pr** / **Skip**.

   - If **Run review-pr**: invoke [review-pr](../review-pr/SKILL.md) and surface findings. Wait for the developer to address (or accept) Critical / Suggestion items before continuing.
   - If **Skip**: proceed.

2. **Push confirmation** — always ask explicitly:

   > "Are you ready to push the branch to the remote?"

   `AskQuestion` options: **Push now** / **Not yet**.

3. Push only when confirmed:

   ```bash
   rtk git push -u origin HEAD
   ```

4. After push, report: remote branch URL, PR link, summary of commits pushed, any open review findings still pending.

> **Never push without explicit developer confirmation.** Commits stay local until the developer says go.

## Output

At the end of the workflow:

1. PR link.
2. Summary of what was implemented.
3. List of commits pushed (or held locally if push was declined).
4. Doc files updated (`status.md`, `implementationHistory.md`, `architecture.mermaid`, `postman-collection.json` if the API changed). Spec-kit staleness flags if applicable.
5. Migration notes (if Prisma schema was touched).
6. Review findings (if `review-pr` was run), grouped by severity.
7. Push status — pushed or pending developer approval.

## Decision: when to parallelize

Only use parallel subagents when **all** are true:

- The task has 4+ clearly independent units of work.
- No shared files or ordering dependencies.
- Each unit is self-contained enough for a subagent to execute without follow-up questions.
- The developer approved parallelization in the plan review.

Default to sequential.

## Handling plan adjustments mid-implementation

If the plan needs to change (unexpected complexity, new requirements, blockers, migration concerns surfacing late):

1. Pause implementation.
2. Tell the developer what changed and why.
3. Propose the adjusted plan.
4. Get approval.
5. Update the PR description to reflect the new plan.
