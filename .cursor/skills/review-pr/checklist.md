# Review Checklist

Detailed reference for each review dimension. The agent reads this during the review to ensure comprehensive coverage. Mirrors the three dimensions from [SKILL.md](SKILL.md).

---

## 1. Code Quality

### Naming

- Variables, functions, classes, and React components use intention-revealing names.
- No cryptic abbreviations (domain-standard ones are fine).
- Booleans read as predicates (`isActive`, `hasPermission`, `canBook`).

### Functions, methods, React components

- Each function / component does one thing.
- Parameter count is reasonable (≤ 3, or wrapped in a structured object / props type).
- No hidden side effects.
- Early returns / guard clauses instead of deep nesting.
- React components use the `function` declaration form, not `const Component = () =>`.

### Structure & design

- Single Responsibility Principle respected.
- Composition favored over inheritance.
- Related code is colocated (component + hook + styles + test live near each other).
- Reusable logic extracted into well-named helpers / hooks / utilities.
- No premature abstractions (DRY ≠ wrong abstraction).
- Backend: controller → service → repository boundaries are not violated (controllers must not import Prisma directly; services own business logic; repositories own data access).
- Frontend: state lives at the right layer — Zustand for global (Auth, Theme), Constate + Context for page-level. TanStack Query for server state. Don't reinvent caching.

### Error handling

- Errors are never swallowed silently.
- Error messages include context (what failed, why, with what input).
- Backend: `HttpException` (or domain-specific subclass) with meaningful message + status code. No raw `throw new Error('oops')`.
- Frontend: failure paths show user-facing feedback consistent with existing UX patterns.
- Failure paths are tested.

### Readability

- No magic numbers or strings — named constants used.
- Nesting depth ≤ 3 levels.
- Comments explain *why*, not *what*.
- No commented-out code left behind.

### Tests

- New behavior has corresponding tests.
- Tests follow Red–Green–Refactor (test written before or alongside code).
- Edge cases and failure paths are covered.
- Tests are isolated — no shared mutable state between tests.
- Test names describe the expected behavior.

### Test quality & coverage

- Changed/added code is exercised by tests — no untested logic paths introduced.
- Coverage does not regress: if the project tracks coverage metrics, new code meets or exceeds the existing threshold.
- Frontend: unit tests with Vitest; integration tests with MSW where the work crosses API boundaries.
- Backend: unit tests for services; **contract / integration tests** for new endpoints; Postman collection at [docs/backend/postman-collection.json](../../../docs/backend/postman-collection.json) updated for manual verification.
- Mocks and stubs are used appropriately — external dependencies mocked, internal logic not over-mocked.
- Assertions are specific: test the exact expected value, not just "no error thrown".
- No flaky patterns: tests must not depend on timing, execution order, or global state.
- Negative tests exist: invalid inputs, unauthorized access, error conditions handled correctly.
- Test data is clear and minimal — fixtures / factories preferred over large inline data blobs.
- If the PR changes a public API or contract, corresponding contract / integration tests exist.

### Patterns & conventions

- Follows existing codebase patterns before introducing new ones.
- Consistent with project separation of concerns (business logic / data access / presentation).
- Frontend: TanStack Router for routing, React Hook Form + Zod for forms, Tailwind + shadcn for styling. Don't introduce alternative libraries without a written justification.
- Backend: DTOs validated with `class-validator`; transformation via `class-transformer`. JSDoc on public methods. NestJS `Logger`, never `console.log`.
- KISS — simplest approach that satisfies the requirement.
- YAGNI — no speculative features or unused abstractions.

### Security (when applicable)

- No secrets, keys, or credentials in code.
- User input is validated and sanitized at the boundary (controller DTO + Zod / class-validator).
- Prisma queries are used — no raw SQL with string interpolation. If `$queryRaw` is used, parameterized form is required.
- Sensitive data is not logged (passwords, tokens, full payloads with PII).
- Auth guards present on endpoints that need them. Public endpoints are explicitly marked.

