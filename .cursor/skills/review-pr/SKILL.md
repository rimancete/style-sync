---
name: review-pr
description: >-
  Review the current branch's open GitHub Pull Request (or local commits
  ahead of base) — analyze the diff, check code quality, business-rule
  coverage, and PR-description completeness against
  `.github/pull_request_template.md`. Outputs prioritized findings
  (Critical / Suggestion / Nice-to-have) and a verdict
  (APPROVED / NEEDS CHANGES / BLOCKED). Optionally publishes selected
  findings to GitHub as PR comments (summary + inline) via the tool already
  chosen for `git-workflow` (`gh` or the `user-github_style-sync` MCP).
  Never posts to GitHub without explicit developer confirmation per finding
  selection. Never auto-invoked — developer requests it manually or accepts
  the offer from `implement-client` / `implement-server`.
  Use when the user asks to review code, review a PR, check PR quality,
  audit changes before merge, or post review comments to GitHub.
---

# Review PR

Local code review of the current branch against its base branch. Outputs a prioritized findings list. Optionally publishes the selected findings to GitHub as PR comments.

This skill is **never auto-invoked**. It runs when:

- The developer asks for a code review.
- The developer accepts the "Run review-pr" offer from [implement-client](../implement-client/SKILL.md) or [implement-server](../implement-server/SKILL.md).

## Prerequisites

- Current branch has commits ahead of base. Base is `develop` for normal work, `main` for hotfix PRs.
- Tool selection is sourced from `.cursor/skills/git-workflow/.last-tool` (`gh` or `mcp`). Reuse the value — never re-prompt the developer here.
- The PR template lives at [.github/pull_request_template.md](../../../.github/pull_request_template.md). The completeness rules in this skill are derived from it.
- The detailed review checklist lives at [checklist.md](checklist.md).

## Workflow

### 1. Prepare the diff

Update base and gather the full diff plus metadata:

```bash
# Detect base from the open PR when possible; otherwise default to `develop`
BASE=$(gh pr view --json baseRefName -q .baseRefName 2>/dev/null || echo develop)

git fetch origin "$BASE":"$BASE"
rtk git diff "$BASE"...HEAD
git diff "$BASE"...HEAD --name-only
rtk git log "$BASE"...HEAD --oneline
git log "$BASE"...HEAD --format=%s        # for conventional-commit check
```

If no open PR exists (`gh pr view` returns nothing), default `BASE=develop` and continue with commit-message-based inference.

### 2. Gather PR context

Read the PR description, title, base, and head.

**If `gh`:**

```bash
gh pr view --json title,body,number,baseRefName,headRefName,url
rtk gh pr checks "$(gh pr view --json number -q .number)" 2>/dev/null || true
```

**If `mcp`:** call `list_pull_requests` on `user-github_style-sync` with `owner`, `repo`, `head=<owner>:<current-branch>`, `state=open` → take the first result. Then call `pull_request_read` with `method=get` for the body, and `method=get_check_runs` for CI status.

If no open PR exists, use the commit messages and diff to infer scope. The completeness section ("PR Completeness") becomes "Pending — no PR body to review yet" in the output.

### 3. Build the business-context model

Before judging code, build a mental model of **what the PR is trying to achieve**:

1. Read `## Summary` (intent), `## Issue` (linked Issue), `## Type` (release flavor), and the matching checklist.
2. If an Issue is linked, optionally pull it (`rtk gh issue view <N>` or `issue_read` MCP) to read the acceptance criteria from the task source.
3. Map each task/checklist item to actual diff changes. Flag:
   - Tasks with no backing diff (missing implementation).
   - Diff areas with no backing task (scope creep).
   - Ambiguous requirements (surface as questions, not findings).

### 4. Review across three dimensions

Use parallel `MultiTask` subagents with `subagent_type="explore"` and `thoroughness="very thorough"` for non-trivial diffs. Each subagent owns one dimension (see [checklist.md](checklist.md) for the full criteria):

