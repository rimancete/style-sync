---
name: create-task
description: >-
  Draft a new development task for this project — analyze the codebase to
  understand the affected areas, then append a `### {PREFIX-NNN}: {Title}`
  entry to the right file in `tasks/client/` or `tasks/server/` using the
  Portuguese task template (Descrição / Objetivos / Regras de Negócio /
  Requisitos Funcionais / Requisitos Não Funcionais / Critérios de Aceitação
  in checklist format). Hands off to the `git-workflow` skill to
  open the matching GitHub Issue after the developer confirms the task is
  ready. No branches or PRs are created here.
  Use when the user asks to plan a feature, draft a task, describe a bug fix,
  or document upcoming work before implementation.
---

# Create Task

Plan and document a new task by analyzing the codebase, then writing a structured entry into the task files that drive this project's issue / branch / PR cycle.

This skill does **not** create branches or PRs. That is the job of [implement-client](../implement-client/SKILL.md) and [implement-server](../implement-server/SKILL.md). Optionally, this skill can hand off to [git-workflow](../git-workflow/SKILL.md) to create the matching GitHub Issue once the developer confirms the task is ready.

## Prerequisites

- Read [git-workflow.md](./../git-workflow/git-workflow.md) once for the task-file conventions (heading, prefix, slug, branch-name mapping).
- The Portuguese task body template lives in [task-template.md](task-template.md).

## Target files

New entries are appended to one of these files (see [git-workflow.md](./../git-workflow/git-workflow.md)):

| Side     | Current sprint                                                          | Backlog                                                     |
| -------- | ----------------------------------------------------------------------- | ----------------------------------------------------------- |
| Frontend | [tasks/client/frontendTasks.md](../../../tasks/client/frontendTasks.md) | [tasks/client/backlog.md](../../../tasks/client/backlog.md) |
| Backend  | [tasks/server/backendTasks.md](../../../tasks/server/backendTasks.md)   | [tasks/server/backlog.md](../../../tasks/server/backlog.md) |

A task that spans both sides gets **two entries**, one in each side, linked by reference in the body.

## Heading and naming convention

Every task entry starts with:

```markdown
### {PREFIX-NNN}: {Title}
```

- `{PREFIX-NNN}` — alphanumeric prefix plus zero-padded number, e.g. `BUS-004`, `FFU-005`, `BFU-003`. Reuse an existing prefix when the task belongs to its grouping; only invent a new prefix with developer confirmation as following:
  - BUS > Business: Business features | Ps: New register user screen
  - FFU > Frontend Fundations: Tech features | Ps: Improve auth structure; create a new "Icon" component which uses lucide instead custom icons
  - BFU > Backend Fundations: Tech features | Ps: Migrate customer file management to AWS
  - HOT > HotFix: Bug fix | Ps: User data loading failed; book service failed

- `{Title}` — short, in English (matches the GitHub Issue title that will be created later).
- The numeric part `NNN` is what the GitHub Issue and branch use. Example: `BUS-004: Login API integration` → Issue `#4` → branch `4-login-api-integration`.

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
   - Use `Multitask` agent mode: a worker for frontend(client) and another for backend(server) analysis. Each worker returns a clear analysis from each system side to the main worker
3. Build a mental model **before writing**: current behavior, gap to desired behavior, ripple effects.

### Phase 3: Decide the side(s)

Use `AskQuestion` (if not already obvious from the request):

- Frontend only → write to `tasks/client/*`.
- Backend only → write to `tasks/server/*`.
- Both → write to **both** files; reference each other in the body.

Decide `tasks/<side>/frontendTasks.md` (or `backendTasks.md`) when the work is part of the current sprint, or `tasks/<side>/backlog.md` when it is queued for later. Ask if unsure.

### Phase 4: Choose prefix and number

1. Read the target file to inspect existing prefixes (`BUS-`, `FFU-`, `BFU-`, etc.) and decide which one fits — or propose a new prefix and confirm with the developer.
2. Pick the next available zero-padded number for that prefix (`BUS-004` → next is `BUS-005`).
3. Verify the chosen `{N}` does not collide with an existing GitHub Issue if the developer plans to create one (`rtk gh issue view <N>` or `pull_request_read`/`issue_read` via MCP).