### Performance (when applicable)

- No N+1 queries or unbounded loops over large datasets.
- Heavy computations are not done in hot paths without reason.
- Resources (connections, file handles) are properly released.
- Frontend: React renders are not blown up by unstable references — memoize expensive selectors / list keys are stable.

### Migrations (backend, when Prisma schema changes)

- Migration file is included in the PR (not just a schema edit).
- Reversibility considered or explicitly called out as one-way.
- Data backfill plan documented if existing data needs transformation.
- No destructive change applied silently (column drops, type narrowings).

---

## 2. Business Rules

### Requirement coverage

- Every acceptance criterion from the task's Critérios de Aceitação has corresponding code.
- No acceptance criterion is partially implemented.
- Behavior matches the described business expectation, not just the happy path.

### Edge cases & data integrity

- Boundary conditions are handled (empty lists, null values, zero amounts, max limits, very long strings, unicode).
- Data transformations preserve integrity (no silent truncation, rounding errors, type-coercion bugs).
- State transitions are valid (no impossible states reachable).

### Domain correctness

- Business terms in code match the ubiquitous language of the domain.
- Calculations, formulas, and rules match the specification.
- Side effects on external systems (notifications, integrations, data writes) are intentional and documented.

### Missing or misunderstood functionality

- Flag any task from the PR checklist that has no corresponding code change.
- Flag code that implements behavior not described in the requirements (scope creep or accidental).
- Flag ambiguous requirements — present as a question, not a finding.

---

## 3. PR Completeness

The PR template at [.github/pull_request_template.md](../../../.github/pull_request_template.md) has 4 Types. **Only the checklist matching the chosen Type is required.** The exact rules per Type live in [SKILL.md → PR Template mapping](SKILL.md#pr-template-mapping). Summary here for reference.

### Always validate

- `## Summary` is non-empty and not just the placeholder comment.
- `## Issue` contains `Closes #N`, `Fixes #N`, or `Resolves #N` with a real, resolvable issue.
- `## Type` has exactly one of the four checkboxes checked. Zero or multiple = Critical.

### Commit hygiene

- Every commit message follows Conventional Commits (`type(scope): description`).
- Each commit is a single logical change.
- No "WIP", "fix", or "temp" commits left unrebased.

### Branch & scope

- Branch name follows `^[0-9]+-[a-z0-9-]+$` and the leading number matches the linked Issue (for Feature / Hotfix Types).
- PR contains only changes related to its stated scope.
- No unrelated formatting changes, refactors, or drive-by fixes mixed in.

### Type-specific checks

See [SKILL.md → PR Template mapping](SKILL.md#pr-template-mapping) for the exact list per Type. Key Critical-severity rules:

- Hotfix missing a planned / linked back-merge PR.
- Release or Back-merge planning to use `--delete-branch` for the long-lived source (`develop` or `main`).
- Release missing explicit human approval.
- CI not green on the release / back-merge PR.

### Documentation updates

- Frontend changes: [docs/frontend/status.md](../../../docs/frontend/status.md), [docs/frontend/implementationHistory.md](../../../docs/frontend/implementationHistory.md), and [docs/frontend/architecture.mermaid](../../../docs/frontend/architecture.mermaid) updated when warranted.
- Backend changes: [docs/backend/status.md](../../../docs/backend/status.md), [docs/backend/implementationHistory.md](../../../docs/backend/implementationHistory.md), [docs/backend/architecture.mermaid](../../../docs/backend/architecture.mermaid) updated; [docs/backend/postman-collection.json](../../../docs/backend/postman-collection.json) updated if the API surface changed.
- Task entry: Critérios de Aceitação checkboxes flipped to `- [x]` for criteria whose backing tests now pass.

If documentation updates are missing for non-trivial changes, raise as Suggestion (Critical if the change is API-surface and the Postman collection is out of date).