1. **Code Quality** — naming, function shape, structure, error handling, readability, tests (quality + coverage), patterns/conventions, security, performance.
2. **Business Rules** — acceptance-criterion coverage, edge cases, data integrity, domain correctness, missing or misunderstood functionality.
3. **PR Completeness** — driven by the PR template Type. See the [PR Template mapping](#pr-template-mapping) below.

For each finding, capture:

- **What** — specific file and line range where possible.
- **Why** — impact on correctness, maintainability, security, or business logic.
- **How to fix** — concrete suggestion, not a vague nudge.

### 5. Classify findings

| Severity | Meaning | Action |
| --- | --- | --- |
| **Critical** | Bugs, broken business rules, security issues, data loss / migration risk, missing required functionality | Must fix before merge |
| **Suggestion** | Code smells, missing tests, unclear naming, inconsistent patterns, partial requirement coverage | Should fix or justify skipping |
| **Nice-to-have** | Style preferences, minor optimizations, optional doc improvements | Fix if time allows |

### 6. Output the review

Use the language the developer is using. Present findings grouped by severity, highest first:

```
## Code Review — `<branch-name>`

**Scope**: <1-sentence summary of what the PR does>
**Base** ← **Head**: `<base>` ← `<head>`
**Files changed**: <count>
**Commits**: <count>

---

### Critical

- **[file:line]** <description>
  *Why*: <impact>
  *Fix*: <suggestion>

### Suggestion

- **[file:line]** <description>
  *Why*: <impact>
  *Fix*: <suggestion>

### Nice-to-have

- **[file:line]** <description>
  *Fix*: <suggestion>

---

### PR Completeness (Type: <detected type>)

- [ ] Summary present and accurate
- [ ] Issue link present (`Closes #N`); for Feature / Hotfix, number resolves to a real Issue and matches the `{N}-` branch prefix
- [ ] Type checkbox: exactly one checked
- [ ] <Type-specific items, see PR Template mapping>

---

**Verdict**: <APPROVED / NEEDS CHANGES / BLOCKED>
<1-sentence rationale>
```

Verdict rules:

- **BLOCKED** — any Critical finding exists.
- **NEEDS CHANGES** — no Critical, but Suggestions affect correctness or requirement coverage.
- **APPROVED** — only Nice-to-have findings (or no findings at all).

### 7. Optionally publish to GitHub

After presenting the local review, **ask the developer** which findings to publish. Never post automatically.

Use `AskQuestion` with three options:

- **All findings** — post everything.
- **Pick specific** — the developer lists which items by number / description.
- **Skip** — keep the review local.

If the developer chooses to publish, use the tool from `.cursor/skills/git-workflow/.last-tool`.

#### a) Resolve the PR number

**If `gh`:**

```bash
PR_NUMBER=$(gh pr view --json number -q .number)
```

**If `mcp`:** `list_pull_requests` on `user-github_style-sync` with `owner`, `repo`, `head=<owner>:<current-branch>`, `state=open`. Take the first result's `number` field.

If no open PR exists for the current branch, inform the developer and skip posting.

#### b) Post a summary comment (issue-level)

Compose a single PR comment with all selected findings formatted as markdown (same structure as the local output, only the selected items).

**If `gh`:**

```bash
gh pr comment "$PR_NUMBER" --body "$(cat <<'EOF'
<formatted review summary>
EOF
)"
```

**If `mcp`:** call `add_issue_comment` on `user-github_style-sync` with `owner`, `repo`, `issue_number=$PR_NUMBER`, `body=<formatted review summary>`. (`add_issue_comment` works for PRs — pass the PR number as `issue_number`.)

#### c) Post inline review comments on specific lines

For findings that reference a specific file and line, post inline comments. The cleanest path is a single review with all inline comments bundled, so the developer gets one notification instead of many.

**If `gh`:**

`gh` doesn't expose a one-shot bulk review API, so post inline comments individually via the REST API:

```bash
COMMIT_SHA=$(git rev-parse HEAD)
OWNER_REPO=$(gh repo view --json owner,name -q '"\(.owner.login)/\(.name)"')

gh api --method POST "repos/$OWNER_REPO/pulls/$PR_NUMBER/comments" \
  -f "body=<finding description + fix>" \
  -f "commit_id=$COMMIT_SHA" \
  -f "path=<file path>" \
  -F "line=<line number>" \
  -f "side=RIGHT"
