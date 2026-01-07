# LogiVox Security Guidelines & Best Practices

## Security Overview

LogiVox implements comprehensive security measures to protect sensitive warehouse and business data. As a multi-tenant SaaS platform, security is critical at every layer from authentication to data isolation.

## Security Principles

### 1. Defense in Depth

- Multiple layers of security controls
- Fail-secure defaults
- Principle of least privilege
- Zero-trust architecture

### 2. Multi-Tenant Security

- Complete data isolation between organizations
- Organization-scoped database queries
- Tenant-aware authentication and authorization
- Cross-tenant data leak prevention

### 3. Secure by Design

- Security controls built into architecture
- Input validation at all entry points
- Output encoding for all user data
- Secure session management

## Authentication & Authorization

### JWT Authentication Implementation

```typescript
// Secure JWT token generation
import jwt from "jsonwebtoken";
import { User } from "@prisma/client";

interface TokenPayload {
  userId: string;
  organizationId: string;
  role: string;
  permissions: string[];
  exp: number;
  iat: number;
}

export function generateAccessToken(user: User): string {
  const payload: TokenPayload = {
    userId: user.id,
    organizationId: user.organizationId,
    role: user.role,
    permissions: getRolePermissions(user.role),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    algorithm: "HS256",
  });
}

export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
  } catch (error) {
    throw new Error("Invalid token");
  }
}
```

### Role-Based Access Control (RBAC)

```typescript
// Permission definitions
export const PERMISSIONS = {
  // Inventory permissions
  "inventory:read": "View inventory items",
  "inventory:write": "Create and update inventory items",
  "inventory:delete": "Delete inventory items",
  "inventory:adjust": "Adjust stock levels",

  // Warehouse permissions
  "warehouse:read": "View warehouse information",
  "warehouse:write": "Create and update warehouses",
  "warehouse:delete": "Delete warehouses",
  "warehouse:manage": "Manage warehouse settings",

  // Purchase Order permissions
  "po:read": "View purchase orders",
  "po:write": "Create and update purchase orders",
  "po:approve": "Approve purchase orders",
  "po:delete": "Delete purchase orders",

  // User management permissions
  "user:read": "View users",
  "user:write": "Create and update users",
  "user:delete": "Delete users",
  "user:invite": "Invite new users",

  // Administrative permissions
  "admin:read": "View admin settings",
  "admin:write": "Modify admin settings",
  "admin:billing": "Manage billing and subscriptions",
  "admin:audit": "View audit logs",
} as const;

// Role permission mappings
export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: Object.keys(PERMISSIONS),
  ADMIN: [
    "inventory:read",
    "inventory:write",
    "inventory:delete",
    "inventory:adjust",
    "warehouse:read",
    "warehouse:write",
    "warehouse:delete",
    "warehouse:manage",
    "po:read",
    "po:write",
    "po:approve",
    "po:delete",
    "user:read",
    "user:write",
    "user:delete",
    "user:invite",
    "admin:read",
    "admin:write",
    "admin:billing",
    "admin:audit",
  ],
  MANAGER: [
    "inventory:read",
    "inventory:write",
    "inventory:adjust",
    "warehouse:read",
    "warehouse:write",
    "po:read",
    "po:write",
    "po:approve",
    "user:read",
    "user:invite",
  ],
  OPERATOR: [
    "inventory:read",
    "inventory:write",
    "inventory:adjust",
    "warehouse:read",
    "po:read",
  ],
  VIEWER: ["inventory:read", "warehouse:read", "po:read"],
} as const;

// Permission check middleware
export function requirePermission(permission: keyof typeof PERMISSIONS) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const userPermissions =
      ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS];

    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: "Insufficient permissions",
      });
    }

    next();
  };
}
```

### Multi-Factor Authentication (MFA)

```typescript
// TOTP-based MFA implementation
import speakeasy from "speakeasy";
import qrcode from "qrcode";

export async function generateMFASecret(user: User) {
  const secret = speakeasy.generateSecret({
    name: `LogiVox (${user.email})`,
    issuer: "LogiVox",
  });

  // Store secret in database (encrypted)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      mfaSecret: encrypt(secret.base32),
      mfaEnabled: false, // Enable after verification
    },
  });

  // Generate QR code for authenticator app
  const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);

  return {
    secret: secret.base32,
    qrCode: qrCodeUrl,
  };
}

export function verifyMFAToken(user: User, token: string): boolean {
  if (!user.mfaSecret) {
    throw new Error("MFA not enabled for user");
  }

  const decryptedSecret = decrypt(user.mfaSecret);

  return speakeasy.totp.verify({
    secret: decryptedSecret,
    encoding: "base32",
    token,
    window: 2, // Allow 2 time steps variance
  });
}
```

