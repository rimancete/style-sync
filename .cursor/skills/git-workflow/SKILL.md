---
name: git-workflow
description: >-
  Automate this project's GitHub flow — ensure a linked Issue exists,
  create the `{N}-{slug}` branch from the correct base (`develop` for normal
  work, `main` for hotfixes), commit with conventional messages, push, and
  open a Pull Request via either the `gh` CLI or the `user-github_style-sync`
  GitHub MCP server. Enforces release / hotfix / back-merge rules and the
  one-Issue-one-branch-one-PR discipline.
  Use when the user asks to start a feature, create a branch, push changes,
  open a PR, run a release (`develop` → `main`), apply a hotfix, or plan a
  back-merge (`main` → `develop`).
---

# GitHub Workflow

End-to-end GitHub flow for this repository, sourced from [git-workflow.md](./git-workflow.md) and [.github/pull_request_template.md](../../../.github/pull_request_template.md). Read those first if you need the full rationale.

## Golden Rules

These are non-negotiable. Every workflow phase below assumes them.

1. **One Issue, one branch, one PR.** Before `gh pr create` (or `create_pull_request`), always check whether a PR is already open for the current branch. If yes, push to it — do not create a duplicate.
2. **Normal work** branches from `develop` and PRs target `develop`.
3. **Hotfixes** branch from `main`, PR targets `main`, and you must plan the back-merge PR `main` → `develop` immediately after.
4. **Never merge `develop` → `main`, run a release, or back-merge without explicit human confirmation.** Stop and ask if a release/back-merge PR appears in scope.
5. **Never delete `main` or `develop`.** Never pass `--delete-branch` to `gh pr merge` for release or back-merge PRs. Never click "Delete branch" for these long-lived refs in the UI.
6. **Always include `Closes #N`, `Fixes #N`, or `Resolves #N`** in the PR body so the linked issue closes on merge.
7. **Run `pnpm lint` locally** when changes can affect lint. CI must stay green (`Install and lint` workflow in [.github/workflows/ci.yml](../../../.github/workflows/ci.yml)).

## Prerequisites

For PR/Issue operations the agent can use either of two tools. At least one must be configured:

- **`gh` CLI** — see [gh-setup.md](gh-setup.md).
- **GitHub MCP** (`user-github_style-sync`) — see [mcp-setup.md](mcp-setup.md).

All native git operations (`fetch`, `checkout`, `commit`, `push`, `pull`) always use plain `git`, regardless of which tool is chosen for PRs.

---

## Workflow

### 1. Choose tooling (once per environment)

The skill persists the developer's last choice in `.cursor/skills/git-workflow/.last-tool` (gitignored — single line, either `gh` or `mcp`).

- If `.last-tool` exists and contains a valid value, **use it without asking**.
- If missing, empty, or invalid: ask once via `AskQuestion` with two options:
  - `gh` — use the `gh` CLI for PR/Issue operations
  - `mcp` — use the `user-github_style-sync` GitHub MCP for PR/Issue operations
- Persist the selection by writing the chosen value to `.cursor/skills/git-workflow/.last-tool`.
- If the developer asks to switch mid-flow, overwrite `.last-tool`.

### 2. Resolve the Issue and the task source

- Source of truth for upcoming work: the `tasks/` files. Headings use `### {PREFIX-NNN}: {Title}` — the prefix stays in `tasks/` only; the GitHub Issue and branch use the numeric `NNN`.
- Examples (see [git-workflow.md](./git-workflow.md) for more):
  - Task heading: `BUS-004: Login API integration`
  - GitHub Issue: `#4` titled `Login API integration`
  - Branch: `4-login-api-integration`
- If the user did not provide an Issue number, ask for it (or hand off to `create-task` skill to draft the task, then ask the developer to create / confirm the Issue).

### 3. Decide the base branch

| Type of work              | Branch FROM         | PR base                                             |
| ------------------------- | ------------------- | --------------------------------------------------- |
| Feature / normal task     | `develop`           | `develop`                                           |
| Hotfix on production      | `main`              | `main` (+ back-merge `main` → `develop` afterwards) |
| Release (human-approved)  | `develop` (as head) | `main`                                              |
| Back-merge (after hotfix) | `main` (as head)    | `develop`                                           |

### 4. Fetch and create / check out the branch

