-- Initial database setup for StyleSync
-- This file runs automatically when the PostgreSQL container starts for the first time

-- Ensure the database exists (should already be created by environment variables)
SELECT 'StyleSync database initialization started' as status;

-- Enable UUID extension for better ID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Log successful initialization
SELECT 'StyleSync database initialized successfully' as status;
