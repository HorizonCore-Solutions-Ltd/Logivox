# FlowStock Database Setup Script
# This script helps you set up the database for FlowStock

Write-Host "🚀 FlowStock Database Setup" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan

# Function to check if Docker is running
function Test-DockerRunning {
    try {
        docker info > $null 2>&1
        return $true
    } catch {
        return $false
    }
}

# Function to check if PostgreSQL is installed
function Test-PostgreSQLInstalled {
    try {
        psql --version > $null 2>&1
        return $true
    } catch {
        return $false
    }
}

Write-Host "`nChoose your database setup option:" -ForegroundColor Yellow
Write-Host "1. Docker (Recommended - Easy setup)" -ForegroundColor Green
Write-Host "2. Supabase (Recommended - Cloud hosted)" -ForegroundColor Green
Write-Host "3. Local PostgreSQL (Manual setup required)" -ForegroundColor Yellow
Write-Host "4. Exit" -ForegroundColor Red

$choice = Read-Host "`nEnter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host "`n📦 Setting up Docker PostgreSQL..." -ForegroundColor Cyan
        
        if (-not (Test-DockerRunning)) {
            Write-Host "❌ Docker is not running!" -ForegroundColor Red
            Write-Host "Please start Docker Desktop and run this script again." -ForegroundColor Yellow
            exit 1
        }

        Write-Host "✅ Docker is running" -ForegroundColor Green
        
        # Copy .env.docker to .env
        Write-Host "📝 Updating .env file..." -ForegroundColor Cyan
        Copy-Item .env.docker .env -Force
        Write-Host "✅ .env file updated" -ForegroundColor Green

        # Start Docker containers
        Write-Host "🐘 Starting PostgreSQL container..." -ForegroundColor Cyan
        docker-compose up -d postgres

        # Wait for PostgreSQL to be ready
        Write-Host "⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5

        # Generate Prisma Client
        Write-Host "🔧 Generating Prisma Client..." -ForegroundColor Cyan
        npx prisma generate

        # Run migrations
        Write-Host "📊 Running database migrations..." -ForegroundColor Cyan
        npx prisma migrate dev --name init

        # Seed database
        Write-Host "🌱 Seeding database with demo data..." -ForegroundColor Cyan
        npx prisma db seed

        Write-Host "`n✅ Database setup complete!" -ForegroundColor Green
        Write-Host "`n📝 Demo Credentials:" -ForegroundColor Yellow
        Write-Host "Super Admin:" -ForegroundColor Cyan
        Write-Host "  Email: admin@flowstock.com"
        Write-Host "  Password: Admin@123"
        Write-Host "`nManager:" -ForegroundColor Cyan
        Write-Host "  Email: manager@demo-company.com"
        Write-Host "  Password: Manager@123"

        Write-Host "`n🎯 Next Steps:" -ForegroundColor Yellow
        Write-Host "1. Run: npm run dev" -ForegroundColor Green
        Write-Host "2. Open: http://localhost:3000" -ForegroundColor Green
        Write-Host "3. View Database: npx prisma studio" -ForegroundColor Green
        Write-Host "4. Access pgAdmin: http://localhost:5050" -ForegroundColor Green
        Write-Host "   (Email: admin@flowstock.com, Password: admin)" -ForegroundColor Gray
    }

    "2" {
        Write-Host "`n☁️ Setting up Supabase..." -ForegroundColor Cyan
        Write-Host "`nPlease follow these steps:" -ForegroundColor Yellow
        Write-Host "1. Go to https://supabase.com and sign up/sign in"
        Write-Host "2. Click 'New Project'"
        Write-Host "3. Fill in project details:"
        Write-Host "   - Name: FlowStock"
        Write-Host "   - Database Password: (choose a strong password)"
        Write-Host "   - Region: (choose closest to you)"
        Write-Host "4. Wait for project to be ready (~2 minutes)"
        Write-Host "5. Go to Project Settings → Database"
        Write-Host "6. Copy 'Connection String' under 'Connection pooling'"
        Write-Host ""

        $supabaseUrl = Read-Host "Paste your Supabase DATABASE_URL"

        if ($supabaseUrl) {
            # Update .env file
            $envContent = Get-Content .env.example
            $envContent = $envContent -replace 'DATABASE_URL=".*"', "DATABASE_URL=`"$supabaseUrl`""
            $envContent | Set-Content .env

            Write-Host "✅ .env file updated" -ForegroundColor Green

            # Generate Prisma Client
            Write-Host "🔧 Generating Prisma Client..." -ForegroundColor Cyan
            npx prisma generate

            # Run migrations
            Write-Host "📊 Running database migrations..." -ForegroundColor Cyan
            npx prisma migrate dev --name init

            # Seed database
            Write-Host "🌱 Seeding database with demo data..." -ForegroundColor Cyan
            npx prisma db seed

            Write-Host "`n✅ Database setup complete!" -ForegroundColor Green
            Write-Host "`n🎯 Next Steps:" -ForegroundColor Yellow
            Write-Host "1. Run: npm run dev" -ForegroundColor Green
            Write-Host "2. Open: http://localhost:3000" -ForegroundColor Green
            Write-Host "3. View Database: npx prisma studio" -ForegroundColor Green
        } else {
            Write-Host "❌ No URL provided. Setup cancelled." -ForegroundColor Red
        }
    }

    "3" {
        Write-Host "`n🐘 Local PostgreSQL Setup" -ForegroundColor Cyan
        Write-Host "`nPlease ensure PostgreSQL is installed and running." -ForegroundColor Yellow
        
        if (Test-PostgreSQLInstalled) {
            Write-Host "✅ PostgreSQL is installed" -ForegroundColor Green
        } else {
            Write-Host "❌ PostgreSQL is not installed!" -ForegroundColor Red
            Write-Host "Download from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
            exit 1
        }

        Write-Host "`nPlease create a database manually:" -ForegroundColor Yellow
        Write-Host "1. Open Command Prompt as Administrator"
        Write-Host "2. Run: psql -U postgres"
        Write-Host "3. Execute:"
        Write-Host "   CREATE DATABASE flowstock;" -ForegroundColor Cyan
        Write-Host "   CREATE USER flowstock WITH ENCRYPTED PASSWORD 'your_password';" -ForegroundColor Cyan
        Write-Host "   GRANT ALL PRIVILEGES ON DATABASE flowstock TO flowstock;" -ForegroundColor Cyan
        Write-Host "   \q" -ForegroundColor Cyan

        $confirm = Read-Host "`nHave you created the database? (y/n)"
        
        if ($confirm -eq "y") {
            $dbPassword = Read-Host "Enter the password you set for flowstock user"
            
            # Update .env
            $envContent = Get-Content .env.example
            $envContent = $envContent -replace 'DATABASE_URL=".*"', "DATABASE_URL=`"postgresql://flowstock:$dbPassword@localhost:5432/flowstock?schema=public`""
            $envContent | Set-Content .env

            Write-Host "✅ .env file updated" -ForegroundColor Green

            # Generate Prisma Client
            Write-Host "🔧 Generating Prisma Client..." -ForegroundColor Cyan
            npx prisma generate

            # Run migrations
            Write-Host "📊 Running database migrations..." -ForegroundColor Cyan
            npx prisma migrate dev --name init

            # Seed database
            Write-Host "🌱 Seeding database with demo data..." -ForegroundColor Cyan
            npx prisma db seed

            Write-Host "`n✅ Database setup complete!" -ForegroundColor Green
        } else {
            Write-Host "❌ Setup cancelled." -ForegroundColor Red
        }
    }

    "4" {
        Write-Host "`n👋 Exiting..." -ForegroundColor Yellow
        exit 0
    }

    default {
        Write-Host "`n❌ Invalid choice. Exiting..." -ForegroundColor Red
        exit 1
    }
}
