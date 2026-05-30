# `gh` CLI setup

Use these steps once per developer machine to make the `gh` path of the [git-workflow](SKILL.md) skill work.

## 1. Install

| OS              | Command                                                                     |
| --------------- | --------------------------------------------------------------------------- |
| macOS           | `brew install gh`                                                           |
| Debian / Ubuntu | `sudo apt install gh` (or follow [cli.github.com](https://cli.github.com/)) |
| Arch / Manjaro  | `sudo pacman -S github-cli`                                                 |
| Fedora          | `sudo dnf install gh`                                                       |
| Windows         | `winget install --id GitHub.cli`                                            |

Reference: <https://cli.github.com/manual/installation>.

## 2. Authenticate

```bash
gh auth login
```

Recommended answers when prompted:

- Account: **GitHub.com**
- Preferred protocol: **HTTPS** (or SSH if your git is already SSH-based)
- Authenticate Git with your GitHub credentials: **Yes**
- How to authenticate: **Login with a web browser** (easiest) or **Paste an authentication token**

If using a token, ensure these scopes are present:

- `repo` — read/write code, issues, PRs.
- `read:org` — for org-owned repos.
- `workflow` — to read CI status (`gh pr checks`).

Validate:

```bash
gh auth status
```

You should see the active account and scopes including at least `repo`.

## 3. Sanity check against this repo

Run inside the repository root:

```bash
gh repo view --json name,defaultBranchRef
gh pr list --state open
```

Both must succeed. If either fails with an auth error, re-run `gh auth login`.

## 4. Persist the choice

Once `gh` is verified, write `gh` to the skill's tool selector so future runs do not re-ask:

```bash
echo gh > .cursor/skills/git-workflow/.last-tool
```

(This file is gitignored — see [.gitignore](.gitignore).)

## Troubleshooting

| Symptom                                                                | Fix                                                                                              |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `gh: command not found`                                                | Install (step 1).                                                                                |
| `error: authentication required` on `gh pr create`                     | `gh auth login` again, ensure `repo` scope is granted.                                           |
| `gh pr create` says "no commits between develop and `<branch>`"        | You forgot `git push` before creating the PR, or your branch points to the same SHA as the base. |
| `gh pr list --head <branch>` returns nothing but a PR exists in the UI | The PR may target a different repo (fork). Pass `--repo owner/name` explicitly.                  |