## Data Protection & Privacy

### Multi-Tenant Data Isolation

```typescript
// Organization-scoped database operations
export class OrganizationService {
  // Ensure all queries are organization-scoped
  async findInventoryItems(
    organizationId: string,
    filters: InventoryFilters,
  ): Promise<InventoryItem[]> {
    return prisma.inventoryItem.findMany({
      where: {
        organizationId, // CRITICAL: Always include organization filter
        ...filters,
      },
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
            // Verify warehouse belongs to same organization
            organizationId: true,
          },
        },
      },
    });
  }

  // Prevent cross-tenant data access
  async updateInventoryItem(
    itemId: string,
    organizationId: string,
    updates: Partial<InventoryItem>,
  ): Promise<InventoryItem> {
    // First verify item belongs to organization
    const item = await prisma.inventoryItem.findFirst({
      where: {
        id: itemId,
        organizationId, // Prevent accessing other org's data
      },
    });

    if (!item) {
      throw new Error("Item not found or access denied");
    }

    return prisma.inventoryItem.update({
      where: { id: itemId },
      data: {
        ...updates,
        organizationId, // Ensure organization doesn't change
      },
    });
  }
}
```

### Data Encryption

```typescript
// Encryption utilities
import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32 bytes key
const ALGORITHM = "aes-256-gcm";

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  cipher.setAAD(Buffer.from("flowstock"));

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decrypt(encryptedData: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(":");

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
  decipher.setAAD(Buffer.from("flowstock"));
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

// PII field encryption in database
export const encryptedFields = {
  // Automatically encrypt sensitive fields
  beforeCreate: (data: any) => {
    if (data.email) data.email = encrypt(data.email);
    if (data.phone) data.phone = encrypt(data.phone);
    if (data.address) data.address = encrypt(data.address);
    return data;
  },

  afterRead: (data: any) => {
    if (data.email) data.email = decrypt(data.email);
    if (data.phone) data.phone = decrypt(data.phone);
    if (data.address) data.address = decrypt(data.address);
    return data;
  },
};
```

### GDPR Compliance

```typescript
// GDPR data management
export class GDPRService {
  // Right to access - export user data
  async exportUserData(userId: string, organizationId: string): Promise<any> {
    const userData = await prisma.user.findFirst({
      where: { id: userId, organizationId },
      include: {
        createdInventoryItems: true,
        stockMovements: true,
        auditLogs: true,
      },
    });

    if (!userData) {
      throw new Error("User not found");
    }

    // Return anonymized/cleaned data export
    return {
      personalInfo: {
        email: userData.email,
        name: userData.name,
        createdAt: userData.createdAt,
      },
      activityData: {
        inventoryItems: userData.createdInventoryItems.length,
        stockMovements: userData.stockMovements.length,
        lastActivity: userData.lastLoginAt,
      },
    };
  }

  // Right to erasure - delete user data
  async deleteUserData(userId: string, organizationId: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    await prisma.$transaction([
      // Anonymize audit logs instead of deleting
      prisma.auditLog.updateMany({
        where: { userId },
        data: { userId: null, userEmail: "deleted-user@example.com" },
      }),

      // Anonymize stock movements
      prisma.stockMovement.updateMany({
        where: { userId },
        data: { userId: null },
      }),

      // Delete user record
      prisma.user.delete({
        where: { id: userId },
      }),
    ]);
  }

  // Data portability - export in machine-readable format
  async exportDataPortability(organizationId: string): Promise<any> {
    const orgData = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        users: true,
        warehouses: {
          include: {
            inventoryItems: true,
            stockMovements: true,
          },
        },
        suppliers: true,
        purchaseOrders: true,
      },
    });

    // Return structured JSON export
    return {
      organization: {
        name: orgData?.name,
        domain: orgData?.domain,
        createdAt: orgData?.createdAt,
      },
      warehouses: orgData?.warehouses,
      inventory: orgData?.warehouses.flatMap((w) => w.inventoryItems),
      suppliers: orgData?.suppliers,
      purchaseOrders: orgData?.purchaseOrders,
    };
  }
}
```

## Input Validation & Sanitization

### Request Validation Middleware

