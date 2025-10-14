# 🔐 Authentication System - Complete Implementation Guide

## Overview

FlowStock now has a **fully functional authentication system** powered by NextAuth.js v5 with PostgreSQL database integration via Prisma. Users can sign up, sign in, and access protected routes with role-based access control.

---

## ✅ What's Implemented

### 1. **NextAuth.js Configuration**
- **File:** `apps/web/src/lib/auth.ts`
- **Providers:**
  - ✅ **Google OAuth** - Sign in with Google account
  - ✅ **GitHub OAuth** - Sign in with GitHub account
  - ✅ **Credentials** - Email/password with bcrypt hashing
- **Features:**
  - Database session storage via PrismaAdapter
  - JWT strategy with 30-day sessions
  - Custom session enrichment (user ID, role, organizations)
  - Type-safe with TypeScript declarations

### 2. **Authentication Pages**

#### **Sign-In Page** (`/sign-in`)
- **File:** `apps/web/src/app/(auth)/sign-in/page.tsx`
- **Features:**
  - Email/password sign-in
  - Google OAuth button
  - GitHub OAuth button
  - Remember me checkbox
  - Error handling with user-friendly messages
  - Auto-redirect after successful login
  - Callback URL support for protected pages
  - Loading states during authentication

#### **Sign-Up Page** (`/sign-up`)
- **File:** `apps/web/src/app/(auth)/sign-up/page.tsx`
- **Features:**
  - User registration with name, email, password
  - Optional organization creation on signup
  - Google OAuth registration
  - GitHub OAuth registration
  - Password strength indicator
  - Password confirmation validation
  - Terms of Service agreement
  - Auto sign-in after registration
  - Email validation
  - Error handling

### 3. **User Registration API**
- **File:** `apps/web/src/app/api/auth/register/route.ts`
- **Features:**
  - POST endpoint for user registration
  - Email format validation
  - Password strength validation (min 8 characters)
  - Duplicate email detection
  - Bcrypt password hashing (12 rounds)
  - Automatic organization creation
  - Organization slug generation
  - User added as OWNER of new organization
  - Activity logging
  - IP address and user agent tracking
  - Transaction-safe database operations

### 4. **Custom Authentication Hooks**
- **File:** `apps/web/src/hooks/use-auth.ts`
- **Hooks:**
  ```typescript
  useAuth()                    // Get current session & user
  useCurrentUser()             // Get current user or null
  useRequireAuth(redirectTo)   // Require auth or redirect
  useHasRole(allowedRoles)     // Check if user has role
  useOrganizations()           // Get user's organizations
  useHasOrganizationRole()     // Check org-specific role
  ```

### 5. **Server-Side Auth Helpers**
- **File:** `apps/web/src/lib/auth-helpers.ts`
- **Functions:**
  ```typescript
  getCurrentUser()                         // Get user or null
  requireAuth()                            // Require auth or redirect
  requireRole(allowedRoles)                // Require specific role
  getCurrentOrganization(slug)             // Get user's org
  requireOrganizationRole(slug, roles)     // Require org role
  ```

### 6. **Protected Routes Middleware**
- **File:** `apps/web/src/middleware.ts`
- **Features:**
  - Automatic protection for `/dashboard/*` routes
  - Redirect to sign-in if not authenticated
  - Redirect to dashboard if trying to access auth pages while logged in
  - Callback URL preservation for deep linking
  - Session-based access control

### 7. **Updated Header Component**
- **File:** `apps/web/src/components/layout/Header.tsx`
- **Features:**
  - Shows "Sign In" / "Start Free Trial" when logged out
  - Shows user avatar and name when logged in
  - User dropdown menu with:
    - User name and email display
    - User role badge
    - Dashboard link
    - Settings link
    - Sign Out button
  - Loading skeleton during auth check
  - Responsive mobile menu

### 8. **Updated AuthProvider**
- **File:** `apps/web/src/components/providers/auth-provider.tsx`
- **Changes:**
  - Removed custom auth logic
  - Now wraps app with NextAuth `<SessionProvider>`
  - Simplifiedto single component

---

## 🚀 How to Use

### For Users

#### **Sign Up**
1. Navigate to `/sign-up`
2. Choose one of three options:
   - Click "Continue with Google"
   - Click "Continue with GitHub"
   - Fill in email, password, and optional company name
3. After successful registration:
   - You're automatically signed in
   - Redirected to `/dashboard/dashboard`
   - Your organization is created (if provided)

#### **Sign In**
1. Navigate to `/sign-in`
2. Choose authentication method:
   - Click "Continue with Google"
   - Click "Continue with GitHub"
   - Enter email and password
3. After successful sign-in:
   - Redirected to dashboard or callback URL
   - Session persists for 30 days (if "Remember me" checked)

#### **Sign Out**
1. Click your avatar in the header
2. Click "Sign Out"
3. You're redirected to the homepage

### For Developers

#### **Protect a Page (Client Component)**
```tsx
"use client"

import { useRequireAuth } from "@/hooks/use-auth"

export default function ProtectedPage() {
  const { isLoading } = useRequireAuth()
  
  if (isLoading) return <div>Loading...</div>
  
  return <div>Protected content</div>
}
```

#### **Protect a Page (Server Component)**
```tsx
import { requireAuth } from "@/lib/auth-helpers"

export default async function ProtectedPage() {
  const user = await requireAuth()
  
  return <div>Hello {user.name}</div>
}
```

