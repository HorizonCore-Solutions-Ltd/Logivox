# Quick Start: Database Setup

## Option 1: Using Docker (Recommended for Local Development)

### Prerequisites
- Docker Desktop installed
- No local PostgreSQL running on port 5432

### Steps

1. **Create docker-compose.yml** (already exists in project root)

2. **Start PostgreSQL**
   ```powershell
   docker-compose up -d
   ```

3. **Update .env**
   ```env
   DATABASE_URL="postgresql://flowstock:flowstock_dev@localhost:5432/flowstock?schema=public"
   ```

4. **Run Migration**
   ```powershell
   npx prisma migrate dev --name init
   ```

5. **Seed Database**
   ```powershell
   npx prisma db seed
   ```

6. **View Database**
   ```powershell
   npx prisma studio
   ```

## Option 2: Using Supabase (Recommended for Production)

### Steps

1. **Create Supabase Account**
   - Go to https://supabase.com
   - Sign up (free tier available)

2. **Create New Project**
   - Click "New Project"
   - Name: LogiVox
   - Set strong database password
   - Choose region closest to you
   - Wait for project to be ready (~2 minutes)

3. **Get Database URL**
   - Go to Project Settings → Database
   - Copy "Connection String" under "Connection pooling"
   - It looks like: `postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres`

4. **Update .env**
   ```env
   DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
   ```

5. **Run Migration**
   ```powershell
   npx prisma migrate dev --name init
   ```

6. **Seed Database**
   ```powershell
   npx prisma db seed
   ```

## Option 3: Install PostgreSQL Locally

### Windows

1. **Download PostgreSQL**
   - Visit https://www.postgresql.org/download/windows/
   - Download installer

2. **Install**
   - Run installer
   - Set password for postgres user
   - Use default port 5432
   - Complete installation

3. **Create Database**
   ```powershell
   # Open Command Prompt as Administrator
   psql -U postgres
   ```

   ```sql
   CREATE DATABASE flowstock;
   CREATE USER flowstock WITH ENCRYPTED PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE flowstock TO flowstock;
   \q
   ```

4. **Update .env**
   ```env
   DATABASE_URL="postgresql://flowstock:your_password@localhost:5432/flowstock?schema=public"
   ```

5. **Run Migration**
   ```powershell
   npx prisma migrate dev --name init
   ```

6. **Seed Database**
   ```powershell
   npx prisma db seed
   ```

## Demo Credentials (After Seeding)

Once you've run the seed, you can log in with:

### Super Admin
- **Email:** admin@logivox.ai
- **Password:** Admin@123
- **Role:** SUPER_ADMIN
- **Organization:** Demo Company Ltd (OWNER)

### Manager
- **Email:** manager@demo-company.com
- **Password:** Manager@123
- **Role:** MANAGER
- **Organization:** Demo Company Ltd (MANAGER)

## Verify Setup

1. **Check Prisma Studio**
   ```powershell
   npx prisma studio
   ```
   Opens at http://localhost:5555

2. **Check Tables Created**
   - users (2 records)
   - organizations (1 record)
   - organization_members (2 records)
   - warehouses (1 record)
   - categories (3 records)
   - inventory_items (3 records)
   - suppliers (1 record)
   - customers (1 record)
   - bookings (1 record)
   - booking_items (2 records)
   - inventory_movements (2 records)

## Common Issues

### Port 5432 Already in Use
```powershell
# Check what's using the port
netstat -ano | findstr :5432

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

### Connection Refused
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env is correct
- Verify firewall settings

### Migration Errors
```powershell
# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Then run migration again
npx prisma migrate dev --name init
```

## Next Steps

After database setup:
1. ✅ Database running
2. ✅ Tables created
3. ✅ Demo data seeded
4. ⏳ Start development server: `npm run dev`
5. ⏳ Test authentication at `/sign-in`
6. ⏳ Access dashboard at `/dashboard`

## Useful Commands

```powershell
# Generate Prisma Client
npx prisma generate

# Open Prisma Studio
npx prisma studio

# Create new migration
npx prisma migrate dev --name <migration_name>

# Reset database
npx prisma migrate reset

# Deploy migrations (production)
npx prisma migrate deploy

# Seed database
npx prisma db seed

# Format schema file
npx prisma format
```
