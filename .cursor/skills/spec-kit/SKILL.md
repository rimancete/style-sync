---
name: spec-kit
description: >-
  Scans a project codebase and interviews the tech lead to generate a versioned
  .spec-kit/ folder with five structured knowledge documents: constitution, architecture,
  endpoints, domain, and references. This kit becomes the shared context base for all
  other skills (implement-feature, create-task, review-mr). Use when the user says
  "spec kit", "cria spec kit", "bootstrap project context", "atualiza spec kit",
  mentions ".spec-kit/", wants to document the project knowledge base, or asks the
  agent to understand the project before starting any task.
---

# Spec Kit

Bootstrap or update the `.spec-kit/` knowledge base for a project.

The kit lives at `.spec-kit/` in the root of the **target project**. It contains five versioned documents that act as the single source of truth for any AI skill operating on that project.

---

## When to Run

| Trigger | Action |
|---------|--------|
| `.spec-kit/` does not exist | Run the full bootstrap workflow (all phases) |
| `.spec-kit/` exists but is stale | Run Phase 3 (update) for the affected document(s) |
| A skill finishes a task and detects new knowledge | Prompt the tech lead to update the relevant document |

**Other skills:** at the start of any skill, check if `.spec-kit/` exists in the working project. If it does, read all five documents as context before doing anything else. If it doesn't, recommend running `/spec-kit` first.

---

## Documents

| File | Purpose |
|------|---------|
| `constitution.md` | Technical principles, conventions, forbidden patterns, code standards |
| `architecture.md` | Modules, layers, boundaries, data flow, key design decisions |
| `endpoints.md` | Backend: HTTP endpoints exposed. Frontend/mobile: API contracts consumed, client routes, screen map |
| `domain.md` | Backend: entities, DB models. Frontend/mobile: TypeScript types, state shape, store slices. All: business rules, restrictions |
| `references.md` | External docs, key dependencies, third-party integrations, environment notes |

---

## Workflow

### Phase 1: Scan the Codebase

Use `Task` with `subagent_type="explore"` to perform a thorough scan. The goal is to arrive at the interview already knowing as much as possible so questions are targeted, not generic.

**First: detect the project type.** Look at the root files, package manager manifest, and folder structure. Classify as one of:

| Type | Signals |
|------|---------|
| **backend** | `composer.json`, `artisan`, `app/Http/Controllers/`, no `index.html` at root |
| **frontend** | `package.json` with React/Vue/Vite, `src/pages/` or `src/views/`, `index.html` |
| **mobile** | `package.json` with Expo, `app.json` or `app.config.ts`, `app/` or `screens/` folder |
| **fullstack-monorepo** | `pnpm-workspace.yaml`, `nx.json`, or `turbo.json` at root AND both a backend workspace (`server/`, `api/`, `backend/`) and a frontend workspace (`client/`, `web/`, `frontend/`) exist |

> When `fullstack-monorepo` is detected, each workspace is scanned independently and documented with its own sub-sections. The detected type also drives cross-workspace scans and dedicated interview questions.

**Scan for (all types):**

- **Stack**: languages, frameworks, test tools, build tools, package manager
- **Structure**: folder layout, module boundaries, naming patterns, layer separation
- **External integrations**: third-party APIs, services, storage
- **Existing docs**: any README, ADR, wiki files, or inline documentation

**Additional scan targets by type:**

| backend | frontend | mobile | fullstack-monorepo |
|---------|----------|--------|--------------------|
| Routes files, controllers, middleware | Pages/views, router config, root component | Navigator config, screen files, deep links | Root orchestration scripts (`package.json` scripts, `Makefile`) |
| Models/entities, migrations, DB schema | Store modules, contexts, hooks | Store, contexts, async storage | `pnpm-workspace.yaml` / `nx.json` / `turbo.json` — workspace layout and pipeline |
| Jobs, queues, commands | API client layer, env config | Platform-specific files (`*.ios.ts`, `*.android.ts`) | `docker-compose.yml` / `docker/` — service topology |
| Auth guards, policies, middleware | Route guards, HOCs, auth wrappers | Auth flows, permission requests | Shared packages (`packages/`, `libs/`, `shared/`) — cross-workspace code |
| | | | CI/CD workflows per workspace (`.github/workflows/`) |
| | | | API client layer in the frontend — how it calls the backend (REST, tRPC, GraphQL, sockets) |
| | | | Shared TypeScript types or generated contracts (OpenAPI codegen, tRPC router types, GraphQL codegen) |