```

**If `mcp`:** prefer a **single review** with all inline comments:

1. Call `pull_request_review_write` with `method=create` (no `event` → pending review) on `user-github_style-sync` for `owner`, `repo`, `pullNumber=$PR_NUMBER`.
2. For each finding, call `add_comment_to_pending_review` with `owner`, `repo`, `pullNumber=$PR_NUMBER`, `path=<file>`, `line=<line>`, `side=RIGHT`, `subjectType=LINE`, `body=<finding description + fix>`.
3. Submit the review: `pull_request_review_write` with `method=submit_pending`, `event=COMMENT` (or `REQUEST_CHANGES` if any Critical findings were posted), and an optional `body` recap.

If inline posting fails for a specific finding (line not in the diff, API error, file out of scope), fold that finding into the summary comment instead. Don't let a single failure abort the whole batch.

#### d) Confirm to the developer

After posting, report:

- PR link.
- How many findings were posted (summary + inline breakdown).
- Any findings that failed to post inline and were folded into the summary instead.

---

## PR Template mapping

The template at [.github/pull_request_template.md](../../../.github/pull_request_template.md) has 4 PR Types. **Only the checklist matching the chosen Type is required**; the other three are ignored.

### Always validate (any Type)

- `## Summary` — non-empty and not just the `<!-- ... -->` placeholder.
- `## Issue` — contains `Closes #N`, `Fixes #N`, or `Resolves #N`. Fetch the Issue (`rtk gh issue view <N>` or `issue_read` MCP) and confirm it exists and is an Issue (not a PR). For Feature / Hotfix Types, `N` must also match the `{N}-` prefix of the head branch (both feed the close-issue Action on merge into `develop`). Release and Back-merge PRs may omit a closing keyword.
- `## Type` — exactly **one** of the four checkboxes is checked. Flag if zero or multiple.
- **Commit hygiene** — every commit message in `git log <base>...HEAD --format=%s` matches Conventional Commits (`type(scope): description`). Reasonable types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`.

### If Type = `Feature / task` (most common — base `develop`)

- Branch name matches `^[0-9]+-[a-z0-9-]+$`. Leading number == linked Issue `N` (same number the close-issue Action will close).
- PR `baseRefName` == `develop`.
- Issue link present and resolvable (already verified above).
- `rtk pnpm lint` passed locally **or** a skip rationale is documented in `## Notes`. CI's `Install and lint` check should be green (`rtk gh pr checks <N>` / `pull_request_read method=get_check_runs`).

### If Type = `Hotfix targeting main`

- Branch name matches `^[0-9]+-[a-z0-9-]+$`.
- PR `baseRefName` == `main`.
- `## Summary` or `## Notes` explains production impact and urgency.
- Issue link present.
- `rtk pnpm lint` rule (same as Feature).
- **Follow-up back-merge PR** (`main` → `develop`) is planned or linked in `## Notes`. Missing back-merge is a Critical finding — it leaves `develop` missing the hotfix.

### If Type = `Release develop → main`

- PR `headRefName` == `develop`, `baseRefName` == `main`.
- `## Notes` (or comments) shows explicit release approval from a human.
- CI passed for the release PR (`rtk gh pr checks <N>` / MCP `pull_request_read method=get_check_runs`).
- **No `--delete-branch` / "Delete branch"** is planned after merge — `develop` is long-lived. Flag any indication otherwise as Critical.

### If Type = `Back-merge main → develop`

- PR `headRefName` == `main`, `baseRefName` == `develop`.
- `## Summary` / `## Notes` links the hotfix PR or Issue.
- If conflicts existed, the resolution is described and did not drop the hotfix.
- CI passed.
- **No `--delete-branch` / "Delete branch"** is planned after merge — `main` is long-lived. Flag any indication otherwise as Critical.

---

## Guidelines

- Be specific: reference files and line numbers, not vague areas.
- Be actionable: every finding includes a concrete fix or direction.
- Be fair: acknowledge good patterns and well-written code when encountered.
- Don't nitpick style when the codebase has no formatter / linter enforcing it — focus on substance.
- When business context is ambiguous, flag it as a question rather than a finding.
- For large diffs, parallelize via `Task` subagents reviewing independent file groups concurrently.
- Never post to GitHub without explicit developer selection.
