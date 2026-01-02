# Getting Started with LogiVox

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** and npm 9+
- **PostgreSQL 12+**
- **Git**

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/flowstock/flowstock.git
   cd flowstock
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   **Backend (.env)**
   ```bash
   cp apps/api/.env.example apps/api/.env
   ```
   
   Edit `apps/api/.env` with your configuration:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/flowstock"
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

   **Frontend (.env)**
   ```bash
   cp apps/web/.env.example apps/web/.env
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run migrations
   npm run db:migrate
   
   # Seed with demo data (optional)
   cd packages/database && npm run seed
   ```

5. **Start development servers**
   ```bash
   # Start both frontend and backend
   npm run dev
   ```
   
   Or run them separately:
   ```bash
   # Backend (API server)
   npm run dev:api
   
   # Frontend (React app)
   npm run dev:web
   ```

## Application URLs

- **Web Application**: http://localhost:3000
- **API Server**: http://localhost:5000
- **API Health Check**: http://localhost:5000/health
- **Database Studio**: `npm run db:studio` (opens at http://localhost:5555)

## Demo Credentials

After seeding the database, you can use:
- **Email**: admin@demo.com
- **Password**: (set up authentication system)

## Project Structure

```
flowstock/
├── apps/
│   ├── web/                    # React web application
│   ├── api/                    # Node.js backend API
│   ├── mobile/                 # React Native mobile app (coming soon)
│   └── supplier-portal/        # Supplier-facing portal (coming soon)
├── packages/
│   ├── ui/                     # Shared UI components (coming soon)
│   ├── database/               # Prisma schema and migrations
│   ├── auth/                   # Authentication utilities (coming soon)
│   ├── integrations/           # ERP integration modules (coming soon)
│   └── types/                  # Shared TypeScript types (coming soon)
├── docs/                       # Documentation
└── README.md
```

## Available Scripts

### Root Level
- `npm run dev` - Start both frontend and backend
- `npm run build` - Build all applications
- `npm run test` - Run all tests
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

### Backend (apps/api)
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run API tests
- `npm run lint` - Lint TypeScript code

### Frontend (apps/web)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run frontend tests
- `npm run lint` - Lint React/TypeScript code

## Development Workflow

1. **Feature Development**
   - Create a new branch: `git checkout -b feature/feature-name`
   - Develop your feature
   - Test thoroughly
   - Submit a pull request

2. **Database Changes**
   - Modify `packages/database/prisma/schema.prisma`
   - Generate migration: `npm run db:migrate`
   - Update seed data if needed

3. **API Development**
   - Add routes in `apps/api/src/routes/`
   - Implement controllers and services
   - Add tests
   - Update API documentation

4. **Frontend Development**
   - Add pages in `apps/web/src/pages/`
   - Create reusable components in `apps/web/src/components/`
   - Implement hooks and services
   - Follow design system patterns

## Environment Configuration

### Backend Environment Variables

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/flowstock

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# External Services
STRIPE_SECRET_KEY=sk_test_...
EMAIL_API_KEY=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# ERP Integrations
ORACLE_API_URL=https://your-oracle-instance.oracle.com
SAP_API_URL=https://your-sap-instance.com
NETSUITE_API_URL=https://your-netsuite-instance.com
```

### Frontend Environment Variables

```bash
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Payments
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Change ports in package.json scripts or environment variables
   - Kill existing processes: `pkill -f node`

2. **Database connection issues**
   - Ensure PostgreSQL is running
   - Check DATABASE_URL format
   - Verify database exists

3. **Module not found errors**
   - Run `npm install` in the root directory
   - Check that all workspace dependencies are properly linked

4. **Build failures**
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Check TypeScript errors: `npm run lint`

### Getting Help

- Check the [API Documentation](./docs/api.md)
- Review [Database Schema](./docs/database.md)
- See [Integration Guide](./docs/integrations.md)
- Open an issue on GitHub

## Next Steps

1. **Complete Authentication**: Set up Clerk or custom auth system
2. **Implement Core Features**: Start with inventory management
3. **Add ERP Integrations**: Begin with Oracle REST API
4. **Build Mobile App**: React Native implementation
5. **Deploy to Production**: Set up CI/CD pipeline

## Contributing

Please read our contributing guidelines and code of conduct before making contributions.

## License

This project is licensed under the MIT License - see the LICENSE file for details.