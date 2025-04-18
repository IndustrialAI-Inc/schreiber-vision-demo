#!/bin/sh
echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h postgres -p 5432 -U postgres; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

echo "PostgreSQL is up - executing migrations"

# Run database migrations
for migration in ./lib/db/migrations/*.sql; do
  echo "Applying migration: $migration"
  PGPASSWORD=postgres psql -h postgres -p 5432 -U postgres -d schreiber -f "$migration"
done

echo "Starting Next.js application in development mode"
pnpm dev
