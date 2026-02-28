#!/bin/sh
set -e

echo "🚀 FlowStock Production Startup"

# Wait for database to be ready
echo "⏳ Waiting for database..."
until node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => { console.log('✅ Database connected'); process.exit(0); }).catch(() => { process.exit(1); });" 2>/dev/null; do
  echo "⏳ Database is unavailable - sleeping"
  sleep 2
done

echo "✅ Database is ready"

# Run migrations (if AUTO_MIGRATE is enabled)
if [ "$AUTO_MIGRATE" = "true" ]; then
  echo "🔄 Running database migrations..."
  npx prisma migrate deploy
  echo "✅ Migrations complete"
fi

# Start the application
echo "🎉 Starting FlowStock..."
exec "$@"
