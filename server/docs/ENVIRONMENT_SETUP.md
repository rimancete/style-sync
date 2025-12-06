# Environment Setup Guide

## Overview

StyleSync uses a three-tier environment approach designed for portfolio projects that demonstrate production-ready security practices while maintaining accessibility for demonstration purposes.

## Environment Tiers

### 🔧 Development (`.env`)

- **Purpose**: Local development
- **Security**: Not committed to git (gitignored)
- **Access**: Individual developer
- **Secrets**: Safe development placeholders only

### 🎭 Staging (`.env.staging`)

- **Purpose**: Demo environment, testing, portfolio showcase
- **Security**: Plain text in git (safe demo values)
- **Access**: Public (portfolio viewers)
- **Secrets**: Non-sensitive staging configurations

### 🔐 Production (`.env.production`)

- **Purpose**: Live deployment with real users
- **Security**: **Encrypted with git-crypt**
- **Access**: Deployment systems only
- **Secrets**: Real production credentials (encrypted)

## Quick Start

### 1. Development Setup

#### Database Setup (Docker)

To run the development database using Docker:

```bash
# Start the database
cd docker
docker compose up -d

# Stop the database
docker compose down
```

> **Note**: Docker Compose automatically uses the project name `stylesync` from the config. Containers will appear in Docker Desktop under the "stylesync" group.

#### Test Database Setup (Automated)

For running contract tests with isolated test data:

```bash
# Option 1: Automated (RECOMMENDED for one-time test runs)
cd server
npm run test:contract:managed
# Automatically: starts test DB → runs tests → stops DB

# Option 2: Manual control (for iterative testing)
npm run db:test:setup    # Start test database (port 5434)
npm run test:contract    # Run tests multiple times
npm run db:test:down     # Stop test database

# Option 3: Reset test database
npm run db:test:reset    # Down → Up → Migrate → Seed
```

**Test Database Features**:

- ✅ Isolated from development data (separate database on port 5434)
- ✅ Automated lifecycle management
- ✅ CI/CD ready

**Available Test Scripts**:

```bash
npm run db:test:up       # Start container + wait for readiness
npm run db:test:migrate  # Sync schema (prisma db push)
npm run db:test:seed     # Seed test data
npm run db:test:setup    # All of the above
npm run db:test:down     # Stop and remove container
npm run db:test:reset    # Full reset cycle
```

#### Server Setup

```bash
# Navigate to server directory
cd server

# Copy template to create your local .env
cp env.template .env

# Customize .env for your local setup (optional)
# Start development
npm run start:dev
```

### 2. Staging Environment

```bash
# Staging config already exists in repo
NODE_ENV=staging npm start

# Or test staging config
npm run env:validate staging
```

### 3. Production Setup

```bash
# One-time git-crypt setup
./server/scripts/setup-git-crypt.sh

# The .env.production file is already encrypted in git
# For deployment, you'll need the decryption key

# To deploy (with production key)
git-crypt unlock /path/to/production.key
NODE_ENV=production npm start
```

## Security Architecture

### 🛡️ What's Protected

- **Production database credentials** (encrypted in git)
- **Production JWT secrets** (encrypted in git)
- **Production API keys** (encrypted in git)
- **Production service credentials** (encrypted in git)

### 🎯 What's Portfolio-Safe

- **Staging configurations** (visible, demonstrates architecture)
- **Development templates** (no real secrets)
- **Environment structure** (shows best practices)
- **Security patterns** (demonstrates knowledge)

## Environment Variables Reference

| Variable          | Development      | Staging                 | Production      |
| ----------------- | ---------------- | ----------------------- | --------------- |
| `NODE_ENV`        | `development`    | `staging`               | `production`    |
| `PORT`            | `3001`           | `3001`                  | `3001`          |
| `DATABASE_URL`    | Local Docker     | Demo DB                 | 🔒 Encrypted    |
| `CLIENT_ORIGIN`   | `localhost:3000` | `staging.stylesync.com` | `stylesync.com` |
| `JWT_SECRET`      | Dev placeholder  | Demo secret             | 🔒 Encrypted    |
| `JWT_EXPIRES_IN`  | `1d`             | `1h`                    | `15m`           |
| `SWAGGER_ENABLED` | `true`           | `true`                  | `false`         |

