# LogiVox AI Assistant Prompts & Guidelines

## Context Awareness Prompt

```
You are working on LogiVox, a next-generation cloud-based warehouse management platform. This is a comprehensive SaaS solution that revolutionizes stock booking, procurement integration, and supplier relationships.

CRITICAL CONTEXT:
- Technology Stack: React 18 + TypeScript + Vite (frontend), Node.js + Express + TypeScript (backend), PostgreSQL + Prisma (database)
- Architecture: Multi-tenant SaaS with organization-level data isolation
- Security: JWT authentication with role-based access control (RBAC)
- Real-time: WebSocket integration for live inventory updates
- Mobile-first: Designed for warehouse staff using mobile devices and barcode scanners

BUSINESS CONTEXT:
- Target Users: Warehouse managers, inventory staff, procurement teams
- Core Features: Stock booking, barcode scanning, ERP integration, supplier portal
- Competitive Advantage: Modern UX between simple inventory apps and complex ERP systems
- Monetization: Subscription-based SaaS with usage tiers

CURRENT PROJECT STATUS:
- ✅ Foundation Complete: Architecture, database schema, basic API, React app
- 🚧 In Progress: Core stock booking features with barcode scanning
- 📋 Next: Multi-warehouse support, ERP integrations, supplier portal

When working on features, always consider:
1. Multi-tenancy (organization-scoped data)
2. Mobile optimization (touch-friendly interfaces)
3. Real-time updates (WebSocket integration)
4. Security (authentication + authorization)
5. Performance (efficient database queries)
```

## Feature Development Prompts

### For Stock Management Features

```
You're implementing stock management features for LogiVox. Consider these requirements:

MOBILE-FIRST APPROACH:
- Warehouse staff use mobile devices primarily
- Touch-friendly interfaces with large buttons
- Support for camera-based barcode scanning
- Offline capabilities with background sync

REAL-TIME REQUIREMENTS:
- Multiple users may access same inventory simultaneously
- Implement optimistic UI updates
- Use WebSocket for live stock level changes
- Handle conflicts gracefully with user feedback

AUDIT REQUIREMENTS:
- Track all stock movements with timestamps
- Record user attribution for all changes
- Support reason codes for adjustments
- Maintain complete audit trail for compliance
```

### For ERP Integration Features

```
You're building ERP integration capabilities for LogiVox. Key considerations:

INTEGRATION PATTERNS:
- Design pluggable architecture for multiple ERP systems
- Support both real-time and batch synchronization
- Implement robust error handling and retry mechanisms
- Provide data mapping and transformation capabilities

TARGET ERP SYSTEMS:
- SAP Business One (REST APIs)
- Oracle NetSuite (SOAP/REST APIs)
- Microsoft Dynamics 365 (OData APIs)
- QuickBooks Enterprise (XML/REST APIs)

DATA FLOW:
- Bidirectional sync between LogiVox and ERP
- Conflict resolution with business rule priorities
- Comprehensive logging for troubleshooting
- Health monitoring with alerting systems
```

### For Supplier Portal Features

```
You're developing supplier collaboration features for LogiVox:

SUPPLIER EXPERIENCE:
- Dedicated login portal separate from main app
- Purchase order management and confirmation
- Inventory visibility based on permissions
- Communication tools for order updates

PROCUREMENT WORKFLOW:
- Automated reorder point notifications
- Approval workflow for purchase orders
- Delivery tracking and confirmation
- Invoice matching and processing

PERFORMANCE ANALYTICS:
- Supplier delivery time tracking
- Quality metrics and scorecards
- Cost analysis and comparison tools
- Performance-based recommendations
```

## Code Generation Prompts

### For React Components

```
Generate React components for LogiVox following these patterns:

COMPONENT STRUCTURE:
- Use TypeScript with strict typing
- Implement proper props interfaces
- Include error boundaries and loading states
- Support mobile-responsive design with Tailwind CSS

EXAMPLE PATTERN:
interface ComponentProps {
  organizationId: string;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

export default function Component({ organizationId, onSuccess, onError }: ComponentProps) {
  // State management with proper typing
  // Error handling with user feedback
  // Mobile-optimized JSX with Tailwind classes
  // WebSocket integration for real-time updates
}

REQUIREMENTS:
- Always scope data by organizationId for multi-tenancy
- Include proper error handling and loading states
- Use semantic HTML for accessibility
- Implement touch-friendly interfaces (min 44px touch targets)
```

### For API Endpoints