**For `fullstack-monorepo`: scan each workspace as if it were its own type** (backend workspace → backend scan targets; frontend workspace → frontend scan targets), then additionally scan the root-level cross-workspace concerns listed above.

Produce an internal summary before moving to Phase 2. Do not show the raw scan to the tech lead — use it to ask informed questions.

---

### Phase 2: Interview the Tech Lead

Ask targeted questions. Use `AskQuestion` where the answer is a clear choice; ask conversationally for open-ended answers.

**Always ask these (adapt wording based on scan findings):**

1. What is the primary business purpose of this project? What problem does it solve?
2. Which business rules are non-negotiable and most frequently misunderstood by newcomers?
3. Are there architectural decisions made for non-obvious reasons (performance, legacy, compliance)? What are they?
4. What patterns or libraries are forbidden, and why?
5. Which flows or interactions are the most critical / highest risk? *(backend: endpoints and jobs; frontend: user flows and pages; mobile: screens and offline scenarios)*
6. Are there domain terms that mean something specific in this project context (glossary)?
7. What are the main integrations and their contract owners?
8. What should every developer know before touching this codebase for the first time?
9. Is there anything the code doesn't make obvious that the spec kit must capture?

**Add these only for the detected project type:**

- **backend**: Are there background jobs, queues, or scheduled commands with timing constraints? What are the DB migration and rollback rules?
- **frontend**: What is the state management strategy and which state is global vs local? Are there design system rules or component library restrictions?
- **mobile**: Are there platform-specific behaviors (iOS vs Android) that must be handled differently? What are the offline/connectivity constraints?
- **fullstack-monorepo**: Ask all backend and frontend questions above for the respective workspaces, **plus** the following cross-workspace questions:
  1. How does the frontend communicate with the backend — REST, tRPC, GraphQL, WebSockets? Who owns the API contract (types, schema, spec)?
  2. Are there shared packages or types between workspaces? If so, where do they live and who is responsible for them?
  3. What is the deployment strategy — workspaces deployed independently, together in a container, or via a reverse proxy? Is there a `docker-compose.yml` used in production?
  4. Is there any form of API contract validation or code generation (OpenAPI codegen, tRPC, Zod schemas shared)? How is contract drift detected?
  5. Can each workspace be developed and tested independently, or do they require the other to be running? What is the local dev startup procedure?
  6. Which CI/CD checks run per workspace and which run at the monorepo root level?

> Never skip this phase. The scan finds what exists; the interview captures intent, history, and hidden constraints.

---

### Phase 3: Generate the Documents

Create `.spec-kit/` in the root of the working project. Write all five documents using the templates in [templates/](templates/).

> **UTF-8 safety:** spec-kit documents contain Portuguese content from the interview. Do NOT use the `Write` tool.
> Create each file via shell heredoc and verify after writing:
> ```bash
> cat > .spec-kit/<document>.md <<'WRITE_UTF8_DONE'
> <file content>
> WRITE_UTF8_DONE
> python3 -c "open('.spec-kit/<document>.md', encoding='utf-8', errors='strict').read(); print('OK')"
> ```
> Use `StrReplace` for any subsequent edits.

Each document must include a header block:

```markdown
<!-- spec-kit: <document-name> -->
<!-- version: 1.0 -->
<!-- last-updated: YYYY-MM-DD -->
<!-- updated-by: <tech lead name or "agent"> -->
```

#### Document structure for `fullstack-monorepo`

When the project is a fullstack monorepo, each document must carry explicit workspace sub-sections. Apply the following structure rules in addition to the base templates:

**`constitution.md`**
Organise into three sections: `## Root` (monorepo-wide conventions: commit format, lint rules, branch strategy, release flow), `## Backend` (backend-specific standards, forbidden patterns, test strategy), `## Frontend` (frontend-specific standards, design system rules, state management constraints). Flag any cross-workspace convention that must be consistent (e.g. shared Prettier config).