### Phase 5: Write the task entry

Append the entry to the target file. Body **in Portuguese**, following [task-template.md](task-template.md):

```markdown
### {PREFIX-NNN}: {Title}

## 🧩 Descrição

<Descreva claramente o problema, solicitação ou comportamento observado.
Inclua contexto suficiente para entendimento completo da situação,
ancorado no que você encontrou na análise do código.>

## 🎯 Objetivos

- <Objetivo 1>
- <Objetivo 2>

## 📐 Regras de Negócio

- <Regra 1>
- <Regra 2>

## ✅ Requisitos Funcionais

### Front-end
- <Requisito 1>

### Back-end
- <Requisito 1>

### Outros
- <Requisito 1>

## ✅ Requisitos Não Funcionais

- <Requisito 1 (performance, segurança, usabilidade, manutenibilidade)>

## 🧪 Critérios de Aceitação

- [ ] Dado que <contexto>, quando <ação>, então <resultado esperado>.
- [ ] Dado que <contexto>, quando <ação>, então <resultado esperado>.
```

Guidelines for filling the template:

- **Descrição** — ground it in what you found in the codebase. Reference current behavior concretely (file paths, function names) without dumping full diffs.
- **Objetivos** — derived from the developer's request. Be specific, not generic.
- **Regras de Negócio** — extract from existing code logic, validations, constraints you found during analysis.
- **Requisitos Funcionais** — split by `Front-end` / `Back-end` / `Outros`. Omit subsections that don't apply.
- **Requisitos Não Funcionais** — performance impact, security implications, backwards compatibility, observability.
- **Critérios de Aceitação** — checklist format (`- [ ]`) using `Dado/Quando/Então` (Given/When/Then). Cover happy path, edge cases, and error scenarios. The checklist doubles as the test-tracking list during implementation.

Section depth depends on the task:

- **Small bug fix** — Descrição, Objetivos, and Critérios may suffice. Regras de Negócio and Requisitos Não Funcionais can be brief or omitted.
- **New feature** — fill all sections thoroughly.
- **Refactor** — emphasize Requisitos Não Funcionais and the rationale. Business rules may not change.

Omit a section only when it genuinely does not apply.

### Phase 6: Create the GitHub Issue

After writing the task, use `AskQuestion` to ask the developer:

> "Task is ready. Create the matching GitHub Issue now?"

- **Create now** — hand off to the [git-workflow](../git-workflow/SKILL.md) skill. Before invoking it, verify no Issue with the same title or number already exists to avoid duplicates:

  - **`gh`**: `rtk gh issue list --search "<Title>"` and `rtk gh issue view <N>`
  - **`mcp`**: `search_issues` then `issue_read` on `user-github_style-sync`

  Then create the Issue (title = English `{Title}` from the heading, body = a short reference back to the task file plus a link if useful):

  - **`gh`**: `gh issue create --title "<Title>" --body "<body>"`
  - **`mcp`**: `issue_write` (`method=create`, `owner`, `repo`, `title`, `body`)

  Report the Issue number to the developer so they can confirm it matches `{N}` in the task heading.

### Phase 7: Output

Tell the developer:

1. File modified (and how many entries appended).
2. Heading used (e.g. `BUS-005: Improve test structure`).
3. Side(s) affected.
4. Issue number (if created in phase 6), or a reminder that no Issue exists yet.
5. Next action: typically, run [implement-client](../implement-client/SKILL.md) or [implement-server](../implement-server/SKILL.md) when ready to code.

## Output summary

| Artifact                | Location                 | Language                       | Purpose                        |
| ----------------------- | ------------------------ | ------------------------------ | ------------------------------ |
| Task entry              | `tasks/<side>/<file>.md` | Portuguese body, English title | Source of truth for the work   |
| GitHub Issue (optional) | GitHub                   | English title, short body      | Trackable on the project board |
