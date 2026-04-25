## Summary

<!-- Short description of the change -->

## Issue

<!-- Link the issue this PR addresses -->

Closes #

## Type

<!-- Check one type and fill only the matching section below. -->

- [ ] Feature / task (target branch: **`develop`**)
- [ ] Hotfix targeting **`main`** (production)
- [ ] Release **`develop` → `main`**
- [ ] Back-merge **`main` → `develop`** (after a hotfix merged to `main`)

## Feature / Task Checklist

<!-- Use for normal work merged into develop. -->

- [ ] Branch name follows `issueNumber-slug` (e.g. `4-login-api-integration`)
- [ ] Base branch is **`develop`**
- [ ] Issue link uses `Closes #n`, `Fixes #n`, or `Resolves #n`. It must close on merge
- [ ] `pnpm lint` passes locally, or the reason for skipping is noted below

## Hotfix Checklist

<!-- Use only for production fixes that must merge directly into main. -->

- [ ] Branch name follows `issueNumber-slug` (e.g. `42-fix-payment-timeout`)
- [ ] Base branch is **`main`**
- [ ] Production impact and urgency are explained in the summary or notes
- [ ] Issue link uses `Closes #n`, `Fixes #n`, or `Resolves #n`. It must close on merge
- [ ] `pnpm lint` passes locally, or the reason for skipping is noted below
- [ ] Follow-up back-merge PR (`main` → `develop`) is planned or linked

## Release Checklist

<!-- Use when promoting develop into main. -->

- [ ] Source branch is **`develop`**
- [ ] Base branch is **`main`**
- [ ] Release was explicitly approved before merge
- [ ] CI passed for the release PR
- [ ] Do **not** enable "delete head branch" and do **not** click **Delete branch** after merge; **`develop`** is long-lived

## Back-Merge Checklist

<!-- Use after a hotfix has merged into main and must be brought back into develop. -->

- [ ] Source branch is **`main`**
- [ ] Base branch is **`develop`**
- [ ] Hotfix PR or issue is linked in the summary or notes
- [ ] Conflicts, if any, were resolved without dropping the hotfix
- [ ] CI passed for the back-merge PR
- [ ] Do **not** enable "delete head branch" and do **not** click **Delete branch** after merge; **`main`** is long-lived

## Notes

<!-- Optional: deployment, risks, screenshots -->
