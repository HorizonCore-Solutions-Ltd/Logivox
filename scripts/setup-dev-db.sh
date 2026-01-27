#!/bin/bash

# =============================================================================
# QUICK DEVELOPMENT DATABASE SETUP
# =============================================================================
# This script sets up the database for local development
# Run this after pulling the repository or changing database schema
# =============================================================================

set -e  # Exit on any error

echo "🚀 Setting up LogiVox Development Database..."
echo "=============================================="

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local file not found"
    echo "Please create .env.local file with your database configuration"
    echo "You can copy from .env.example and modify as needed"
    exit 1
fi

# Source environment variables
source .env.local

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not found in .env.local"
    echo "Please add your database URL to .env.local:"
    echo "DATABASE_URL='postgresql://username:password@localhost:5432/logivox_dev'"
    exit 1
fi

echo "✅ Environment configuration loaded"

# Stop any running dev server to avoid conflicts
echo "🛑 Checking for running processes..."
if pgrep -f "next dev" > /dev/null; then
    echo "⚠️  Next.js dev server is running. Please stop it first:"
    echo "   Press Ctrl+C in the terminal running 'npm run dev'"
    echo "   Or kill the process manually"
    read -p "Press Enter after stopping the dev server to continue..."
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Reset database and apply migrations
echo "🔄 Setting up database schema..."
npx prisma migrate reset --force

# Load seed data
echo "🌱 Loading development seed data..."
npx prisma db seed

echo "✅ Development database setup completed!"
echo ""
echo "You can now start the development server:"
echo "  npm run dev"
echo ""
echo "Database dashboard:"
echo "  npx prisma studio"
echo ""
echo "Database URL: $DATABASE_URL"