```typescript
import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";

// Validation schemas
export const inventoryItemSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name too long")
    .transform((val) => DOMPurify.sanitize(val.trim())),

  sku: z
    .string()
    .min(1, "SKU is required")
    .max(100, "SKU too long")
    .regex(/^[A-Z0-9-_]+$/, "Invalid SKU format"),

  description: z
    .string()
    .max(1000, "Description too long")
    .optional()
    .transform((val) => (val ? DOMPurify.sanitize(val) : undefined)),

  currentStock: z
    .number()
    .int("Stock must be integer")
    .min(0, "Stock cannot be negative"),

  minimumStock: z
    .number()
    .int("Minimum stock must be integer")
    .min(0, "Minimum stock cannot be negative"),

  unitPrice: z
    .number()
    .positive("Unit price must be positive")
    .max(999999.99, "Unit price too high"),

  warehouseId: z.string().cuid("Invalid warehouse ID format"),
});

// Validation middleware factory
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.errors,
        });
      }
      next(error);
    }
  };
}

// SQL injection prevention
export function sanitizeQuery(query: string): string {
  // Remove potentially dangerous SQL characters/keywords
  return query
    .replace(/['"\\;--]/g, "") // Remove quotes, backslashes, semicolons, comments
    .replace(/\b(DROP|DELETE|UPDATE|INSERT|EXEC|UNION|SELECT)\b/gi, "") // Remove SQL keywords
    .trim()
    .substring(0, 100); // Limit length
}
```

### File Upload Security

```typescript
// Secure file upload handling
import multer from "multer";
import path from "path";
import crypto from "crypto";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5, // Max 5 files per request
  },
  fileFilter: (req, file, cb) => {
    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error("Invalid file type"));
    }

    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".pdf",
      ".csv",
      ".xlsx",
    ];

    if (!allowedExts.includes(ext)) {
      return cb(new Error("Invalid file extension"));
    }

    cb(null, true);
  },
});

export async function uploadToS3(
  file: Express.Multer.File,
  organizationId: string,
) {
  // Generate secure filename
  const fileExtension = path.extname(file.originalname);
  const fileName = `${crypto.randomUUID()}${fileExtension}`;
  const s3Key = `uploads/${organizationId}/${fileName}`;

  // Virus scan (integrate with ClamAV or similar)
  await scanForViruses(file.buffer);

  // Upload to S3 with proper permissions
  const uploadResult = await s3
    .upload({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: s3Key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ServerSideEncryption: "AES256",
      Metadata: {
        originalName: file.originalname,
        organizationId,
        uploadedAt: new Date().toISOString(),
      },
    })
    .promise();

  return {
    url: uploadResult.Location,
    key: s3Key,
    size: file.size,
    mimeType: file.mimetype,
  };
}
```

## API Security

### Rate Limiting

```typescript
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

// General API rate limiting
export const apiLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: "Too many requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for authentication endpoints
export const authLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit to 5 login attempts per windowMs
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: "Too many login attempts, please try again later",
  },
});

// Organization-specific rate limiting
export function organizationRateLimit(maxRequests: number = 1000) {
  return rateLimit({
    store: new RedisStore({
      sendCommand: (...args: string[]) => redis.call(...args),
    }),
    windowMs: 60 * 60 * 1000, // 1 hour
    max: maxRequests,
    keyGenerator: (req) => {
      // Rate limit by organization ID
      return `org:${req.user?.organizationId || req.ip}`;
    },
    message: {
      success: false,
      error: "Organization rate limit exceeded",
    },
  });
}
```

### CORS Configuration

```typescript
import cors from "cors";

export const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = process.env.CORS_ORIGINS?.split(",") || [];

    // Allow localhost in development
    if (process.env.NODE_ENV === "development") {
      allowedOrigins.push("http://localhost:3000", "http://localhost:5173");
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "X-Organization-ID",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
};
```

### Security Headers

```typescript
import helmet from "helmet";

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      connectSrc: ["'self'", "wss:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
});
```

## Security Monitoring & Logging

### Audit Logging

