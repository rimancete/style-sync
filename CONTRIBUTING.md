# Contributing to StyleSync

Thank you for contributing to StyleSync! This guide will help you understand our development workflow and commit conventions.

## 📋 Table of Contents

- [Commit Workflow](#commit-workflow)
- [Commit Message Format](#commit-message-format)
- [Git Hooks](#git-hooks)
- [Development Guidelines](#development-guidelines)

## 🔄 Commit Workflow

### Committing from Root

All commits should be made from the **root directory** of the repository. Our unified Git hooks will automatically detect which parts of the codebase you're changing and run the appropriate validations.

#### Interactive Commit (Recommended)

When you run `git commit` without a message, you'll be prompted with an interactive wizard that guides you through creating a proper commit:

```bash
# Stage your changes
git add .

# Start interactive commit (no -m flag)
git commit
# You'll be prompted to:
# 1. Select commit type (feat, fix, docs, etc.)
# 2. Choose scope (api, client, ui, etc.)
# 3. Write a short description
# 4. Optionally add body and footer
# 5. Confirm your commit
```

#### Manual Commit

You can also provide the commit message directly:

```bash
git commit -m "type(scope): description"
```

#### Using npm script

Alternatively, use the npm script for interactive commits:

```bash
npm run commit
```

### Smart Detection

The pre-commit hook intelligently detects which parts of the codebase have changed:

- **Client-only changes**: Runs client lint-staged (ESLint + Prettier)
- **Server-only changes**: Runs server lint-staged (ESLint + Prettier)
- **Both client & server**: Runs validations for both
- **Documentation/config only**: Skips code validations

## 📝 Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): subject

[optional body]

[optional footer]
```

### Commit Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or modifying tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes
- `build`: Build system changes
- `revert`: Revert previous commit

### Commit Scopes

#### Server Scopes
- `api` - API endpoints
- `auth` - Authentication & authorization
- `booking` - Booking system
- `branch` - Multi-branch features
- `professional` - Professional system
- `service` - Services
- `user` - User management
- `customer` - Customer system
- `db` - Database related
- `prisma` - Database schema/migrations
- `health` - Health checks

#### Client Scopes
- `client` - General client changes
- `ui` - UI components and styling
- `routing` - Routing and navigation
- `store` - State management
- `i18n` - Internationalization
- `components` - React components

#### Shared Scopes
- `docs` - Documentation
- `config` - Configuration changes
- `deps` - Dependencies
- `ci` - CI/CD
- `build` - Build system
- `test` - Test related
- `core` - Core functionality
- `chore` - General maintenance

### Examples

```bash
# Full-stack feature (affects both client and server)
git commit -m "feat(booking): add appointment confirmation flow"

# Client-specific change
git commit -m "fix(ui): resolve button alignment issue"

# Server-specific change
git commit -m "feat(api): add new booking endpoint"

# Documentation update
git commit -m "docs(docs): update API documentation"

# Dependency update
git commit -m "chore(deps): upgrade React to v19"
```

## 🔧 Git Hooks

### Pre-commit Hook

Automatically runs before each commit:

1. **Detects changed files** in the staging area
2. **Runs appropriate validations**:
   - Client: ESLint + Prettier
   - Server: ESLint + Prettier
3. **Blocks commit** if any validation fails

**Note**: Tests are not run automatically during commit. Run them manually before committing.

### Commit-msg Hook

Validates your commit message format:

1. **Checks conventional commit format**
2. **Validates type and scope** against allowed values
3. **Enforces message length limits**:
   - Header: max 100 characters
   - Body line: max 100 characters
   - Subject: max 72 characters

### Bypassing Hooks (Emergency Only)

If you absolutely need to bypass hooks (not recommended):

```bash
git commit --no-verify -m "emergency fix"
```

**⚠️ Only use this in emergencies!** Your commit may fail CI/CD checks later.

## 💻 Development Guidelines

### Setting Up Your Environment

1. **Install dependencies**:
   ```bash
   npm run install:all
   ```

2. **Set up Git hooks** (automatic on npm install):
   ```bash
   npm run prepare
   ```

3. **Verify hooks are installed**:
   ```bash
   ls -la .husky
   # Should show: pre-commit, commit-msg
   ```

### Running Validations Manually

Before committing, you can run validations manually:

```bash
# Client validations
cd client
npm run lint        # Run ESLint
npm run format      # Run Prettier
npm test           # Run tests

# Server validations
cd server
npm run lint        # Run ESLint
npm run format      # Run Prettier
npm test           # Run tests
```

### Testing Your Changes

Tests are **not** run automatically during commits. Always run tests manually before committing.

1. **Client tests**:
   ```bash
   cd client
   npm test          # Run all tests
   npm run test:ui   # Run with UI
   ```

2. **Server tests**:
   ```bash
   cd server
   npm test                    # Unit + contract tests
   npm run test:unit          # Unit tests only
   npm run test:contract      # Contract tests only
   ```

### Commit Best Practices

1. **Use interactive commits**: Let the wizard guide you (just run `git commit` without `-m`)
2. **Commit early and often**: Small, focused commits are easier to review
3. **Write clear commit messages**: Explain *why*, not just *what*
4. **One concern per commit**: Don't mix unrelated changes
5. **Test before committing**: Make sure tests pass locally
6. **Review staged changes**: Use `git diff --staged` before committing

## 🐛 Troubleshooting

### Hook Fails with "No staged files"

This is expected when no files matching the lint-staged patterns are staged. The commit will still proceed.

### Client Tests Fail

```bash
cd client
npm test
# Fix failing tests before committing
```

### ESLint/Prettier Errors

Most issues can be auto-fixed:

```bash
# Client
cd client
npm run lint:fix
npm run format

# Server
cd server
npm run lint
npm run format
```

### Commit Message Validation Fails

Check your commit message format:
- Must have type and scope: `type(scope): description`
- Type must be from the allowed list
- Scope must be from the allowed list
- Keep subject under 72 characters

### Hooks Not Running

Reinstall hooks:

```bash
rm -rf .husky/_
npm run prepare
```

## 📚 Additional Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Commitlint Documentation](https://commitlint.js.org/)
- [Husky Documentation](https://typicode.github.io/husky/)
- [Project Architecture](./docs/projectArchitecture.md)
- [Backend Setup](./docs/backend/setup.md)
- [Frontend Setup](./docs/frontend/setup.md)

## ❓ Questions?

If you have questions about the contribution process, please:
1. Check this guide first
2. Review existing commits for examples
3. Ask in the team chat or create an issue

---

Thank you for contributing to StyleSync! 🎉
