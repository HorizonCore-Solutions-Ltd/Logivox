# =============================================================================
# LOGIVOX DEPLOYMENT GUIDE
# =============================================================================

## Quick Deployment Options

### Option 1: Vercel (Recommended for MVP)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
vercel

# Set environment variables in Vercel dashboard
# Add your production database URL and secrets
```

### Option 2: Docker Production
```bash
# Build production image
docker build -t logivox-production .

# Run with environment file
docker run -p 3000:3000 --env-file .env.production logivox-production
```

### Option 3: Manual VPS/Server Deployment
```bash
# On your server
git clone <your-repo>
cd logivox
npm install
npm run build

# Setup database
chmod +x scripts/setup-production-db.sh
./scripts/setup-production-db.sh

# Start production server
npm start
```

## Pre-Deployment Checklist

### 1. Environment Configuration ✓
- [ ] Copy `.env.production.example` to `.env.production`
- [ ] Update DATABASE_URL with production database
- [ ] Set NEXTAUTH_SECRET (use: `openssl rand -base64 32`)
- [ ] Configure OAuth providers for production domains
- [ ] Set up SMTP for email notifications
- [ ] Configure file upload storage (S3/local)

### 2. Database Setup ✓
- [ ] Create production database (PostgreSQL recommended)
- [ ] Run database migration: `./scripts/setup-production-db.sh`
- [ ] Verify database connection
- [ ] Set up database backups

### 3. Security Hardening ✓
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS for production domains
- [ ] Set up rate limiting
- [ ] Enable security headers
- [ ] Configure CSP (Content Security Policy)

### 4. Performance Optimization ✓
- [ ] Enable database connection pooling
- [ ] Configure Redis for caching (optional)
- [ ] Set up CDN for static assets
- [ ] Enable gzip compression
- [ ] Configure monitoring (Sentry, DataDog, etc.)

### 5. Production Validation ✓
- [ ] Run smoke tests: `npm run test:e2e`
- [ ] Verify authentication flows
- [ ] Test core warehouse operations
- [ ] Check mobile responsiveness
- [ ] Validate performance metrics

## Monitoring & Maintenance

### Health Check Endpoints
- `/api/health` - Basic application health
- `/api/health/database` - Database connectivity
- `/api/health/detailed` - Comprehensive system status

### Backup Strategy
- Automated daily database backups
- Weekly full system snapshots
- 30-day retention policy
- Off-site backup storage

### Scaling Considerations
- Database read replicas for heavy read workloads
- Horizontal scaling with load balancers
- Redis for session management at scale
- CDN for global asset delivery

## Support & Documentation

### Production URLs
- Application: `https://yourdomain.com`
- Admin Dashboard: `https://yourdomain.com/dashboard`
- API Documentation: `https://yourdomain.com/api/docs`
- Health Status: `https://yourdomain.com/api/health`

### Emergency Contacts
- System Administrator: admin@yourcompany.com
- Database Administrator: dba@yourcompany.com
- On-call Support: +1-xxx-xxx-xxxx

## Rollback Procedure
```bash
# If issues occur during deployment
git checkout <previous-stable-tag>
npm run build
pm2 restart logivox-production

# Restore database if needed
pg_restore --clean --create -d logivox_production backup_file.sql
```