```typescript
// Comprehensive audit logging
export class AuditLogger {
  static async logAction(
    action: string,
    resource: string,
    resourceId: string,
    userId: string,
    organizationId: string,
    metadata: any = {},
  ): Promise<void> {
    await prisma.auditLog.create({
      data: {
        action,
        resource,
        resourceId,
        userId,
        organizationId,
        metadata: JSON.stringify(metadata),
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        timestamp: new Date(),
      },
    });
  }

  static async logSecurityEvent(
    event: string,
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    details: any,
    userId?: string,
    organizationId?: string,
  ): Promise<void> {
    await prisma.securityLog.create({
      data: {
        event,
        severity,
        details: JSON.stringify(details),
        userId,
        organizationId,
        timestamp: new Date(),
      },
    });

    // Send alert for high/critical severity events
    if (["HIGH", "CRITICAL"].includes(severity)) {
      await sendSecurityAlert(event, severity, details);
    }
  }
}

// Audit middleware
export function auditMiddleware(action: string, resource: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;

    res.send = function (data) {
      // Log successful operations
      if (res.statusCode < 400) {
        AuditLogger.logAction(
          action,
          resource,
          req.params.id || "unknown",
          req.user?.id || "anonymous",
          req.user?.organizationId || "unknown",
          {
            method: req.method,
            url: req.url,
            ipAddress: req.ip,
            userAgent: req.get("User-Agent"),
          },
        );
      }

      return originalSend.call(this, data);
    };

    next();
  };
}
```

### Intrusion Detection

```typescript
// Intrusion detection system
export class IntrusionDetection {
  private static suspiciousPatterns = [
    /union.*select/i,
    /script.*alert/i,
    /'.*or.*'.*=/i,
    /exec.*xp_cmdshell/i,
    /<script.*>/i,
  ];

  static async detectSuspiciousActivity(req: Request): Promise<boolean> {
    const suspicious = [];

    // Check for SQL injection patterns
    const queryString = JSON.stringify(req.query);
    const bodyString = JSON.stringify(req.body);

    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(queryString) || pattern.test(bodyString)) {
        suspicious.push(`Suspicious pattern detected: ${pattern}`);
      }
    }

    // Check for unusual request patterns
    if (req.headers["user-agent"]?.includes("sqlmap")) {
      suspicious.push("Automated security tool detected");
    }

    // Check for rapid successive requests (potential brute force)
    const recentRequests = await this.getRecentRequests(req.ip);
    if (recentRequests > 50) {
      suspicious.push("Excessive request rate detected");
    }

    if (suspicious.length > 0) {
      await AuditLogger.logSecurityEvent(
        "SUSPICIOUS_ACTIVITY",
        "HIGH",
        {
          ip: req.ip,
          userAgent: req.get("User-Agent"),
          url: req.url,
          method: req.method,
          patterns: suspicious,
        },
        req.user?.id,
        req.user?.organizationId,
      );

      return true;
    }

    return false;
  }

  private static async getRecentRequests(ip: string): Promise<number> {
    const key = `requests:${ip}`;
    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, 300); // 5 minutes
    }

    return count;
  }
}
```

## Incident Response

### Security Incident Response Plan

```typescript
// Automated incident response
export class IncidentResponse {
  static async handleSecurityIncident(
    type: string,
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    details: any,
  ): Promise<void> {
    // Log incident
    await AuditLogger.logSecurityEvent(type, severity, details);

    switch (severity) {
      case "CRITICAL":
        await this.handleCriticalIncident(type, details);
        break;
      case "HIGH":
        await this.handleHighSeverityIncident(type, details);
        break;
      case "MEDIUM":
        await this.handleMediumSeverityIncident(type, details);
        break;
      case "LOW":
        await this.handleLowSeverityIncident(type, details);
        break;
    }
  }

  private static async handleCriticalIncident(
    type: string,
    details: any,
  ): Promise<void> {
    // Immediate actions for critical incidents

    // 1. Alert security team immediately
    await this.sendImmediateAlert("CRITICAL", type, details);

    // 2. Consider automatic lockdown if data breach suspected
    if (type.includes("DATA_BREACH")) {
      await this.initiateSecurityLockdown();
    }

    // 3. Preserve evidence
    await this.preserveIncidentEvidence(type, details);

    // 4. Notify compliance team
    await this.notifyCompliance("CRITICAL", type, details);
  }

  private static async initiateSecurityLockdown(): Promise<void> {
    // Temporarily disable sensitive operations
    await redis.set("security:lockdown", "active", "EX", 3600); // 1 hour

    // Invalidate all active sessions
    await redis.flushdb(); // Clear session cache

    // Log lockdown action
    await AuditLogger.logSecurityEvent("SECURITY_LOCKDOWN", "CRITICAL", {
      initiatedAt: new Date(),
      reason: "Suspected security incident",
    });
  }
}
```

This comprehensive security framework ensures LogiVox maintains the highest standards of data protection, user privacy, and system integrity across all aspects of the platform.