## Git-Crypt Setup

### Installation

```bash
# macOS
brew install git-crypt

# Ubuntu/Debian
sudo apt-get install git-crypt

# Windows (use WSL or download binary)
```

### Initialize (One-time setup)

```bash
# Run setup script
./server/scripts/setup-git-crypt.sh

# Or manually:
git-crypt init
git add .gitattributes
git commit -m "Configure git-crypt for production secrets"
```

### Key Management

```bash
# Export key for deployment
git-crypt export-key ../stylesync-production.key

# Lock repository (encrypt files)
git-crypt lock

# Unlock for deployment
git-crypt unlock ../stylesync-production.key

# Check encryption status
git-crypt status
```

## Deployment Strategy

### Free Hosting Compatible

This setup works perfectly with:

- **Railway**: Supports environment variables + git integration
- **Render**: Environment variables from dashboard
- **Fly.io**: Secrets management + git deploy
- **Heroku**: Config vars + git deploy

### Cloud Provider Ready

Easy migration to:

- **AWS**: Secrets Manager + ECS/Lambda
- **GCP**: Secret Manager + Cloud Run
- **Azure**: Key Vault + Container Instances

### Deployment Process

1. **Set up git-crypt** in CI/CD environment
2. **Unlock production secrets** during deployment
3. **Set NODE_ENV=production**
4. **Deploy with encrypted secrets**

## Validation & Testing

### Environment Validation

```bash
# Validate current environment
npm run env:validate

# Validate specific environment
npm run env:validate development
npm run env:validate staging
npm run env:validate production

# Check configuration loading
npm run config:show
```

### Security Validation

```bash
# Check git-crypt status
git-crypt status

# Verify file encryption
git show HEAD:server/.env.production  # Should show encrypted content

# Test environment loading
NODE_ENV=staging npm run start:dev
```

## Scripts Reference

### Environment Scripts

```bash
# Setup git-crypt (one-time)
./server/scripts/setup-git-crypt.sh

# Validate environment config
./server/scripts/validate-env.js [environment]

# Package.json scripts
npm run env:validate [env]     # Validate environment
npm run config:show           # Show loaded configuration
npm run start:staging         # Start with staging config
npm run start:prod           # Start with production config
```

## Troubleshooting

### Common Issues

#### "Environment file not found"

```bash
# For development
cp server/env.template server/.env

# For staging
# File already exists in repo

# For production
# File exists but may need decryption
git-crypt unlock /path/to/key
```

#### "Git-crypt not working"

```bash
# Check installation
git-crypt --version

# Check repository status
git-crypt status

# Re-initialize if needed
rm -rf .git-crypt
./server/scripts/setup-git-crypt.sh
```

#### "Configuration validation failed"

```bash
# Run validation with details
npm run env:validate development

# Check specific variables
echo $NODE_ENV
echo $DATABASE_URL
```

## Portfolio Benefits

### 🎯 Demonstrates Knowledge

- **Security best practices**: Production secret encryption
- **Environment management**: Multi-tier configuration
- **DevOps readiness**: Deployment-agnostic approach
- **Enterprise patterns**: Proper secret handling

### 🚀 Deployment Ready

- **Free hosting compatible**: Works with Railway, Render, etc.
- **Cloud provider ready**: Easy migration to AWS/GCP/Azure
- **CI/CD friendly**: Git-based deployment workflow
- **Scalable architecture**: Grows from demo to production

### 📚 Learning Value

- **Git-crypt usage**: Industry-standard secret management
- **Environment patterns**: Real-world configuration management
- **Security mindset**: Production vs. development considerations
- **Deployment strategy**: From development to production

This approach perfectly balances portfolio accessibility with production security standards, demonstrating both technical knowledge and practical deployment experience.
