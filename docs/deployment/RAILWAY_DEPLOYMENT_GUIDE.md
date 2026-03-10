# LogiVox Railway Deployment Guide (Always-On Container)

Because Railway connects directly to your GitHub repository and automatically detects Next.js/Turborepo structures through Nixpacks, getting LogiVox live is extremely fast.

## Step 1: Provision Infrastructure

1. Go to your [Railway Dashboard](https://railway.app/dashboard).
2. Click **New Project** -> **Provision PostgreSQL**. Wait for it to deploy.
3. Click **New** -> **Provision Redis**. Wait for it to deploy.

## Step 2: Deploy the App Code

1. Click **New** -> **GitHub Repo** -> Search for `Logivox` and select it.
2. Railway will instantly detect it as a Node.js project.
3. Click **Add Variables** on the service before it starts building.

## Step 3: Map Environment Variables

To get the frontend and backend to talk to your new Railway PostgreSQL and Redis instances, you need to map them. Go to the "Variables" tab of your LogiVox GitHub Service and add the following:

```env
# Database Connections (Reference Railway's auto-generated Postgres URL)
DATABASE_URL=${{Postgres.DATABASE_URL}}
DIRECT_URL=${{Postgres.DATABASE_URL}}

# Redis
REDIS_URL=${{Redis.REDIS_URL}}
REDIS_PASSWORD=${{Redis.REDIS_PASSWORD}}

# Web/Auth Configuration
NODE_ENV=production
NEXTAUTH_URL=https://<your-railway-app-url>.up.railway.app
NEXTAUTH_SECRET=<generate_a_random_32_char_string>

# Security Secrets
JWT_SECRET=<generate_a_random_32_char_string>
FINANCE_PEPPER=railway-staging-logivox-integrity
```

## Step 4: Configure the Build Command

Because LogiVox is a Monorepo using `turbo`, we need to tell Railway exactly how to build it.

1. Go to **Settings** -> **Build**.
2. **Build Command**: `npm install && npx turbo run build --filter=web`
3. **Start Command**: `npm run start --workspace=apps/web`
4. Make sure the Root Directory is set to `/` (the base of the repo).

## Step 5: Start & Wait

Once you save the variables and the build commands, click **Deploy**.

Railway will automatically run your Prisma Database Migrations (if they are embedded in your start script, or you can run `npx prisma db push` via the Railway Command Palette) and bring up the container cleanly on an Always-On server perfectly suited for low-latency warehouse scanning!
