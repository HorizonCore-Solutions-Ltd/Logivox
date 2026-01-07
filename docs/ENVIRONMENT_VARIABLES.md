# LogiVox Environment Variables Guide

## Overview

This document outlines all environment variables used across the LogiVox platform for development, staging, and production environments.

## Backend API Environment Variables

### Required Variables

#### Database Configuration

```bash
# PostgreSQL connection string
DATABASE_URL="postgresql://username:password@localhost:5432/flowstock"

# Database pool settings (optional)
DATABASE_POOL_SIZE=10
DATABASE_TIMEOUT=60000
```

#### Authentication & Security

```bash
# JWT secret for token signing (generate with: openssl rand -base64 32)
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# JWT token expiration time
JWT_EXPIRES_IN="7d"

# Bcrypt salt rounds for password hashing
BCRYPT_SALT_ROUNDS=12

# CORS origins (comma-separated)
CORS_ORIGINS="http://localhost:5173,https://app.logivox.ai"
```

#### Server Configuration

```bash
# Server port
PORT=5000

# Node environment
NODE_ENV="development" # development | staging | production

# API base path
API_BASE_PATH="/api"
```

#### Email Configuration

```bash
# SMTP settings for transactional emails
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
EMAIL_FROM="noreply@logivox.ai"
```

#### File Storage (AWS S3)

```bash
# AWS credentials
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="logivox-uploads"

# S3 configuration
S3_PUBLIC_URL="https://logivox-uploads.s3.amazonaws.com"
S3_UPLOAD_LIMIT="10MB"
```

#### External Integrations

```bash
# Stripe for subscription billing
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"

# Clerk for authentication (if using)
CLERK_SECRET_KEY="sk_test_your-clerk-secret-key"

# Sentry for error tracking
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"
```

#### Redis (Optional - for caching and sessions)

```bash
# Redis connection
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD="your-redis-password"
```

### Optional Variables

#### Rate Limiting

```bash
# API rate limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

#### Logging

```bash
# Log level
LOG_LEVEL="debug" # error | warn | info | debug

# Log format
LOG_FORMAT="combined" # combined | common | dev
```

#### WebSocket Configuration

```bash
# Socket.io settings
SOCKET_CORS_ORIGINS="http://localhost:5173"
SOCKET_MAX_CONNECTIONS=1000
```

## Frontend Web Environment Variables

### Required Variables

#### API Configuration

```bash
# Backend API URL
VITE_API_URL="http://localhost:5000/api"

# WebSocket URL
VITE_WEBSOCKET_URL="http://localhost:5000"
```

#### Authentication

```bash
# Clerk publishable key (if using Clerk)
VITE_CLERK_PUBLISHABLE_KEY="pk_test_your-clerk-publishable-key"
```

#### Payment Integration

```bash
# Stripe publishable key
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-publishable-key"
```

### Optional Variables

#### Analytics & Monitoring

```bash
# Google Analytics
VITE_GA_MEASUREMENT_ID="G-XXXXXXXXXX"

# Sentry DSN for frontend error tracking
VITE_SENTRY_DSN="https://your-frontend-sentry-dsn@sentry.io/project-id"
```

#### Feature Flags

```bash
# Feature toggles
VITE_ENABLE_BARCODE_SCANNING="true"
VITE_ENABLE_OFFLINE_MODE="true"
VITE_ENABLE_PWA="true"
```

#### Development Tools

```bash
# Development mode settings
VITE_DEV_TOOLS="true"
VITE_DEBUG_MODE="false"
```

## Database Package Environment Variables

### Required Variables

```bash
# Same DATABASE_URL as backend
DATABASE_URL="postgresql://username:password@localhost:5432/flowstock"
```

### Migration Variables

```bash
# Migration settings
MIGRATE_DEPLOY_TIMEOUT=300000
SHADOW_DATABASE_URL="postgresql://username:password@localhost:5432/flowstock_shadow"
```

## Environment-Specific Configurations

### Development Environment

```bash
# Relaxed security for local development
NODE_ENV="development"
JWT_SECRET="dev-secret-key-not-for-production"
CORS_ORIGINS="http://localhost:5173,http://localhost:3000"
LOG_LEVEL="debug"
BCRYPT_SALT_ROUNDS=4  # Faster for development
```

### Staging Environment

```bash
# Production-like settings with test data
NODE_ENV="staging"
JWT_SECRET="staging-secret-key-different-from-prod"
CORS_ORIGINS="https://staging.logivox.ai"
LOG_LEVEL="info"
BCRYPT_SALT_ROUNDS=12
```

### Production Environment

```bash
# Secure production settings
NODE_ENV="production"
JWT_SECRET="super-secure-production-secret-key"
CORS_ORIGINS="https://app.logivox.ai"
LOG_LEVEL="error"
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_MAX_REQUESTS=50  # Stricter rate limiting
```

## Security Best Practices

### Environment Variable Security

1. **Never commit .env files to version control**
2. **Use different secrets for each environment**
3. **Generate strong, random secrets**
4. **Rotate secrets regularly**
5. **Use environment-specific service accounts**

### Secret Generation Commands

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate random password
openssl rand -base64 24

# Generate UUID
uuidgen
```

### Deployment Considerations

1. **Use secret management services in production**
2. **Set environment variables at deployment time**
3. **Validate required environment variables on startup**
4. **Log missing environment variables (not their values)**

## Environment Variable Validation

### Backend Validation (src/config/env.ts)

```typescript
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "staging", "production"]),
  PORT: z.string().transform(Number).pipe(z.number().min(1)),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  // ... other validations
});

export const env = envSchema.parse(process.env);
```

### Frontend Validation (src/config/env.ts)

```typescript
const envSchema = z.object({
  VITE_API_URL: z.string().url(),
  VITE_STRIPE_PUBLISHABLE_KEY: z.string().startsWith("pk_"),
  // ... other validations
});

export const env = envSchema.parse(import.meta.env);
```

## Troubleshooting

### Common Issues

1. **Database connection fails**: Check DATABASE_URL format and credentials
2. **CORS errors**: Verify CORS_ORIGINS includes your frontend URL
3. **JWT errors**: Ensure JWT_SECRET is consistent across services
4. **File upload fails**: Check AWS credentials and S3 bucket permissions

### Debug Commands

```bash
# Test database connection
npx prisma db pull

# Validate environment variables
npm run validate-env

# Check API health
curl http://localhost:5000/api/health
```

## Example .env Files

### apps/api/.env.example

```bash
# Database
DATABASE_URL="postgresql://flowstock_user:password@localhost:5432/flowstock"

# Authentication
JWT_SECRET="development-secret-change-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV="development"
CORS_ORIGINS="http://localhost:5173"

# Email
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
EMAIL_FROM="noreply@logivox.ai"

# AWS S3
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="logivox-uploads"

# Stripe
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"
```

### apps/web/.env.example

```bash
# API Configuration
VITE_API_URL="http://localhost:5000/api"
VITE_WEBSOCKET_URL="http://localhost:5000"

# Authentication
VITE_CLERK_PUBLISHABLE_KEY="pk_test_your-clerk-publishable-key"

# Payments
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-publishable-key"

# Analytics
VITE_GA_MEASUREMENT_ID="G-XXXXXXXXXX"

# Feature Flags
VITE_ENABLE_BARCODE_SCANNING="true"
VITE_ENABLE_OFFLINE_MODE="true"
```

Remember: Always use .env.example files as templates and create your own .env files with actual values for local development.
