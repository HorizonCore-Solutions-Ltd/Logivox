# Database Setup Guide

## Overview

LogiVox uses **PostgreSQL** with **Prisma ORM** for database management. This guide will help you set up your database locally or in production.

## Prerequisites

- PostgreSQL 14+ installed locally OR
- Access to a cloud PostgreSQL provider (Supabase, Railway, Neon, etc.)

## Local Setup (Option 1: Docker)

### 1. Using Docker Compose

Create `docker-compose.yml` in the project root:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    container_name: logivox-db
    environment:
      POSTGRES_USER: flowstock
      POSTGRES_PASSWORD: flowstock_dev_password
      POSTGRES_DB: flowstock
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 2. Start Database

```bash
docker-compose up -d
```

### 3. Update `.env`

```env
DATABASE_URL="postgresql://flowstock:flowstock_dev_password@localhost:5432/flowstock?schema=public"
```

## Local Setup (Option 2: Native PostgreSQL)

### 1. Install PostgreSQL

**Windows:**
- Download from https://www.postgresql.org/download/windows/
- Run installer and set a password for postgres user

**macOS:**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Linux:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

### 2. Create Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE flowstock;
CREATE USER flowstock WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE flowstock TO flowstock;

# Exit
\q
```

### 3. Update `.env`

```env
DATABASE_URL="postgresql://flowstock:your_password@localhost:5432/flowstock?schema=public"
```

## Cloud Setup (Option 3: Supabase - Recommended)

### 1. Create Supabase Project

1. Go to https://supabase.com
2. Sign up/Sign in
3. Click "New Project"
4. Fill in details:
   - Name: LogiVox
   - Database Password: (generate strong password)
   - Region: (choose closest to you)

### 2. Get Connection String

1. Go to Project Settings → Database
2. Copy the "Connection string" under "Connection pooling"
3. Replace `[YOUR-PASSWORD]` with your database password

### 3. Update `.env`

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true"
```

## Database Migration

### 1. Generate Prisma Client

```bash
npx prisma generate
```

### 2. Create Initial Migration

```bash
npx prisma migrate dev --name init
```

This will:
- Create all database tables
- Generate type-safe Prisma Client
- Apply the migration to your database

### 3. Verify Schema

```bash
npx prisma studio
```

This opens a GUI to view and edit your database.

## Database Schema Overview

### Authentication
- `users` - User accounts
- `accounts` - OAuth provider accounts
- `sessions` - Active user sessions
- `verification_tokens` - Email verification tokens

### Multi-Tenancy
- `organizations` - Tenant organizations
- `organization_members` - User-organization relationships

### Inventory
- `warehouses` - Storage locations
- `categories` - Product categories
- `inventory_items` - Stock items
- `inventory_movements` - Stock movement history

### Booking
- `bookings` - Stock reservations
- `booking_items` - Line items for bookings

### Business Entities
- `suppliers` - Vendor information
- `customers` - Customer information

### Integrations
- `integrations` - External system connections
- `api_keys` - API access keys

### Audit
- `activity_logs` - Complete audit trail

## Common Commands

### View Database

```bash
npx prisma studio
```

### Reset Database (⚠️ Deletes all data)

```bash
npx prisma migrate reset
```

### Apply Pending Migrations

```bash
npx prisma migrate deploy
```

### Generate Client After Schema Changes

```bash
npx prisma generate
```

### Format Schema File

```bash
npx prisma format
```

## Seeding the Database

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@logivox.ai' },
    update: {},
    create: {
      email: 'admin@logivox.ai',
      name: 'Admin User',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      emailVerified: new Date(),
    },
  })

  // Create demo organization
  const org = await prisma.organization.create({
    data: {
      name: 'Demo Company',
      slug: 'demo-company',
      subscriptionTier: 'PROFESSIONAL',
      createdById: admin.id,
      members: {
        create: {
          userId: admin.id,
          role: 'OWNER',
        },
      },
    },
  })

  console.log({ admin, org })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

Add to `package.json`:

```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

Run seed:

```bash
npx prisma db seed
```

## Troubleshooting

### Connection Refused

- Check PostgreSQL is running: `pg_isready`
- Verify port 5432 is available
- Check firewall settings

### Authentication Failed

- Verify username/password in `.env`
- Check database user permissions

### Migration Errors

- Try: `npx prisma migrate reset`
- Check for schema syntax errors
- Ensure database is accessible

## Production Considerations

1. **Never commit `.env`** - Use environment variables
2. **Use connection pooling** - Enable in production
3. **Backup regularly** - Set up automated backups
4. **Monitor performance** - Use Prisma's query metrics
5. **Use migrations** - Never modify production schema directly

## Next Steps

1. ✅ Set up database
2. ✅ Run migrations
3. ✅ Seed demo data
4. ⏳ Configure NextAuth.js
5. ⏳ Test authentication flow
6. ⏳ Build CRUD operations

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [NextAuth.js with Prisma](https://next-auth.js.org/adapters/prisma)