**`architecture.md`**
Open with a `## System Overview` that maps the workspace topology (workspace names, communication protocol, deployment units). Then add `## Backend Architecture` and `## Frontend Architecture` sections, each following the same structure as a single-app architecture section (modules, layers, data flow). Close with `## Cross-Workspace Contracts` describing how the two workspaces are coupled (shared types, generated clients, API schema, contract validation).

**`endpoints.md`**
Split into `## Backend Routes` (HTTP method, path, auth requirement, handler, purpose) and `## Frontend Routes` (path, component, auth guard, purpose). Add a `## API Contracts` section that documents the coupling explicitly: shared type packages, OpenAPI spec location, code-generation commands, and how drift is detected or prevented.

**`domain.md`**
Split into `## Shared Domain` (types or constants used by both workspaces), `## Backend Domain` (DB entities, Prisma models, business rules, constraints), and `## Frontend Domain` (TypeScript types, global state shape, store slices, form schemas). When a type exists in both workspaces, note the canonical source and whether it is generated or manually kept in sync.

**`references.md`**
Group dependencies under `## Root`, `## Backend`, and `## Frontend`. For each critical dependency, record name, version, and purpose. Add a `## Local Development` section documenting the monorepo startup procedure (e.g. `pnpm install && docker-compose up -d && pnpm dev`).

Apply these rules while writing:

- **Be declarative, not narrative.** Write rules and facts, not explanations of what the agent did.
- **Use concrete terms from the codebase** (actual class names, route paths, field names).
- **Flag uncertainty.** If information came only from code inference (not confirmed by the tech lead), mark it: `<!-- inferred — confirm with tech lead -->`.
- **No filler.** Omit sections that are genuinely empty; do not write placeholder text.

---

### Phase 4: Present and Validate

Present a structured summary to the tech lead:

```
.spec-kit/ created:

  constitution.md   — X principles, Y forbidden patterns
  architecture.md   — X modules, Y layers described
  endpoints.md      — X routes catalogued
  domain.md         — X entities, Y business rules
  references.md     — X integrations, Y key dependencies

⚠️  Items flagged for confirmation: [list items marked <!-- inferred -->]
```

Ask the tech lead to:
1. Confirm or correct any inferred items.
2. Add anything missing.

Apply corrections immediately. Bump the version header after any correction.

---

### Phase 5: Stale Kit Detection (ongoing)

After **any skill completes a task**, the agent must evaluate:

- Did this task introduce or change a business rule? → flag `domain.md`
- Did this task introduce a new pattern, library, or constraint? → flag `constitution.md`
- Did this task change module boundaries or data flow? → flag `architecture.md`
- Did this task add or change an external integration? → flag `references.md`

**Also evaluate by project type:**

| backend | frontend | mobile | fullstack-monorepo (additional) |
|---------|----------|--------|----------------------------------|
| New or modified endpoint | New page, route, or user flow | New screen or navigation path | New endpoint that the frontend must now consume |
| New job, queue, or command | New global state or store module | New platform-specific behavior | New or changed shared type / generated contract |
| New middleware or policy | New reusable component with contracts | New permission or offline behavior | Change to API request/response shape in either workspace |
| | | | Change to local dev startup (new service, env var, docker config) |
| | | | New workspace added to `pnpm-workspace.yaml` or equivalent |

Any of the above → flag `endpoints.md` (backend) or the relevant section of `endpoints.md` (frontend/mobile/monorepo).

> **For monorepos:** a change in the backend workspace that alters an API contract must also be flagged as a potential stale in `endpoints.md > API Contracts` and `domain.md > Shared Domain`, even if only the backend workspace was modified. Cross-workspace contract drift is the highest-risk staleness scenario.

If any flag is set, tell the tech lead:

> "This task touched areas covered by the spec kit. Consider updating `.spec-kit/<document>.md` to keep it accurate. Run `/spec-kit` to update, or edit the file directly."

Never update the spec kit silently during a feature task — always surface it as a suggestion, not an action.

---

## Output

At the end of bootstrap, report:

1. Path to `.spec-kit/` (confirm it was created in the right project root).
2. One-line summary per document with key counts.
3. List of inferred items that still need tech lead confirmation.
4. Suggested next step (e.g., "Now run `/implement-feature` — the spec kit will be loaded automatically as context.").

---

## Additional Resources

- Document templates: [templates/](templates/)
