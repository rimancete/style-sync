# Backend Setup Documentation

## 🚀 1. Quick Start

### 1.1. Prerequisites

- **Node.js** >= 24.13.0 (see `.nvmrc` at project root)
- **pnpm** >= 9.x (`npm install -g pnpm`)
- **Docker** and **Docker Compose**
- **Git**

### 1.2. Environment Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd style-sync
   ```

2. **Install Node.js version:**
   ```bash
   nvm install  # Installs version from .nvmrc
   nvm use      # Activates the correct version
   ```

3. **Install dependencies (from project root):**
   ```bash
   pnpm install  # Installs all workspace dependencies
   ```

4. **Start the database:**
   ```bash
   docker compose -f docker/docker-compose.yml up -d
   ```

5. **Set up the backend:**
   ```bash
   cd server
   cp env.template .env        # Customize as needed
   pnpm prisma:generate        # Generate Prisma Client
   pnpm prisma:migrate         # Run database migrations
   pnpm prisma:seed            # Seed development data
   pnpm start:dev              # Start development server
   ```
   
   Or from project root:
   ```bash
   pnpm dev:server             # Start server from root
   ```

6. **Set up the frontend:**
   ```bash
   cd client
   pnpm dev                    # Start client dev server
   ```
   
   Or from project root:
   ```bash
   pnpm dev:client             # Start client from root
   pnpm dev                    # Start both client & server in parallel
   ```

## 🛠️ 2. Development Environment

### 2.1 Database Management

**Start Database:**
```bash
docker compose -f docker/docker-compose.yml up -d
```

**Stop Database:**
```bash
docker compose -f docker/docker-compose.yml down
```

**Reset Database:**
```bash
cd server
pnpm db:reset  # ⚠️ This will delete all data!
```

**View Database:**
```bash
cd server
pnpm prisma:studio  # Opens Prisma Studio at http://localhost:5555
```

### 2.2 Server Development

**Available Commands:**
```bash
# Development (from server directory)
pnpm start:dev      # Start with hot-reload
pnpm start:debug    # Start with debugger

# Or from project root
pnpm dev:server     # Start server
pnpm dev            # Start both client & server

# Building
pnpm build          # Build for production (from server dir)
pnpm build:server   # Build server (from root)
pnpm start:prod     # Run production build

# Database
pnpm prisma:generate  # Generate Prisma client
pnpm prisma:migrate   # Create and apply migrations
pnpm prisma:seed      # Seed development data

# Code Quality
pnpm lint           # Run ESLint with auto-fix (from server dir)
pnpm lint:fix       # Run linting across all workspaces (from root)
pnpm format         # Run Prettier formatting
pnpm test           # Run tests (unit / contract / integration)
```

### 2.3 Environment Configuration

Create `.env` file in `server/` directory:
```env
# Database
DATABASE_URL="postgresql://stylesync:5&cT_5;j!c@localhost:5433/stylesync"

# Application
NODE_ENV=development
PORT=3001
CLIENT_ORIGIN=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=7d

# Health Check
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_DATABASE_TIMEOUT=5000

# API Documentation
SWAGGER_ENABLED=true
SWAGGER_TITLE="StyleSync API"
SWAGGER_DESCRIPTION="Multi-location barbershop booking system API"
SWAGGER_VERSION="1.0"
```

## 🔄 3. Development Workflow

### 3.1. Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/user-authentication

# 2. Start development server (from project root)
pnpm dev:server
# Or from server directory: cd server && pnpm start:dev

# 3. Make changes, test endpoints
# 4. Run tests
cd server
pnpm test
pnpm lint

# 5. Commit and push
git add .
git commit -m "feat: implement user authentication endpoints"
git push origin feature/user-authentication

# 6. Create pull request
```

### 3.2. Available Services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api (when implemented)
- **Database**: localhost:5433

### 3.3 Project Structure Benefits

The Docker setup uses project-scoped naming (`-p stylesync`) which provides:

- **Isolation**: Containers and volumes won't conflict with other projects
- **Manual Control**: Database won't auto-start with Docker Desktop
- **Clear Naming**: Easy to identify StyleSync containers among other projects
- **Volume Persistence**: Data persists between container restarts

## 🔧 4. Troubleshooting

### 4.1 Common Issues

**Database Connection Failed:**
```bash
# Check if Docker container is running
docker ps | grep postgres

# Restart database
docker compose -f docker/docker-compose.yml restart

# Check logs
docker logs stylesync-postgres-dev
```

**Port Already in Use:**
```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or use a different port in .env
PORT=3002
```

**Prisma Client Out of Sync:**
```bash
# Regenerate client
cd server
pnpm prisma:generate

# Reset and reseed database
pnpm db:reset
```

**TypeScript Compilation Errors:**
```bash
# Clean build
cd server
rm -rf dist/
pnpm build

# Check for linting issues
pnpm lint
```

### 4.2 Port Conflicts

If you encounter port conflicts:

- **5433**: Change the external port in `docker/docker-compose.yml` 
- **3001**: Change `PORT` in `server/.env`
- **3000**: React will automatically use the next available port

### 4.3 Container Issues

To completely reset the Docker environment:

```bash
# Stop all containers
docker-compose -p stylesync -f docker/docker-compose.yml down -v

# Clean up unused containers and networks
docker container prune -f
docker network prune -f
docker volume prune -f

# Restart fresh
docker-compose -p stylesync -f docker/docker-compose.yml up -d
```


### 4.4 Development Tips

**Hot Reload Not Working:**
- Restart development server
- Check file watchers limit (Linux): `echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf`

**Slow Database Queries:**
- Enable Prisma query logging (already configured)
- Use Prisma Studio to inspect data
- Check database indexes

**API Documentation Issues:**
- Restart server if Swagger UI doesn't update
- Clear browser cache
- Check Swagger decorators in controllers

