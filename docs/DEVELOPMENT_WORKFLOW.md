# StyleSync Development Workflow

## Overview

This document outlines the development workflow for the StyleSync barbershop booking system, including environment setup, development practices, testing procedures, and deployment guidelines.

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18.x or higher)
- **Docker** and **Docker Compose**
- **Git**
- **npm** (comes with Node.js)

### Environment Setup

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

## 🛠️ Development Environment

### Database Management

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

### Server Development

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
npm run test           # Run unit tests
npm run test:e2e       # Run end-to-end tests
npm run test:watch     # Run tests in watch mode
```

### Environment Configuration

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

## 📚 API Development

### Swagger Documentation

- **Local**: http://localhost:3001/api/docs
- **JSON Schema**: http://localhost:3001/api-json

### Postman Collection

Import the collection from `docs/postman-collection.json`:

1. Open Postman
2. Import → Upload Files → Select `postman-collection.json`
3. Set environment variables:
   - `baseUrl`: `http://localhost:3001/api`
   - `authToken`: (will be auto-filled after login)

### Testing Endpoints

**Health Checks:**
```bash
# Basic health
curl http://localhost:3001/api/health

# Database health
curl http://localhost:3001/api/health/database

# Detailed health
curl http://localhost:3001/api/health/detailed
```

## 🔄 Development Workflow

### 1. Feature Development

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

### 2. Database Schema Changes

```bash
# 1. Modify schema in prisma/schema.prisma
# 2. Create migration
npm run prisma:migrate

# 3. Update seed data if needed
# Edit prisma/seed.ts
npm run prisma:seed

# 4. Test changes
npm run start:dev
```

### 3. Adding New Endpoints

**Directory Structure:**
```
src/
├── module-name/
│   ├── dto/
│   │   ├── create-entity.dto.ts
│   │   ├── update-entity.dto.ts
│   │   └── query-entity.dto.ts
│   ├── entities/
│   │   └── entity.entity.ts
│   ├── module-name.controller.ts
│   ├── module-name.service.ts
│   ├── module-name.module.ts
│   └── tests/
│       ├── module-name.controller.spec.ts
│       └── module-name.service.spec.ts
```

**Implementation Checklist:**
- [ ] Create DTOs with validation decorators
- [ ] Add Swagger documentation (`@ApiOperation`, `@ApiResponse`)
- [ ] Implement service logic
- [ ] Add controller endpoints
- [ ] Write unit tests
- [ ] Add integration tests
- [ ] Update Postman collection
- [ ] Update API documentation

### 4. Code Quality Standards

**ESLint Rules:**
- TypeScript strict mode enabled
- No `any` types (use proper typing)
- Consistent naming conventions
- Import organization

**Prettier Configuration:**
- 2-space indentation
- Single quotes
- Trailing commas
- 80-character line width

**Commit Message Format:**
```
type(scope): description

feat(auth): add JWT authentication
fix(booking): resolve availability calculation bug
docs(api): update endpoint documentation
refactor(health): improve error handling
test(users): add integration tests
```

## 🧪 Testing Strategy

### Test Types

**Unit Tests:**
```bash
npm run test            # Run all tests
npm run test:watch      # Watch mode
npm run test:cov        # Coverage report
```

**Integration Tests:**
```bash
npm run test:e2e        # End-to-end tests
```

**Manual Testing:**
- Use Postman collection
- Test health endpoints
- Verify database operations
- Check Swagger documentation

### Test Data

**Development Users:**
```javascript
// Available test accounts (password: 123456)
{
  admin: 'admin@stylesync.com',
  client: 'client@test.com', 
  staff: 'staff@stylesync.com'
}
```

**Sample Data:**
- 2 Branches (Unidade 1, Unidade 2)
- 4 Services with location-based pricing
- 4 Professionals across branches
- Sample bookings for testing

## 🔧 Troubleshooting

### Common Issues

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

### Development Tips

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

## 📦 Production Deployment

### Build Process

```bash
# 1. Build application
npm run build

# 2. Set production environment variables
export NODE_ENV=production
export DATABASE_URL="postgresql://..."
export JWT_SECRET="secure-production-secret"

# 3. Run migrations
npm run prisma:migrate

# 4. Start production server
npm run start:prod
```

### Environment Variables (Production)

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://...
JWT_SECRET=<strong-secret-key>
JWT_REFRESH_SECRET=<strong-refresh-key>
SWAGGER_ENABLED=false
```

### Health Check Endpoints

Monitor these endpoints for production health:

- `GET /api/health` - Basic application health
- `GET /api/health/database` - Database connectivity
- `GET /api/health/detailed` - Comprehensive diagnostics

## 🎯 Next Steps

### Phase 1 Completion Checklist
- [x] Database schema implemented
- [x] Health endpoints working
- [x] Swagger documentation setup
- [x] Development environment configured
- [ ] Authentication module
- [ ] Branch management
- [ ] Professional management
- [ ] Service catalog
- [ ] Booking system

### Upcoming Features
- User authentication (JWT)
- Branch CRUD operations
- Professional management
- Service catalog with pricing
- Booking availability logic
- Appointment management

## 📞 Support

For development questions or issues:

1. Check this documentation first
2. Review API documentation at `/api/docs`
3. Test with Postman collection
4. Check server logs for errors
5. Verify database state with Prisma Studio

---

**Happy Coding! 🚀**

