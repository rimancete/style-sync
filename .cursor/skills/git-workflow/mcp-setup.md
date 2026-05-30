# GitHub MCP setup (`user-github_style-sync`)

Use these steps to make the `mcp` path of the [git-workflow](SKILL.md) skill work via the GitHub MCP server already configured for this project.

## 1. Verify the server is enabled

The server identifier is `user-github_style-sync`. In Cursor, open the MCP settings and confirm it is listed and connected. Tool descriptors live in `~/.cursor/projects/<workspace-hash>/mcps/user-github_style-sync/tools/*.json` — read them when you are unsure about a tool's arguments.

A quick sanity check from a Cursor chat: ask the agent to call `get_me` on `user-github_style-sync`. If it returns your GitHub user, the server is wired correctly.

## 2. Required permissions

The MCP server uses a GitHub token (typically a GitHub App installation token or a fine-grained PAT). For this project's workflow, the token must allow:

- `Pull requests: Read and write` — create/update/merge PRs, post review comments.
- `Issues: Read and write` — create / update Issues.
- `Contents: Read` — to read repository metadata, file contents, branches.
- `Metadata: Read` — implicit for any operation.

If the agent gets `403` errors when calling `create_pull_request`, `issue_write`, or `pull_request_review_write`, the token is missing one of the above scopes.

## 3. Tool inventory (this project)

These are the tools the `git-workflow` skill relies on. Always re-read the descriptor JSON before calling.

| Skill action                                                   | MCP tool                                                                                                          |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Create PR                                                      | `create_pull_request`                                                                                             |
| Update PR (body / title / state)                               | `update_pull_request`                                                                                             |
| List PRs (e.g. duplicate check)                                | `list_pull_requests`                                                                                              |
| Read PR (details / diff / files / checks / reviews / comments) | `pull_request_read` (`method=get|get_diff|get_files|get_check_runs|get_reviews|get_comments|get_review_comments`) |
| Merge PR                                                       | `merge_pull_request`                                                                                              |
| Create Issue                                                   | `issue_write` (`method=create`)                                                                                   |
| Update Issue                                                   | `issue_write` (`method=update`)                                                                                   |
| Comment on PR/Issue (issue-level)                              | `add_issue_comment` (use the PR number as `issue_number` for PR comments)                                         |
| Submit a PR review                                             | `pull_request_review_write` (`method=create`, `event=APPROVE|REQUEST_CHANGES|COMMENT`)                            |
| Add a pending review comment to a line                         | `add_comment_to_pending_review`                                                                                   |
| Resolve / unresolve a review thread                            | `pull_request_review_write` (`method=resolve_thread|unresolve_thread`, `threadId=...`)                            |

## 4. Owner / repo arguments

Every MCP call requires `owner` and `repo`. Derive them from:

```bash
git remote get-url origin
# => git@github.com:<owner>/<repo>.git or https://github.com/<owner>/<repo>.git
```

Parse `<owner>` and `<repo>` (strip `.git` suffix) and pass them on every call.

## 5. Persist the choice

Once verified, write `mcp` to the skill's tool selector:

```bash
echo mcp > .cursor/skills/git-workflow/.last-tool
```

(File is gitignored — see [.gitignore](.gitignore).)

## 6. Long-lived branch guard

The MCP `merge_pull_request` tool may expose a delete-branch flag. **Never set it to true** for:

- Release PRs (`develop` → `main`).
- Back-merge PRs (`main` → `develop`).

Both source branches are long-lived and must be preserved. The skill [SKILL.md](SKILL.md) reinforces this rule.

## Troubleshooting

| Symptom                                      | Likely cause                                                                                              |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `403 Resource not accessible by integration` | Token missing PR / Issue write scope.                                                                     |
| `404 Not Found` on `create_pull_request`     | Wrong `owner`/`repo`, or the `head` branch was never pushed.                                              |
| `422 No commits between <base> and <head>`   | Same SHA on both sides — push commits first.                                                              |
| MCP tool not in inventory                    | Check `mcps/user-github_style-sync/tools/` for the actual tool name; descriptors are the source of truth. |
