# Git and GitHub workflow

This repository uses a **develop** integration branch and **main** for production-aligned releases. Work is tracked with **GitHub Issues** and **Pull Requests**.

## Issues and milestones

- Every PR should link to an **Issue** (reference `#n` in the description; use `Closes #n` or `Fixes #n` when the PR should close the issue on merge).
- Use **Milestones** for larger or multi-step work; small tasks can stay without a milestone.

## Branch naming

Pattern: `{issueNumber}-{slug-from-title}` (lowercase, hyphenated).

Examples:

- Issue `#1` titled `[LOGIN] API Integration` → branch `1-login-api-integration`
- Issue `#2` titled `[FIX] Set booking request limit` → branch `2-fix-set-booking-request-limit`

Slugs may strip bracket prefixes; the issue number is the source of truth for traceability.

## Day-to-day work (features and fixes)

1. Create the issue on GitHub (and milestone if needed).
2. `git fetch origin` and create your branch from **`develop`**:

   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b 1-login-api-integration
   ```

3. Commit and push. Open a **Pull Request** with **base `develop`**.
4. In the PR description, link the issue (`Closes #1`, etc.).
5. Wait for review and CI; merge into **`develop`** when approved.

**One issue, one branch, one PR.** Do not create a second PR for a branch that already has an open one. If you need to verify, run `gh pr list --head <branch>` before creating.

**Commit messages:** follow [docs/projectArchitecture.md](projectArchitecture.md) (`type(scope): description`).

## Continuing work on an existing PR

When you need to address review feedback, fix CI, or make follow-up changes on a branch that already has an open PR:

1. Check out the existing branch:

   ```bash
   git fetch origin
   git checkout 1-login-api-integration
   git pull origin 1-login-api-integration
   ```

2. Make your changes, commit, and push. The open PR updates automatically with the new commits.
3. **Do not** create a new branch or a new PR for the same issue while the original PR is still open.

## PR title automation

A GitHub Action sets the PR title from the linked issue when it can detect the issue number from:

- the branch name (`^123-`), or
- `Closes` / `Fixes` / `Resolves` in the PR body.

Default title format: `#n {issue title}`.

To opt out for a specific PR, add the label **`skip-pr-title-bot`** to the pull request.

## Release: merge develop into main

When you want production (`main`) to match integration (`develop`):

1. Prefer a **Pull Request** from `develop` into `main` (clear history and optional required reviewers).
2. Merge after your validation (tests, review, deploy alignment).

Alternatively you may merge locally and push `main`; the team should document which approach is standard.

**Do not** let automation merge `develop` → `main` without explicit human approval for this repository.

## Hotfix (production) and back-merge

Use when you must fix **production** without waiting for the normal release window, or when `main` has diverged in a way that requires a direct fix on `main`.

1. Branch from **`main`**: `git checkout main && git pull && git checkout -b 42-fix-payment-timeout`
2. Open a PR with **base `main`**; link the issue; merge after validation.
3. **Back-merge:** open a second PR from **`main` into `develop`** so `develop` includes everything on `main` (merge commits, hotfix, etc.). Suggested title pattern: `chore: sync develop with main (after hotfix)` or reference the hotfix issue/PR.

Skipping the back-merge leaves `develop` missing the hotfix until someone merges it manually.

## Continuous integration

Pull requests and pushes to `main` / `develop` run [.github/workflows/ci.yml](../.github/workflows/ci.yml) (install dependencies with `pnpm install --frozen-lockfile`, then `pnpm lint`).

- Node version comes from [.nvmrc](../.nvmrc) (Node 24.x).
- Package manager: **pnpm** (see root [package.json](../package.json)).

You can require this workflow to pass under **Settings → Branches → Branch protection rules** (status check name as shown in the Actions tab).

## Branch protection (GitHub settings)

Recommended (adjust to your team):

- **`main`:** require PR before merging; require status checks (CI); optional required reviewers.
- **`develop`:** require PR or allow trusted maintainers; require CI on PRs.

Creating the `develop` branch (first time):

```bash
git checkout main
git pull origin main
git checkout -b develop
git push -u origin develop
```

These settings are not stored in the repo; configure them in the GitHub UI.

## Agent and local tooling

AI assistants working in this repo should follow this document. They must **not** merge `develop` → `main` or perform release/back-merge steps without **explicit human confirmation**. Run `pnpm lint` locally when changing code that must pass CI.

Before running `gh pr create`, agents **must** check `gh pr list --head <branch>` to verify no PR already exists. If one is open, push new commits to the existing branch — the PR updates automatically. Never create duplicate PRs for the same branch or issue.
