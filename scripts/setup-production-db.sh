#!/bin/bash

# =============================================================================
# PRODUCTION DATABASE SETUP SCRIPT
# =============================================================================
# This script prepares the database for production deployment
# Run this on your production server or database instance
# =============================================================================

set -e  # Exit on any error

echo "🚀 Starting LogiVox Production Database Setup..."
echo "=============================================="

# Check if environment variables are set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "Please set your production database URL:"
    echo "export DATABASE_URL='postgresql://username:password@host:port/database'"
    exit 1
fi

echo "✅ Environment variables validated"

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Check if seed data should be loaded
if [ "$LOAD_SEED_DATA" = "true" ]; then
    echo "🌱 Loading seed data..."
    npx prisma db seed
else
    echo "⏭️  Skipping seed data (set LOAD_SEED_DATA=true to load)"
fi

# Create database indexes for production performance
echo "⚡ Creating performance indexes..."
npx prisma db execute --file prisma/indexes-schema.txt || echo "⚠️  Custom indexes file not found, skipping..."

# Validate database schema
echo "🔍 Validating database schema..."
npx prisma validate

echo "✅ Database setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Verify database connection"
echo "2. Run application smoke tests"
echo "3. Monitor application logs"
echo "4. Set up database backups"
echo ""
echo "Database URL: $DATABASE_URL"
echo "Timestamp: $(date)"