#### **Check User Role**
```tsx
import { useHasRole } from "@/hooks/use-auth"

export default function AdminPanel() {
  const isAdmin = useHasRole(["ADMIN", "SUPER_ADMIN"])
  
  if (!isAdmin) return <div>Access Denied</div>
  
  return <div>Admin Panel</div>
}
```

#### **Get Current User**
```tsx
import { useCurrentUser } from "@/hooks/use-auth"

export default function Profile() {
  const user = useCurrentUser()
  
  return (
    <div>
      <h1>{user?.name}</h1>
      <p>{user?.email}</p>
      <p>Role: {user?.role}</p>
    </div>
  )
}
```

---

## 🔧 Configuration

### Environment Variables

Required in `.env`:

```env
# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# GitHub OAuth (Optional)
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"
```

### Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

### Setup Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env`

### Setup GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Client Secret to `.env`

---

## 📊 Database Schema

### User Model
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  password      String?   // Bcrypt hashed
  role          UserRole  @default(USER)
  emailVerified DateTime?
  image         String?
  // ... relationships
}
```

### Organization Model
```prisma
model Organization {
  id               String   @id @default(cuid())
  name             String
  slug             String   @unique
  subscriptionTier SubscriptionTier @default(FREE)
  maxUsers         Int      @default(5)
  maxWarehouses    Int      @default(1)
  // ... more fields
}
```

### OrganizationMember Model
```prisma
model OrganizationMember {
  id             String           @id @default(cuid())
  userId         String
  organizationId String
  role           OrganizationRole
  permissions    Json
  // ... more fields
}
```

---

## 🔐 Security Features

1. **Password Hashing**
   - Bcrypt with 12 rounds
   - Never stored in plain text

2. **Session Management**
   - JWT tokens with 30-day expiry
   - Secure HTTP-only cookies
   - CSRF protection

3. **Input Validation**
   - Email format validation
   - Password strength requirements
   - SQL injection prevention (Prisma)

4. **Route Protection**
   - Middleware-based protection
   - Server-side session verification
   - Role-based access control

5. **Activity Logging**
   - User registration logged
   - IP address tracking
   - User agent tracking
   - Complete audit trail

---

## 🎯 Authentication Flow

### Registration Flow
```
1. User fills sign-up form
   ↓
2. POST to /api/auth/register
   ↓
3. Validate input (email, password strength)
   ↓
4. Check if email exists
   ↓
5. Hash password with bcrypt
   ↓
6. Create user in database
   ↓
7. Create organization (if provided)
   ↓
8. Add user as OWNER
   ↓
9. Log activity
   ↓
10. Auto sign-in with credentials
    ↓
11. Redirect to dashboard
```

### Sign-In Flow
```
1. User submits credentials/clicks OAuth
   ↓
2. NextAuth handles authentication
   ↓
3. For credentials: Compare bcrypt hash
   ↓
4. For OAuth: Verify with provider
   ↓
5. Create session in database
   ↓
6. Generate JWT token
   ↓
7. Enrich token with role & organizations
   ↓
8. Set secure cookie
   ↓
9. Redirect to dashboard/callback URL
```

### Protected Route Access
```
1. User navigates to /dashboard
   ↓
2. Middleware checks session
   ↓
3. If no session: Redirect to /sign-in
   ↓
4. If session exists: Allow access
   ↓
5. Page can access user data via hooks
```

---

## 🧪 Testing Authentication

### Test User Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test@123",
    "organizationName": "Test Company"
  }'
```

### Test Sign-In
1. Go to http://localhost:3000/sign-in
2. Enter credentials or click OAuth button
3. Should redirect to dashboard

### Test Protected Route
1. Sign out
2. Try to access http://localhost:3000/dashboard/dashboard
3. Should redirect to /sign-in with callback URL

---

## 🐛 Troubleshooting

### "Invalid email or password"
- Check database has users (run `npx prisma studio`)
- Verify password is at least 8 characters
- Ensure email matches exactly

### "User already exists"
- Email is already registered
- Try signing in instead
- Or use different email

### OAuth Not Working
- Check `GOOGLE_CLIENT_ID` / `GITHUB_ID` in `.env`
- Verify callback URLs in OAuth provider settings
- Ensure `NEXTAUTH_URL` matches your domain

### Session Not Persisting
- Check browser cookies are enabled
- Verify `NEXTAUTH_SECRET` is set
- Clear browser cookies and try again

### Middleware Redirecting Incorrectly
- Check `middleware.ts` matcher patterns
- Verify session is being created
- Look for errors in browser console

---

## 📈 Next Steps

Now that authentication is complete, you can:

1. **Test the authentication flow**
   - Sign up with demo account
   - Sign in with different providers
   - Test protected routes

2. **Customize the experience**
   - Add email verification
   - Implement password reset
   - Add two-factor authentication

3. **Build CRUD operations** (Phase 5)
   - Inventory management
   - Stock booking
   - User management

4. **Add role-based features** (Phase 7)
   - Admin panel
   - Organization settings
   - Member invitations

---

## 🎉 Summary

**Authentication is now fully functional!** Users can:
- ✅ Sign up with email/password or OAuth
- ✅ Sign in with multiple providers
- ✅ Access protected dashboard routes
- ✅ See their user info in header
- ✅ Sign out securely
- ✅ Have persistent sessions (30 days)
- ✅ Get proper error messages
- ✅ Experience loading states

All with **enterprise-grade security** including password hashing, CSRF protection, SQL injection prevention, and complete audit logging.

**Ready to move to Phase 5: Inventory Management CRUD! 🚀**
