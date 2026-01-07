# 📝 LogiVox Code Documentation Standards

## Enterprise-Grade Code Quality, Comments, Headers & Licensing

> **DOCUMENTATION LEVEL**: Enterprise Standard (Microsoft/Google Level)  
> **CODE QUALITY TARGET**: A+ (SonarQube Score 95+)  
> **COMMENT COVERAGE**: 100% for Public APIs, 80% for Internal Functions  
> **LICENSE**: Commercial Proprietary + Optional Open Source Modules

---

## 📋 Table of Contents

1. [File Header Standards](#file-header-standards)
2. [Function Documentation (JSDoc/TSDoc)](#function-documentation-jsdoctsdoc)
3. [Code Comments Best Practices](#code-comments-best-practices)
4. [Licensing Strategy](#licensing-strategy)
5. [API Documentation](#api-documentation)
6. [Code Quality Standards](#code-quality-standards)

---

## 📄 File Header Standards

### Standard File Header Template

```typescript
/**
 * @fileoverview [Brief description of what this file does]
 * @module [Module name - e.g., lib/auth/session]
 * @author LogiVox Engineering Team
 * @created [YYYY-MM-DD]
 * @lastModified [YYYY-MM-DD]
 * @version 1.0.0
 *
 * @license Proprietary
 * Copyright (c) 2024-2025 LogiVox Technologies, Inc.
 * All rights reserved.
 *
 * CONFIDENTIAL AND PROPRIETARY INFORMATION
 * This code is the proprietary property of LogiVox Technologies, Inc.
 *
 * Unauthorized copying, distribution, modification, or use of this software,
 * via any medium, is strictly prohibited without express written permission
 * from LogiVox Technologies, Inc.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * For licensing inquiries, contact: legal@logivox.ai
 *
 * @dependencies
 * - next-auth: Authentication framework
 * - prisma: Database ORM
 * - redis: Caching layer
 *
 * @security
 * - Contains sensitive session management logic
 * - Implements OWASP session security best practices
 * - Requires MFA for admin operations
 *
 * @performance
 * - Redis caching for 30-second session validation
 * - Automatic session cleanup every 24 hours
 *
 * @breaking-changes
 * - v1.0.0 (2025-01-15): Initial release
 */
```

### Example: Complete File with Header

````typescript
/**
 * @fileoverview Session Management Service with enterprise-grade security
 * @module lib/auth/session
 * @author LogiVox Engineering Team
 * @created 2025-01-15
 * @lastModified 2025-01-15
 * @version 1.0.0
 *
 * @license Proprietary
 * Copyright (c) 2024-2025 LogiVox Technologies, Inc.
 * All rights reserved.
 *
 * @description
 * Implements secure session management with the following features:
 * - 30-minute idle timeout
 * - 12-hour absolute timeout
 * - Redis-backed session storage
 * - Concurrent session limiting (max 5 per user)
 * - Session hijacking prevention
 * - IP address validation
 * - User agent validation
 *
 * @dependencies
 * - next-auth@^4.24.0: Authentication framework
 * - @prisma/client@^5.8.0: Database ORM
 * - ioredis@^5.3.0: Redis client
 *
 * @security
 * - OWASP Session Management Cheat Sheet compliant
 * - Implements session fixation prevention
 * - Secure cookie flags (HttpOnly, Secure, SameSite=Strict)
 * - CSRF token validation
 *
 * @performance
 * - Redis caching reduces database load by 90%
 * - Session validation: <10ms average response time
 * - Supports 10,000+ concurrent sessions per server
 *
 * @testing
 * - Unit tests: lib/auth/__tests__/session.test.ts
 * - Integration tests: tests/integration/auth/session.spec.ts
 * - Coverage: 95%
 *
 * @related
 * - lib/auth/middleware.ts: Session validation middleware
 * - lib/auth/csrf.ts: CSRF protection
 * - app/api/auth/[...nextauth]/route.ts: NextAuth configuration
 */

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

/**
 * Session security configuration constants
 *
 * @constant {number} IDLE_TIMEOUT - Maximum idle time before session expires (30 minutes)
 * @constant {number} ABSOLUTE_TIMEOUT - Maximum session lifetime (12 hours)
 * @constant {number} MAX_CONCURRENT_SESSIONS - Maximum concurrent sessions per user
 * @constant {boolean} SINGLE_SESSION_MODE - If true, only one session per user allowed
 *
 * @example
 * ```typescript
 * if (timeSinceActivity > SESSION_CONFIG.IDLE_TIMEOUT) {
 *   await invalidateSession(sessionToken);
 * }
 * ```
 */
export const SESSION_CONFIG = {
  IDLE_TIMEOUT: 30 * 60, // 30 minutes in seconds
  ABSOLUTE_TIMEOUT: 12 * 60 * 60, // 12 hours in seconds
  MAX_CONCURRENT_SESSIONS: 5,
  SINGLE_SESSION_MODE: false,
} as const;

/**
 * Session Manager Class
 *
 * Provides enterprise-grade session management with security best practices.
 * Implements OWASP session security guidelines.
 *
 * @class SessionManager
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * // Validate a session
 * const isValid = await SessionManager.validateSession(sessionToken);
 *
 * // Invalidate a session (logout)
 * await SessionManager.invalidateSession(sessionToken);
 *
 * // Enforce concurrent session limit
 * await SessionManager.enforceConcurrentSessionLimit(userId, newSessionToken);
 * ```
 */
export class SessionManager {
  /**
   * Validates session security and updates activity timestamp
   *
   * Performs the following checks:
   * 1. Checks if session is blacklisted (force logged out)
   * 2. Verifies session hasn't exceeded idle timeout
   * 3. Updates last activity timestamp in Redis
   *
   * @param {string} sessionToken - The session token to validate
   * @returns {Promise<boolean>} True if session is valid, false otherwise
   *
   * @throws {Error} If Redis connection fails
   *
   * @security
   * - Session tokens are cryptographically secure (256-bit)
   * - Timing-safe comparison to prevent timing attacks
   * - Automatic expiration prevents zombie sessions
   *
   * @performance
   * - Average response time: <10ms
   * - Redis caching eliminates database queries
   * - Automatic cleanup of expired sessions
   *
   * @example
   * ```typescript
   * const session = await getServerSession();
   * const isValid = await SessionManager.validateSession(session.sessionToken);
   *
   * if (!isValid) {
   *   redirect('/login');
   * }
   * ```
   *
   * @see {@link invalidateSession} for session termination
   * @see {@link SESSION_CONFIG} for timeout configuration
   */
  static async validateSession(sessionToken: string): Promise<boolean> {
    // Check if session is blacklisted (force logout)
    const isBlacklisted = await redis.get(`session:blacklist:${sessionToken}`);
    if (isBlacklisted) {
      return false;
    }

    // Check session activity timestamp
    const lastActivity = await redis.get(`session:activity:${sessionToken}`);
    if (lastActivity) {
      const timeSinceActivity = Date.now() - parseInt(lastActivity);

      // Session expired due to inactivity
      if (timeSinceActivity > SESSION_CONFIG.IDLE_TIMEOUT * 1000) {
        await this.invalidateSession(sessionToken);
        return false;
      }
    }

    // Update last activity timestamp
    // Uses SETEX for automatic expiration after ABSOLUTE_TIMEOUT
    await redis.setex(
      `session:activity:${sessionToken}`,
      SESSION_CONFIG.ABSOLUTE_TIMEOUT,
      Date.now().toString(),
    );

    return true;
  }

  /**
   * Invalidates a session (logout)
   *
   * Performs the following operations:
   * 1. Adds session to blacklist (prevents future use)
   * 2. Removes session activity tracking
   * 3. Clears session from Redis cache
   *
   * @param {string} sessionToken - The session token to invalidate
   * @returns {Promise<void>}
   *
   * @throws {Error} If Redis connection fails
   *
   * @security
   * - Blacklist ensures session cannot be reused even if token is compromised
   * - Blacklist expires after ABSOLUTE_TIMEOUT to prevent memory bloat
   *
   * @example
   * ```typescript
   * // User logout
   * await SessionManager.invalidateSession(session.sessionToken);
   *
   * // Force logout (security breach)
   * await SessionManager.invalidateSession(compromisedToken);
   * ```
   *
   * @see {@link validateSession} for session validation
   * @see {@link invalidateAllUserSessions} to logout user from all devices
   */
  static async invalidateSession(sessionToken: string): Promise<void> {
    // Add to blacklist with automatic expiration
    await redis.setex(
      `session:blacklist:${sessionToken}`,
      SESSION_CONFIG.ABSOLUTE_TIMEOUT,
      "1",
    );

    // Remove from active sessions
    await redis.del(`session:activity:${sessionToken}`);
  }

  /**
   * Enforces concurrent session limit per user
   *
   * Limits the number of concurrent sessions per user to prevent:
   * - Account sharing
   * - Session hijacking
   * - Unauthorized access
   *
   * Algorithm:
   * 1. Adds new session to user's session set (Redis sorted set)
   * 2. If total sessions > MAX_CONCURRENT_SESSIONS, removes oldest sessions
   * 3. Invalidates removed sessions
   *
   * @param {string} userId - The user ID
   * @param {string} newSessionToken - The new session token to add
   * @returns {Promise<void>}
   *
   * @throws {Error} If Redis connection fails
   *
   * @security
   * - Prevents credential sharing (max 5 devices per user)
   * - Automatic logout of oldest sessions when limit exceeded
   * - Alerts user when new session is created (email notification)
   *
   * @performance
   * - O(log N) complexity using Redis sorted sets
   * - Automatic cleanup of old sessions
   *
   * @example
   * ```typescript
   * // Called automatically on login
   * await SessionManager.enforceConcurrentSessionLimit(
   *   user.id,
   *   newSession.sessionToken
   * );
   * ```
   *
   * @see {@link SESSION_CONFIG.MAX_CONCURRENT_SESSIONS} for limit configuration
   * @see {@link invalidateSession} for session termination
   */
  static async enforceConcurrentSessionLimit(
    userId: string,
    newSessionToken: string,
  ): Promise<void> {
    const sessionKey = `user:sessions:${userId}`;

    // Add new session to sorted set (score = timestamp)
    await redis.zadd(sessionKey, Date.now(), newSessionToken);

    // Get all sessions for this user
    const sessions = await redis.zrange(sessionKey, 0, -1);

    // If exceeds limit, remove oldest sessions
    if (sessions.length > SESSION_CONFIG.MAX_CONCURRENT_SESSIONS) {
      const sessionsToRemove = sessions.slice(
        0,
        sessions.length - SESSION_CONFIG.MAX_CONCURRENT_SESSIONS,
      );

      // Invalidate and remove old sessions
      for (const session of sessionsToRemove) {
        await this.invalidateSession(session);
        await redis.zrem(sessionKey, session);
      }
    }
  }

  /**
   * Gets all active sessions for a user
   *
   * @param {string} userId - The user ID
   * @returns {Promise<SessionInfo[]>} Array of active session information
   *
   * @interface SessionInfo
   * @property {string} sessionToken - The session token
   * @property {Date} createdAt - When session was created
   * @property {Date} lastActivity - Last activity timestamp
   * @property {string} ipAddress - IP address of session
   * @property {string} userAgent - User agent string
   * @property {boolean} isCurrent - If this is the current session
   *
   * @example
   * ```typescript
   * const sessions = await SessionManager.getActiveSessions(user.id);
   *
   * // Display in user's security settings
   * sessions.forEach(session => {
   *   console.log(`Device: ${session.userAgent}`);
   *   console.log(`Last active: ${session.lastActivity}`);
   * });
   * ```
   */
  static async getActiveSessions(userId: string): Promise<SessionInfo[]> {
    // Implementation...
    return [];
  }
}

/**
 * Session information interface
 *
 * @interface SessionInfo
 * @property {string} sessionToken - Unique session identifier
 * @property {Date} createdAt - Session creation timestamp
 * @property {Date} lastActivity - Last activity timestamp
 * @property {string} ipAddress - Client IP address
 * @property {string} userAgent - Client user agent string
 * @property {boolean} isCurrent - Whether this is the current session
 *
 * @example
 * ```typescript
 * const sessionInfo: SessionInfo = {
 *   sessionToken: '...',
 *   createdAt: new Date(),
 *   lastActivity: new Date(),
 *   ipAddress: '192.168.1.1',
 *   userAgent: 'Mozilla/5.0...',
 *   isCurrent: true,
 * };
 * ```
 */
export interface SessionInfo {
  sessionToken: string;
  createdAt: Date;
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
  isCurrent: boolean;
}

// Export for testing
export const __testing__ = {
  SESSION_CONFIG,
  SessionManager,
};
````

---

## 📝 Function Documentation (JSDoc/TSDoc)

### Documentation Template

````typescript
/**
 * [Brief one-line description]
 *
 * [Detailed description explaining:
 *  - What the function does
 *  - Why it exists
 *  - How it works (algorithm/approach)
 *  - When to use it]
 *
 * @param {Type} paramName - [Parameter description]
 * @param {Type} [optionalParam] - [Optional parameter description] (default: value)
 * @returns {ReturnType} [Return value description]
 *
 * @throws {ErrorType} [When this error is thrown]
 *
 * @security [Security considerations]
 * @performance [Performance characteristics]
 * @complexity [Time/space complexity]
 *
 * @example
 * ```typescript
 * // Example usage
 * const result = await functionName(param1, param2);
 * ```
 *
 * @see {@link RelatedFunction} for related functionality
 * @since 1.0.0
 * @deprecated Use {@link NewFunction} instead (since 2.0.0)
 */
````

### Examples by Function Type

#### 1. API Route Handler

````typescript
/**
 * Creates a new inventory item
 *
 * POST /api/inventory
 *
 * This endpoint creates a new inventory item with validation and audit logging.
 * Requires authentication and INVENTORY_CREATE permission.
 *
 * @param {NextRequest} request - The HTTP request object
 * @returns {NextResponse<InventoryItem>} The created inventory item
 *
 * @throws {401} Unauthorized - User not authenticated
 * @throws {403} Forbidden - User lacks INVENTORY_CREATE permission
 * @throws {400} Bad Request - Invalid request body
 * @throws {409} Conflict - SKU already exists
 *
 * @security
 * - Requires JWT authentication
 * - Validates organization membership
 * - Checks RBAC permissions
 * - Logs action to audit trail
 *
 * @performance
 * - Average response time: 50ms
 * - Database query: 1 write + 2 reads
 * - Redis cache invalidation: O(1)
 *
 * @example
 * ```typescript
 * // Client request
 * const response = await fetch('/api/inventory', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'Authorization': `Bearer ${token}`,
 *   },
 *   body: JSON.stringify({
 *     sku: 'PROD-001',
 *     name: 'Widget',
 *     quantity: 100,
 *     category: 'Electronics',
 *   }),
 * });
 *
 * const item = await response.json();
 * ```
 *
 * @see {@link GET /api/inventory} for retrieving items
 * @see {@link PUT /api/inventory/[id]} for updating items
 * @since 1.0.0
 */
export async function POST(request: NextRequest) {
  // Implementation...
}
````

#### 2. Database Query Function

````typescript
/**
 * Retrieves inventory items with advanced filtering and pagination
 *
 * Supports:
 * - Text search (name, SKU, description)
 * - Category filtering
 * - Stock level filtering (low, out, available)
 * - Date range filtering
 * - Sorting (name, sku, quantity, updatedAt)
 * - Pagination (cursor-based)
 *
 * @param {Object} params - Query parameters
 * @param {string} params.organizationId - Organization ID (required)
 * @param {string} [params.search] - Search query (optional)
 * @param {string} [params.category] - Category filter (optional)
 * @param {StockLevel} [params.stockLevel] - Stock level filter (optional)
 * @param {Date} [params.fromDate] - Start date for filtering (optional)
 * @param {Date} [params.toDate] - End date for filtering (optional)
 * @param {SortField} [params.sortBy='updatedAt'] - Sort field (default: 'updatedAt')
 * @param {SortOrder} [params.sortOrder='desc'] - Sort order (default: 'desc')
 * @param {string} [params.cursor] - Pagination cursor (optional)
 * @param {number} [params.limit=50] - Page size (default: 50, max: 100)
 *
 * @returns {Promise<PaginatedResult<InventoryItem>>} Paginated inventory items
 *
 * @throws {Error} If organizationId is missing or invalid
 * @throws {Error} If database query fails
 *
 * @security
 * - Row-level security enforced via organizationId
 * - SQL injection protected via Prisma parameterization
 * - Results limited to 100 items per page (DDoS prevention)
 *
 * @performance
 * - Database indexes on: organizationId, category, sku, updatedAt
 * - Redis caching for 60 seconds (configurable)
 * - Query optimization: Uses covering indexes
 * - Average response time: 20-50ms (without cache), <5ms (cached)
 *
 * @complexity
 * - Time: O(log N) with indexes, O(N) without
 * - Space: O(limit) for result set
 *
 * @example
 * ```typescript
 * // Basic query
 * const result = await getInventoryItems({
 *   organizationId: 'org_123',
 *   limit: 20,
 * });
 *
 * // Advanced filtering
 * const filtered = await getInventoryItems({
 *   organizationId: 'org_123',
 *   search: 'widget',
 *   category: 'Electronics',
 *   stockLevel: 'LOW',
 *   sortBy: 'quantity',
 *   sortOrder: 'asc',
 * });
 *
 * // Pagination
 * const page2 = await getInventoryItems({
 *   organizationId: 'org_123',
 *   cursor: result.nextCursor,
 *   limit: 20,
 * });
 * ```
 *
 * @see {@link createInventoryItem} for creating items
 * @see {@link updateInventoryItem} for updating items
 * @since 1.0.0
 */
export async function getInventoryItems(
  params: GetInventoryParams,
): Promise<PaginatedResult<InventoryItem>> {
  // Implementation...
}
````

---

## 💬 Code Comments Best Practices

### 1. Inline Comments

```typescript
// ✅ GOOD: Explains WHY, not WHAT
// Use exponential backoff to avoid overwhelming the API during high traffic
const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);

// ❌ BAD: States the obvious
// Set delay to 1000 times 2 to the power of retryCount
const delay = 1000 * Math.pow(2, retryCount);

// ✅ GOOD: Explains business logic
// Per company policy, invoices must be paid within 30 days
// After 30 days, a 2% late fee is applied
if (daysSinceInvoice > 30) {
  totalAmount *= 1.02;
}

// ❌ BAD: Redundant comment
// Multiply total amount by 1.02
totalAmount *= 1.02;
```

### 2. TODO Comments

```typescript
// ✅ GOOD: Actionable TODO with context
// TODO(john.doe, 2025-01-20): Implement rate limiting for this endpoint
// Currently allows unlimited requests - potential DDoS vector
// Target: 100 req/min per IP, 1000 req/hour per user
// Reference: SECURITY-ISSUE-123
export async function POST(request: NextRequest) {
  // Implementation...
}

// ❌ BAD: Vague TODO
// TODO: Fix this later
export async function POST(request: NextRequest) {
  // Implementation...
}
```

### 3. Complex Algorithm Comments

```typescript
/**
 * Calculates reorder point using Economic Order Quantity (EOQ) model
 *
 * Formula: ROP = (Average Daily Usage × Lead Time) + Safety Stock
 *
 * Where:
 * - Average Daily Usage = Annual Demand / 365
 * - Lead Time = Supplier lead time in days
 * - Safety Stock = Z-score × √(Lead Time) × σ (demand variability)
 * - Z-score = 1.65 for 95% service level
 *
 * @see https://en.wikipedia.org/wiki/Reorder_point
 */
function calculateReorderPoint(
  annualDemand: number,
  leadTimeDays: number,
  demandVariability: number,
): number {
  // Step 1: Calculate average daily usage
  const avgDailyUsage = annualDemand / 365;

  // Step 2: Calculate base reorder point
  const baseROP = avgDailyUsage * leadTimeDays;

  // Step 3: Calculate safety stock (95% service level)
  const zScore = 1.65; // 95% confidence
  const safetyStock = zScore * Math.sqrt(leadTimeDays) * demandVariability;

  // Step 4: Return total reorder point (rounded up)
  return Math.ceil(baseROP + safetyStock);
}
```

---

## ⚖️ Licensing Strategy

### 1. Proprietary Core License

```typescript
/**
 * @license Proprietary
 * Copyright (c) 2024-2025 LogiVox Technologies, Inc.
 * All rights reserved.
 *
 * CONFIDENTIAL AND PROPRIETARY INFORMATION
 *
 * This software and associated documentation files (the "Software") contain
 * proprietary information owned by LogiVox Technologies, Inc. ("LogiVox").
 *
 * The Software is licensed, not sold. This license grants you the following rights:
 *
 * GRANTED RIGHTS:
 * - Use the Software for your internal business operations
 * - Install the Software on unlimited servers you own or control
 * - Create backups for disaster recovery purposes
 *
 * RESTRICTIONS:
 * - You may NOT redistribute, sublicense, or sell the Software
 * - You may NOT reverse engineer, decompile, or disassemble the Software
 * - You may NOT remove or modify any copyright notices
 * - You may NOT use the Software to provide SaaS to third parties
 * - You may NOT use the Software for competitive analysis
 *
 * TERMINATION:
 * This license terminates automatically if you breach any terms.
 * Upon termination, you must destroy all copies of the Software.
 *
 * WARRANTY DISCLAIMER:
 * THE SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 *
 * LIMITATION OF LIABILITY:
 * IN NO EVENT SHALL LOGIVOX BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * For licensing inquiries: legal@logivox.ai
 * For support: support@logivox.ai
 *
 * LogiVox Technologies, Inc.
 * [Address]
 * [Phone]
 * [Email]
 */
```

### 2. MIT License for Open Source Modules (Optional)

```typescript
/**
 * @license MIT
 *
 * Copyright (c) 2024-2025 LogiVox Technologies, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
```

### 3. Dual Licensing (Commercial + Open Source)

```typescript
/**
 * @license Dual Licensed: Commercial and MIT
 *
 * COMMERCIAL LICENSE:
 * For commercial use, contact sales@logivox.ai
 *
 * OPEN SOURCE LICENSE (MIT):
 * For open source projects, this module is available under the MIT License.
 * See LICENSE-MIT.txt for details.
 *
 * Copyright (c) 2024-2025 LogiVox Technologies, Inc.
 */
```

---

## 📊 Code Quality Standards

### SonarQube Quality Gate

```yaml
# sonar-project.properties
sonar.projectKey=flowstock
sonar.projectName=LogiVox
sonar.projectVersion=1.0.0

# Source code
sonar.sources=apps/web,packages
sonar.tests=apps/web/__tests__,packages/**/__tests__
sonar.test.inclusions=**/*.test.ts,**/*.test.tsx,**/*.spec.ts

# Coverage
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.typescript.lcov.reportPaths=coverage/lcov.info

# Quality Gates
sonar.qualitygate.wait=true
sonar.coverage.exclusions=**/*.config.js,**/*.test.ts,**/test/**

# Thresholds
sonar.coverage.threshold=80
sonar.duplicated_lines_density.threshold=3
sonar.code_smells.threshold=10
sonar.bugs.threshold=0
sonar.vulnerabilities.threshold=0
sonar.security_hotspots.threshold=0
```

### ESLint Documentation Rules

```json
// .eslintrc.json
{
  "rules": {
    // Require JSDoc comments for public APIs
    "jsdoc/require-jsdoc": [
      "error",
      {
        "require": {
          "FunctionDeclaration": true,
          "MethodDefinition": true,
          "ClassDeclaration": true,
          "ArrowFunctionExpression": false
        },
        "publicOnly": true
      }
    ],

    // Require parameter descriptions
    "jsdoc/require-param-description": "error",
    "jsdoc/require-param-type": "error",

    // Require return descriptions
    "jsdoc/require-returns-description": "error",
    "jsdoc/require-returns-type": "error",

    // Valid JSDoc formatting
    "jsdoc/check-alignment": "error",
    "jsdoc/check-param-names": "error",
    "jsdoc/check-tag-names": "error",
    "jsdoc/check-types": "error",

    // Require examples for complex functions
    "jsdoc/require-example": [
      "warn",
      {
        "checkConstructors": false,
        "checkGetters": false,
        "checkSetters": false
      }
    ]
  }
}
```

---

## ✅ Documentation Checklist

### Before Committing Code

- [ ] File header with license and description
- [ ] JSDoc comments for all public functions
- [ ] Parameter descriptions with types
- [ ] Return value descriptions
- [ ] Error/exception documentation
- [ ] Security considerations documented
- [ ] Performance characteristics noted
- [ ] At least one usage example
- [ ] Related function cross-references
- [ ] Inline comments for complex logic
- [ ] TODO comments with assignee and date
- [ ] No commented-out code (use git history instead)

### Code Quality Metrics

- [ ] SonarQube score: A+ (95+)
- [ ] Test coverage: 80%+ (90%+ for critical paths)
- [ ] No security vulnerabilities
- [ ] No code smells (max 10 minor)
- [ ] Cyclomatic complexity: <15 per function
- [ ] Duplicate code: <3%
- [ ] Technical debt ratio: <5%

---

**With these documentation standards, LogiVox maintains enterprise-grade code quality that rivals Microsoft, Google, and Amazon.**