```
Create API endpoints for LogiVox following these standards:

ROUTE STRUCTURE:
- Use RESTful conventions with proper HTTP methods
- Include authentication and authorization middleware
- Implement comprehensive input validation
- Return consistent response formats

EXAMPLE PATTERN:
router.post('/api/resource',
  authenticateToken,
  requirePermission('resource:create'),
  validateInput,
  async (req, res) => {
    try {
      // Scope operations by user's organizationId
      const result = await service.createResource({
        ...req.body,
        organizationId: req.user.organizationId
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'Resource created successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

SECURITY REQUIREMENTS:
- Validate JWT tokens on all protected routes
- Check user permissions for each operation
- Sanitize and validate all inputs
- Include rate limiting for API protection
```

### For Database Operations

```
Implement database operations for LogiVox using these Prisma patterns:

QUERY PATTERNS:
- Always scope queries by organizationId for multi-tenancy
- Use proper relations and includes
- Implement efficient pagination
- Add appropriate database indexes

EXAMPLE PATTERN:
export async function getInventoryItems(params: {
  organizationId: string;
  warehouseId?: string;
  page: number;
  limit: number;
}) {
  const where = {
    organizationId: params.organizationId,
    ...(params.warehouseId && { warehouseId: params.warehouseId })
  };

  const [items, total] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      include: {
        warehouse: { select: { name: true } },
        category: { select: { name: true } }
      },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      orderBy: { name: 'asc' }
    }),
    prisma.inventoryItem.count({ where })
  ]);

  return { items, total };
}

PERFORMANCE REQUIREMENTS:
- Use efficient queries with proper indexes
- Implement pagination for large datasets
- Use transactions for related operations
- Include soft deletes for audit trails
```

## Testing Prompts

### For Component Testing

```
Create comprehensive tests for LogiVox React components:

TESTING REQUIREMENTS:
- Test user interactions and accessibility
- Mock API calls and WebSocket connections
- Test responsive behavior on mobile
- Include error states and loading scenarios

TEST STRUCTURE:
- Use React Testing Library for user-centric tests
- Mock authentication and organization context
- Test real-time update scenarios
- Verify mobile-friendly interactions

EXAMPLE AREAS:
- Form validation and submission
- Data loading and error handling
- Real-time updates via WebSocket
- Mobile touch interactions
- Permission-based UI changes
```

### For API Testing

```
Create integration tests for LogiVox API endpoints:

TEST REQUIREMENTS:
- Test authentication and authorization
- Verify multi-tenant data isolation
- Test input validation and error handling
- Include performance and load testing

TEST PATTERNS:
- Set up test database with proper isolation
- Create test users with different roles
- Mock external ERP system calls
- Test concurrent access scenarios

COVERAGE AREAS:
- CRUD operations for all resources
- Permission checks for different user roles
- Multi-tenant data isolation verification
- Error handling and edge cases
```

## Troubleshooting Prompts

### For Performance Issues

```
When troubleshooting LogiVox performance issues:

INVESTIGATION AREAS:
1. Database query optimization (check Prisma query logs)
2. Frontend bundle size and lazy loading
3. WebSocket connection efficiency
4. Mobile device performance

OPTIMIZATION STRATEGIES:
- Add database indexes for common queries
- Implement efficient pagination patterns
- Use React.memo for expensive components
- Optimize images and assets for mobile

MONITORING TOOLS:
- Check database query performance
- Monitor WebSocket connection counts
- Analyze frontend bundle analyzer reports
- Use mobile device testing tools
```

### For Multi-Tenant Issues

```
When debugging multi-tenant problems in LogiVox:

DATA ISOLATION CHECKS:
1. Verify organizationId is included in all queries
2. Check user authentication and token validation
3. Ensure API responses don't leak cross-tenant data
4. Validate frontend state management for organization context

COMMON ISSUES:
- Missing organizationId filters in database queries
- Frontend components not respecting organization context
- WebSocket events broadcasting to wrong tenants
- Cache invalidation across organization boundaries

DEBUGGING STEPS:
- Log all database queries with organizationId
- Verify JWT token contains correct organization data
- Check WebSocket room management for tenant isolation
- Validate API response data scoping
```

## Best Practices Reminders

```
ALWAYS REMEMBER FOR LOGIVOX:

1. MULTI-TENANCY: Every feature must work across multiple organizations
2. MOBILE-FIRST: Warehouse staff primarily use mobile devices
3. REAL-TIME: Inventory changes should update across all connected users
4. SECURITY: Validate permissions at both API and UI levels
5. PERFORMANCE: Optimize for 1000+ inventory items per warehouse
6. AUDIT: Track all changes with user attribution and timestamps
7. OFFLINE: Support offline operations with background sync
8. SCALABILITY: Design for warehouses with 10 to 10,000 products

These principles guide every technical decision in LogiVox development.
```
