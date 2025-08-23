# StyleSync - Development Setup Guide

This guide will help you set up the StyleSync development environment on your local machine.

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Docker** and **Docker Compose**
- **Git**

## Environment Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd style-sync

# Install root dependencies
npm install

# Install server dependencies
cd server && npm install

# Install client dependencies  
cd ../client && npm install
```

### 2. Environment Configuration

Copy the environment template and configure your settings:

```bash
# Server environment
cp server/env.template server/.env
```

Edit `server/.env` with your configuration:

```env
# Database Configuration
DATABASE_URL="postgresql://stylesync:${DB_PASSWORD}@localhost:5433/stylesync?schema=public"
DB_PASSWORD="your_secure_password_here"

# JWT Configuration  
JWT_SECRET="your_jwt_secret_here"
JWT_EXPIRES_IN="24h"

# Application Settings
NODE_ENV="development"
PORT=3001
```

> ⚠️ **Security Note**: Never commit `.env` files to version control. The `.env.template` file should contain example values only.

## Database Setup

### 1. Start PostgreSQL Database

The project uses Docker for the development database with project-scoped naming to avoid conflicts:

```bash
# Start the database container
docker-compose -p stylesync -f docker/docker-compose.yml up -d

# Verify the container is running
docker-compose -p stylesync -f docker/docker-compose.yml ps
```

### 2. Database Connection Details

The database will be available with the following connection details:

- **Host**: `localhost`
- **Port**: `5433` (external), `5432` (internal)
- **Database**: `stylesync`
- **Username**: `stylesync`
- **Password**: Set in your `.env` file as `DB_PASSWORD`

### 3. Container Information

- **Container Name**: `stylesync-postgres-dev`
- **Network**: `stylesync_stylesync-network`
- **Volume**: `stylesync_postgres_data`
- **Restart Policy**: Manual (won't auto-start with Docker Desktop)

### 4. Database Management Commands

```bash
# Start database
docker-compose -p stylesync -f docker/docker-compose.yml up -d

# Stop database
docker-compose -p stylesync -f docker/docker-compose.yml down

# Reset database (removes all data)
docker-compose -p stylesync -f docker/docker-compose.yml down -v

# View database logs
docker-compose -p stylesync -f docker/docker-compose.yml logs postgres

# Check container health
docker-compose -p stylesync -f docker/docker-compose.yml ps
```

### 5. Connecting to Database

You can connect to the database using any PostgreSQL client:

```bash
# Using psql (if installed locally)
psql -h localhost -p 5433 -U stylesync -d stylesync

# Using Docker exec
docker-compose -p stylesync -f docker/docker-compose.yml exec postgres psql -U stylesync -d stylesync
```

## Development Workflow

### 1. Start Development Environment

```bash
# 1. Start the database
docker-compose -p stylesync -f docker/docker-compose.yml up -d

# 2. Start the backend server (in server/ directory)
cd server
npm run start:dev

# 3. Start the frontend client (in client/ directory)
cd ../client
npm start
```

### 2. Available Services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api (when implemented)
- **Database**: localhost:5433

### 3. Project Structure Benefits

The Docker setup uses project-scoped naming (`-p stylesync`) which provides:

- **Isolation**: Containers and volumes won't conflict with other projects
- **Manual Control**: Database won't auto-start with Docker Desktop
- **Clear Naming**: Easy to identify StyleSync containers among other projects
- **Volume Persistence**: Data persists between container restarts

## Troubleshooting

### Database Connection Issues

If you can't connect to the database:

1. **Check container status**: `docker-compose -p stylesync -f docker/docker-compose.yml ps`
2. **View logs**: `docker-compose -p stylesync -f docker/docker-compose.yml logs postgres`
3. **Verify port availability**: Ensure port 5433 isn't used by another service
4. **Check environment variables**: Verify your `.env` file has correct database credentials

### Port Conflicts

If you encounter port conflicts:

- **5433**: Change the external port in `docker/docker-compose.yml` 
- **3001**: Change `PORT` in `server/.env`
- **3000**: React will automatically use the next available port

### Container Issues

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

## Security Best Practices

1. **Environment Variables**: Always use `.env` files for sensitive configuration
2. **Passwords**: Use strong, unique passwords for all services
3. **Secrets**: Never commit secrets to version control
4. **Database Access**: Limit database access to localhost in development
5. **Updates**: Keep dependencies and Docker images updated

## Next Steps

Once your development environment is running:

1. **Database Schema**: Set up Prisma ORM and run migrations
2. **API Testing**: Use the health endpoints to verify backend connectivity
3. **Frontend Connection**: Configure API endpoints in the React client
4. **Authentication**: Set up JWT authentication flow

For implementation details and development phases, see `server/IMPLEMENTATION_STEPS.md`.

## Getting Help

- Check container logs for database issues
- Verify environment configuration
- Ensure all dependencies are installed
- Review port configurations for conflicts

If you continue experiencing issues, please check the project's issue tracker or contact the development team.
