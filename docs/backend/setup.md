# Backend Setup Documentation

## 🚀 1. Quick Start

### 1.1. Prerequisites

- **Node.js** (v18.x or higher)
- **Docker** and **Docker Compose**
- **Git**
- **npm** (comes with Node.js)

### 1.2. Environment Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd style-sync
   ```

2. **Start the database:**
   ```bash
   docker compose -f docker/docker-compose.yml up -d
   ```

3. **Set up the backend:**
   ```bash
   cd server
   cp env.template .env  # Customize as needed
   npm install
   npm run prisma:migrate  # Run database migrations
   npm run prisma:seed     # Seed development data
   npm run start:dev       # Start development server
   ```

4. **Set up the frontend:** (when implemented)
   ```bash
   cd client
   npm install
   npm start
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
npm run db:reset  # ⚠️ This will delete all data!
```

**View Database:**
```bash
cd server
npm run prisma:studio  # Opens Prisma Studio at http://localhost:5555
```

### 2.2 Server Development

**Available Commands:**
```bash
# Development
npm run start:dev      # Start with hot-reload
npm run start:debug    # Start with debugger

# Building
npm run build          # Build for production
npm run start:prod     # Run production build

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Create and apply migrations
npm run prisma:seed      # Seed development data

# Code Quality
npm run lint           # Run ESLint with auto-fix
npm run format         # Run Prettier formatting
npm run test           # Run tests (unit / contract / integration)
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

# 2. Start development server
cd server
npm run start:dev

# 3. Make changes, test endpoints
# 4. Run tests
npm run test
npm run lint

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
npm run prisma:generate

# Reset and reseed database
npm run db:reset
```

**TypeScript Compilation Errors:**
```bash
# Clean build
rm -rf dist/
npm run build

# Check for linting issues
npm run lint
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

