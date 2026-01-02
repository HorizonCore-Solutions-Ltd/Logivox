# 🚀 LogiVox - Quick Start Guide

Get LogiVox up and running in 5 minutes!

---

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- Git

---

## 1. Clone & Install

```bash
# Clone repository
git clone https://github.com/your-org/logivox.git
cd logivox

# Install dependencies
npm install
```

---

## 2. Environment Setup

```bash
# Copy environment template
cp .env.docker .env.local

# Edit .env.local with your settings
DATABASE_URL="postgresql://logivox:logivox_dev@localhost:5432/logivox"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"
NEXT_PUBLIC_APP_NAME="LogiVox"
```

---

## 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed
```

---

## 4. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 🎉

---

## 5. Try Voice Commands

1. Open http://localhost:3000
2. Click microphone icon (or press Ctrl+M)
3. Say: "Show dashboard"
4. Say: "Recommend vehicle for order 123"
5. Say: "Optimize load for order 456"

---

## Key Features to Explore

### Voice Control
- 30+ voice commands
- Hands-free operations
- Browser-based (no hardware)

### Load Optimization
- 3D bin packing
- Vehicle recommendations
- Utilization reports

### Vehicle Library
- 16+ global vehicle types
- UK, EU, US, Asia coverage
- Custom vehicle support

---

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:generate     # Generate Prisma client
npm run db:push         # Push schema changes
npm run db:migrate      # Run migrations
npm run db:seed         # Seed sample data
npm run db:studio       # Open Prisma Studio

# Testing
npm run test            # Run tests
npm run test:watch      # Watch mode
npm run lint            # Lint code
npm run type-check      # TypeScript check
```

---

## Project Structure

```
logivox/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── (dashboard)/       # Dashboard pages
│   └── ...
├── components/            # React components
├── lib/                   # Utilities & services
│   ├── services/          # Business logic
│   │   └── load-optimization-service.ts
│   ├── vehicle-types.ts   # Vehicle library
│   └── ...
├── prisma/               # Database schema
├── docs/                 # Documentation
└── apps/web/            # Voice control
    └── src/lib/voice-control.ts
```

---

## Voice Commands Reference

### Navigation
- "Show dashboard"
- "Go to inventory"
- "Open orders"

### Orders
- "Show order {number}"
- "List today's orders"
- "Create new order"

### Vehicle & Load Optimization
- "Recommend vehicle for order {number}"
- "What vehicle fits {volume} cubic feet"
- "Optimize load for order {number}"
- "Show UK vehicles"

### Inventory
- "Check stock for {item}"
- "What's in location {location}"
- "Show low stock items"

---

## Troubleshooting

### Voice Not Working
- Check microphone permissions in browser
- Try Chrome/Edge (best support)
- Press Ctrl+M to toggle voice

### Database Connection Error
- Verify DATABASE_URL in .env.local
- Check PostgreSQL is running
- Run: `npm run db:push`

### Build Errors
- Clear .next folder: `rm -rf .next`
- Reinstall: `rm -rf node_modules && npm install`
- Check TypeScript: `npm run type-check`

---

## Next Steps

1. **Explore Features**: Try voice commands and load optimization
2. **Read Docs**: Check `/docs` folder for detailed guides
3. **Customize**: Add your own vehicle types, voice commands
4. **Deploy**: Follow deployment guide for production

---

## Support

- **Docs**: See `/docs` folder
- **Issues**: GitHub Issues
- **Email**: support@logivox.ai
- **Discord**: [Coming soon]

---

**Welcome to LogiVox!** 🎤📦✨

*The world's first voice-native warehouse management system*
