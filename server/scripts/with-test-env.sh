#!/bin/bash
# Test database helper script
# Loads environment from .env.test and runs Prisma commands

set -e

# Load .env.test
if [ -f .env.test ]; then
  export $(grep -v '^#' .env.test | xargs)
else
  echo "Error: .env.test file not found"
  exit 1
fi

# Run the command passed as arguments
exec "$@"