```bash
git fetch origin
```

Branch name pattern: `{issueNumber}-{slug}` — lowercase, hyphenated, no bracket prefixes.

```bash
git checkout <base>            # develop for normal, main for hotfix
git pull origin <base>
git checkout -b <N>-<slug>     # e.g. 4-login-api-integration
```

If the branch already exists locally or on the remote, **check it out** instead of creating a new one:

```bash
git fetch origin
git checkout <N>-<slug>
git pull origin <N>-<slug>
```

### 5. Commit with Conventional Commits

```
<type>(<optional-scope>): <description>
```

Common types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`.

- One logical change per commit.
- Imperative mood ("add", not "added").
- Reference `#N` only when meaningful — `Closes #N` goes in the PR body, not in every commit.

### 6. Push the branch

```bash
git push -u origin HEAD
```

### 7. Check for an existing PR before creating one

Always do this — it's the only way to enforce "one Issue, one branch, one PR":

**If `gh`:**

```bash
gh pr list --head "$(git branch --show-current)" --state open
```

**If `mcp`:** call `list_pull_requests` on `user-github_style-sync` with `owner`, `repo`, `head=<owner>:<current-branch>`, `state=open`.

- If a PR is already open: do **not** create another one. Push commits — the PR updates automatically. Optionally update the description (see [Updating an existing PR](#updating-an-existing-pr)).
- If none exists: continue to step 8.

### 8. Create the PR

Fill the body using [.github/pull_request_template.md](../../../.github/pull_request_template.md). Sections and rules:

- `## Summary` — explain *what* and *why* (not just the diff).
- `## Issue` — `Closes #N` (or `Fixes` / `Resolves`).
- `## Type` — check **exactly one** of the four boxes (Feature / Hotfix / Release / Back-merge).
- The checklist matching the chosen Type — fill it. Leave the other three unchanged or remove them.
- `## Notes` — optional: deployment, risks, follow-up work, screenshots.

The PR template lives at [.github/pull_request_template.md](../../../.github/pull_request_template.md) — that path is required for GitHub to auto-load it in the PR UI.

**If `gh`:**

```bash
gh pr create \
  --base <base> \
  --head "$(git branch --show-current)" \
  --title "#<N> <Issue title>" \
  --body "$(cat <<'EOF'
<filled PR template body>
EOF
)"
```

A repository GitHub Action sets the PR title from the linked Issue when it can detect the issue number from the branch name (`^<N>-`) or from `Closes` / `Fixes` / `Resolves` in the body. Default format: `#N {issue title}`. To opt out, add the `skip-pr-title-bot` label.

**If `mcp`:** call `create_pull_request` on `user-github_style-sync` with:

- `owner`: `<github-owner>` (derive from `git remote get-url origin`)
- `repo`: `<repo-name>`
- `title`: `#<N> <Issue title>`
- `head`: `$(git branch --show-current)`
- `base`: `<develop|main>`
- `body`: filled PR template body
- `draft`: `true` if the PR is still in progress

**Fallback (no tool available):** instruct the developer to open the PR via the GitHub web UI at `<repo-url>/compare/<base>...<branch>`.

### 9. Output to the developer

After creating (or updating) the PR, report:

1. Branch name created / checked out.
2. Git commands executed (high-level).
3. PR URL (regardless of which tool was used).
4. Summary of commits pushed.
5. Whether CI has been triggered (a fresh push starts the `Install and lint` workflow).

---

## Updating an existing PR

When pushing new commits to a branch that already has an open PR (review feedback, CI fixes, follow-up work):

1. Push the new commits — the PR updates automatically.
2. If the description needs refreshing (checkboxes, new tasks, additional notes):
   - **`gh`**: `gh pr edit <N> --body "$(cat <<'EOF' ... EOF)"`
   - **`mcp`**: `update_pull_request` on `user-github_style-sync` with `pullNumber=<N>` and the new `body`.
3. **Never** create a second PR for the same branch / Issue while the original PR is still open.

---

## Release (`develop` → `main`)

Requires **explicit human confirmation in the conversation**. Do not initiate this flow on your own.

1. Confirm with the developer: "Please confirm you want to open a Release PR merging `develop` into `main`."
2. Open the PR (PR template Type = "Release `develop` → `main`"):
   - **`gh`**: `gh pr create --base main --head develop --title "Release: <date or version>" --body "$(cat <<'EOF' ... EOF)"`
   - **`mcp`**: `create_pull_request` with `head=develop`, `base=main`.
3. Fill the Release Checklist. Do **not** check "delete head branch" anywhere; do **not** plan to click the UI's "Delete branch" button after merge — `develop` is long-lived.
4. After merge:
   - **`gh`**: `gh pr merge <N> --merge` (or `--squash` per team convention). **Never** pass `--delete-branch`.
   - **`mcp`**: `merge_pull_request` on `user-github_style-sync`. Do not set delete-branch options.

## Hotfix (production) and Back-merge

Hotfixes target `main` directly. They **must** be followed by a back-merge PR `main` → `develop` so `develop` stays current.

1. Branch from `main`:

   ```bash
   git fetch origin
   git checkout main
   git pull origin main
   git checkout -b <N>-<slug>
   ```

2. Implement, commit, push.
3. Open the hotfix PR with `base=main`. PR template Type = "Hotfix targeting `main`". Explain production impact in `## Summary` or `## Notes`.
4. **Immediately plan the back-merge PR** `main` → `develop` (PR template Type = "Back-merge `main` → `develop`"). Link the hotfix PR or Issue in `## Notes`.
5. Same long-lived-branch deletion guard as Release: never `--delete-branch`, never click "Delete branch" for `main`.

Skipping the back-merge leaves `develop` missing the hotfix until someone catches it manually.

---

## MCP tool reference (when `.last-tool == mcp`)

All tools are on the `user-github_style-sync` server. Always read the descriptor in `mcps/user-github_style-sync/tools/<tool>.json` if you are unsure about an argument.

| Action                                              | Tool                        | Key arguments                                                                                                        |
| --------------------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Create PR                                           | `create_pull_request`       | `owner, repo, title, head, base, body, draft?`                                                                       |
| Update PR                                           | `update_pull_request`       | `owner, repo, pullNumber, body?, title?, state?, draft?`                                                             |
| List PRs                                            | `list_pull_requests`        | `owner, repo, head?, base?, state?`                                                                                  |
| Read PR                                             | `pull_request_read`         | `owner, repo, pullNumber, method=get|get_diff|get_files|get_check_runs|get_reviews|get_comments|get_review_comments` |
| Merge PR                                            | `merge_pull_request`        | `owner, repo, pullNumber, merge_method` (never pass delete-branch flags for release/back-merge)                      |
| Create Issue                                        | `issue_write`               | `method=create, owner, repo, title, body, labels?`                                                                   |
| Update Issue                                        | `issue_write`               | `method=update, owner, repo, issue_number, ...`                                                                      |
| Add PR/Issue comment                                | `add_issue_comment`         | `owner, repo, issue_number (=PR number), body`                                                                       |
| Create review (approve / request changes / comment) | `pull_request_review_write` | `method=create, owner, repo, pullNumber, event=APPROVE|REQUEST_CHANGES|COMMENT, body, commitID?`                     |

For inline review comments and review-thread management, the `review-pr` skill is the right caller. This skill stays focused on branch + PR lifecycle.

---

## Quick reference

```bash
# Normal feature flow
git fetch origin
git checkout develop && git pull origin develop
git checkout -b 4-login-api-integration
# implement + commit (conventional commits)
git push -u origin HEAD

# Pre-flight: is there already an open PR for this branch?
gh pr list --head "$(git branch --show-current)" --state open

# If no, create one
gh pr create --base develop \
  --title "#4 Login API integration" \
  --body "$(cat .github/pull_request_template.md)"
```

## Rules recap

- One Issue, one branch (`{N}-{slug}`), one PR.
- Feature/Task PRs target `develop`. Hotfix PRs target `main`. Release PRs target `main`. Back-merge PRs target `develop`.
- Always run `gh pr list --head <branch>` (or `list_pull_requests`) before creating.
- Always include `Closes #N` / `Fixes #N` / `Resolves #N` in the PR body.
- Never merge `develop` → `main` or do release / back-merge without explicit human confirmation.
- Never delete `main` or `develop`; never use `--delete-branch` for release / back-merge PRs.
- Conventional Commits, imperative mood.
- `pnpm lint` clean locally before push when changes affect lint.
