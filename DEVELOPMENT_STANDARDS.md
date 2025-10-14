# FlowStock Enterprise Development Standards

## 1. Next-Generation Code Architecture Guidelines

### 1.1 Enterprise Component Organization
```typescript
// ✅ Enterprise-grade component structure with AI integration
components/
├── 📁 ai/                           # AI-powered components
│   ├── SmartRecommendations.tsx     # AI recommendation engine UI
│   ├── PredictiveAnalytics.tsx      # ML-powered analytics
│   ├── IntelligentSearch.tsx        # AI search with NLP
│   └── AutomationRules.tsx          # Smart workflow automation
├── 📁 ui/                           # Advanced UI component library
│   ├── Button.tsx                   # Multi-variant smart buttons
│   ├── Input.tsx                    # Enhanced form inputs
│   ├── Modal.tsx                    # Responsive modal system
│   ├── DataTable.tsx                # Advanced sortable tables
│   ├── Charts.tsx                   # Interactive data visualization
│   └── Scanner.tsx                  # Barcode/QR scanning component
├── 📁 forms/                        # Intelligent form components
│   ├── StockBookingForm.tsx         # Smart stock booking with AI
│   ├── SupplierPortalForm.tsx       # Supplier-facing forms
│   ├── WarehouseConfigForm.tsx      # Multi-warehouse configuration
│   └── ValidationEngine.tsx        # Smart form validation
├── 📁 layout/                       # Multi-tenant layout system
│   ├── AppShell.tsx                 # Main application shell
│   ├── Navigation.tsx               # Intelligent navigation
│   ├── Sidebar.tsx                  # Contextual sidebar
│   ├── Header.tsx                   # Multi-tenant header
│   └── TenantTheme.tsx              # Dynamic theming system
├── 📁 features/                     # Feature-specific components
│   ├── stock-booking/               # Advanced stock management
│   ├── warehouses/                  # Multi-warehouse operations
│   ├── suppliers/                   # Supplier portal integration
│   ├── analytics/                   # Real-time analytics
│   ├── printing/                    # Label printing system
│   ├── integrations/                # ERP integration components
│   └── admin/                       # Multi-tenant administration
├── 📁 mobile/                       # Mobile-optimized components
│   ├── Scanner.tsx                  # Mobile barcode scanning
│   ├── OfflineSync.tsx              # Offline data management
│   ├── TouchInterface.tsx           # Touch-optimized UI
│   └── NotificationHandler.tsx      # Push notification system
└── 📁 realtime/                     # Real-time functionality
    ├── WebSocketProvider.tsx        # WebSocket connection management
    ├── LiveUpdates.tsx              # Real-time data updates
    ├── CollaborationTools.tsx       # Real-time collaboration
    └── NotificationCenter.tsx       # Real-time notifications
```

### 1.2 Advanced TypeScript Standards

#### 1.2.1 Enterprise Interface Definitions
```typescript
// ✅ Enterprise-grade interfaces with comprehensive typing
export interface AdvancedInventoryItem {
  // Core item properties
  id: string;
  sku: string;
  name: string;
  description: string;
  category: ItemCategory;
  
  // Multi-warehouse support
  warehouses: WarehouseInventory[];
  currentLocation: WarehouseLocation;
  reservations: StockReservation[];
  
  // AI/ML enhanced properties
  demandForecast: PredictiveData;
  smartRecommendations: AIRecommendation[];
  qualityScore: QualityMetrics;
  
  // Advanced metadata
  supplierInfo: SupplierDetails;
  labelTemplates: LabelTemplate[];
  integrationData: ERPIntegrationData;
  
  // Audit & compliance
  auditTrail: AuditLogEntry[];
  complianceFlags: ComplianceStatus[];
  
  // Multi-tenant properties
  tenantId: string;
  tenantConfig: TenantConfiguration;
  
  // Timestamps with timezone support
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
  lastSyncAt: ISO8601DateTime;
}

// Advanced type definitions for enterprise features
export interface PredictiveData {
  forecastPeriod: ForecastPeriod;
  predictedDemand: number;
  confidenceScore: number;
  seasonalFactors: SeasonalData[];
  trendAnalysis: TrendData;
  lastUpdated: ISO8601DateTime;
}

export interface AIRecommendation {
  type: 'reorder' | 'relocate' | 'bundle' | 'optimize';
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  recommendation: string;
  expectedBenefit: BenefitMetrics;
  implementationSteps: string[];
  aiModel: string;
  generatedAt: ISO8601DateTime;
}

export interface MultiTenantEntity {
  tenantId: string;
  tenantName: string;
  subscriptionTier: 'starter' | 'professional' | 'enterprise' | 'enterprise_plus';
  featureFlags: Record<string, boolean>;
  customizations: TenantCustomizations;
  billingInfo: BillingInformation;
}
```

#### 1.2.2 Advanced Error Handling
```typescript
// ✅ Comprehensive error handling for enterprise systems
export class FlowStockError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public severity: 'low' | 'medium' | 'high' | 'critical',
    public context?: Record<string, unknown>,
    public tenantId?: string,
    public userId?: string
  ) {
    super(message);
    this.name = 'FlowStockError';
  }
}

export enum ErrorCode {
  // Authentication & Authorization
  INVALID_CREDENTIALS = 'AUTH_001',
  INSUFFICIENT_PERMISSIONS = 'AUTH_002',
  TENANT_ACCESS_DENIED = 'AUTH_003',
  
  // Stock Management
  STOCK_NOT_FOUND = 'STOCK_001',
  INSUFFICIENT_INVENTORY = 'STOCK_002',
  WAREHOUSE_CAPACITY_EXCEEDED = 'STOCK_003',
  
  // ERP Integration
  ERP_CONNECTION_FAILED = 'ERP_001',
  ERP_DATA_SYNC_ERROR = 'ERP_002',
  ERP_AUTHENTICATION_FAILED = 'ERP_003',
  
  // AI/ML
  ML_MODEL_UNAVAILABLE = 'AI_001',
  PREDICTION_FAILED = 'AI_002',
  RECOMMENDATION_ERROR = 'AI_003',
  
  // Printing
  PRINTER_OFFLINE = 'PRINT_001',
  TEMPLATE_INVALID = 'PRINT_002',
  PRINT_QUEUE_FULL = 'PRINT_003',
  
  // System
  DATABASE_ERROR = 'SYS_001',
  NETWORK_ERROR = 'SYS_002',
  RATE_LIMIT_EXCEEDED = 'SYS_003'
}

// Error boundary component for React
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to monitoring service
    logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: 'FlowStockErrorBoundary'
    });
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} />;
    }

    return this.props.children;
  }
}
```

### 1.3 Enterprise State Management Standards

#### 1.3.1 Zustand Store Architecture
```typescript
// ✅ Enterprise-grade state management with Zustand
interface AppStore {
  // Authentication & User Management
  auth: AuthState;
  user: UserProfile;
  tenant: TenantConfiguration;
  
  // Core Business State
  inventory: InventoryState;
  warehouses: WarehouseState;
  suppliers: SupplierState;
  orders: OrderState;
  
  // AI/ML State
  predictions: PredictionState;
  recommendations: RecommendationState;
  
  // UI State
  ui: UIState;
  notifications: NotificationState;
  modals: ModalState;
  
  // Real-time State
  realtime: RealtimeState;
  
  // Offline State
  offline: OfflineState;
  
  // Actions
  actions: AppActions;
}

const useAppStore = create<AppStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        auth: initialAuthState,
        user: initialUserState,
        tenant: initialTenantState,
        inventory: initialInventoryState,
        warehouses: initialWarehouseState,
        suppliers: initialSupplierState,
        orders: initialOrderState,
        predictions: initialPredictionState,
        recommendations: initialRecommendationState,
        ui: initialUIState,
        notifications: initialNotificationState,
        modals: initialModalState,
        realtime: initialRealtimeState,
        offline: initialOfflineState,
        
        // Actions
        actions: createAppActions(set, get)
      })),
      {
        name: 'flowstock-store',
        partialize: (state) => ({
          user: state.user,
          tenant: state.tenant,
          ui: state.ui,
          offline: state.offline
        })
      }
    )
  )
);

// Typed selectors for optimal performance
export const useAuth = () => useAppStore(state => state.auth);
export const useInventory = () => useAppStore(state => state.inventory);
export const useWarehouses = () => useAppStore(state => state.warehouses);
export const useRealtimeUpdates = () => useAppStore(state => state.realtime);
```

#### 1.3.2 React Query Integration
```typescript
// ✅ Advanced data fetching with React Query and enterprise caching
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      retry: (failureCount, error) => {
        if (error instanceof FlowStockError) {
          return error.severity !== 'critical' && failureCount < 3;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        if (error instanceof FlowStockError) {
          notificationService.showError(error.message);
          logError(error);
        }
      }
    }
  }
});

// Advanced query hooks with optimistic updates
export const useInventoryItems = (warehouseId?: string) => {
  const { tenantId } = useAuth();
  
  return useQuery({
    queryKey: ['inventory', tenantId, warehouseId],
    queryFn: () => inventoryService.getItems({ warehouseId, tenantId }),
    enabled: !!tenantId,
    select: (data) => data.filter(item => item.isActive),
    onError: (error) => {
      logError(error, { context: 'inventory-fetch', warehouseId, tenantId });
    }
  });
};

export const useCreateInventoryItem = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useAuth();
  
  return useMutation({
    mutationFn: inventoryService.createItem,
    onMutate: async (newItem) => {
      // Optimistic update
      await queryClient.cancelQueries(['inventory', tenantId]);
      const previousItems = queryClient.getQueryData(['inventory', tenantId]);
      
      queryClient.setQueryData(['inventory', tenantId], (old: InventoryItem[]) => [
        ...old,
        { ...newItem, id: `temp-${Date.now()}`, status: 'creating' }
      ]);
      
      return { previousItems };
    },
    onError: (error, newItem, context) => {
      queryClient.setQueryData(['inventory', tenantId], context?.previousItems);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['inventory', tenantId]);
    }
  });
};
```
  id: string;
  name: string;
  sku: string;
  warehouseId: string;
  organizationId: string;
  currentStock: number;
  minimumStock: number;
  createdAt: Date;
  updatedAt: Date;
}

// ✅ Good: API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ❌ Bad: Generic or unclear naming
interface Item {
  stuff: any;
}
```

#### Function Signatures
```typescript
// ✅ Good: Clear, typed function signatures
async function createInventoryItem(
  data: CreateInventoryItemRequest,
  organizationId: string
): Promise<ApiResponse<InventoryItem>> {
  // Implementation
}

// ❌ Bad: Untyped or unclear functions
function doStuff(data: any): any {
  // Implementation
}
```

### React Component Standards

#### Functional Components with Hooks
```typescript
// ✅ Good: Modern React patterns
interface InventoryListProps {
  warehouseId: string;
  onItemSelect: (item: InventoryItem) => void;
}

export default function InventoryList({ warehouseId, onItemSelect }: InventoryListProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInventoryItems(warehouseId);
  }, [warehouseId]);

  const fetchInventoryItems = async (id: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/inventory?warehouseId=${id}`);
      setItems(response.data);
    } catch (err) {
      setError('Failed to load inventory items');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-4">
      {items.map(item => (
        <InventoryCard 
          key={item.id}
          item={item}
          onClick={() => onItemSelect(item)}
        />
      ))}
    </div>
  );
}
```

### API Route Standards

#### Express Route Structure
```typescript
// ✅ Good: Well-structured API routes
import { Router } from 'express';
import { authenticateToken, requirePermission } from '../middleware/auth';
import { validateInventoryItem } from '../middleware/validation';
import * as inventoryService from '../services/inventoryService';

const router = Router();

// GET /api/inventory
router.get('/', 
  authenticateToken,
  requirePermission('inventory:read'),
  async (req, res) => {
    try {
      const { warehouseId, page = 1, limit = 20 } = req.query;
      const items = await inventoryService.getInventoryItems({
        organizationId: req.user.organizationId,
        warehouseId: warehouseId as string,
        page: Number(page),
        limit: Number(limit)
      });
      
      res.json({
        success: true,
        data: items,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: items.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch inventory items'
      });
    }
  }
);

// POST /api/inventory
router.post('/',
  authenticateToken,
  requirePermission('inventory:write'),
  validateInventoryItem,
  async (req, res) => {
    try {
      const item = await inventoryService.createInventoryItem({
        ...req.body,
        organizationId: req.user.organizationId
      });
      
      res.status(201).json({
        success: true,
        data: item,
        message: 'Inventory item created successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

export default router;
```

### Database Standards

#### Prisma Schema Patterns
```prisma
// ✅ Good: Consistent model definitions
model InventoryItem {
  id            String   @id @default(cuid())
  name          String   @db.VarChar(255)
  sku           String   @unique @db.VarChar(100)
  description   String?  @db.Text
  currentStock  Int      @default(0)
  minimumStock  Int      @default(0)
  maximumStock  Int?
  unitPrice     Decimal  @db.Decimal(10, 2)
  
  // Relationships
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  warehouseId String
  warehouse   Warehouse @relation(fields: [warehouseId], references: [id], onDelete: Cascade)
  
  categoryId String?
  category   Category? @relation(fields: [categoryId], references: [id])
  
  // Audit fields
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?
  updatedBy String?
  
  // Indexes
  @@index([organizationId, warehouseId])
  @@index([sku])
  @@index([name])
  @@map("inventory_items")
}
```

### Error Handling Standards

#### Frontend Error Boundaries
```typescript
// ✅ Good: Comprehensive error boundary
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<
  PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
    // Send to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              We apologize for the inconvenience. Please try refreshing the page.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

#### Backend Error Handling
```typescript
// ✅ Good: Centralized error handling middleware
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error occurred:', err);

  // Prisma errors
  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'A record with this information already exists'
      });
    }
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.message
    });
  }

  // Authentication errors
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  // Default error
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
}
```

### Security Standards

#### Authentication Middleware
```typescript
// ✅ Good: Secure authentication middleware
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    const user = await getUserById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      error: 'Invalid token'
    });
  }
}
```

#### Input Validation
```typescript
// ✅ Good: Input validation middleware
export function validateInventoryItem(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const schema = z.object({
    name: z.string().min(1).max(255),
    sku: z.string().min(1).max(100),
    description: z.string().optional(),
    currentStock: z.number().int().min(0),
    minimumStock: z.number().int().min(0),
    unitPrice: z.number().positive(),
    warehouseId: z.string().cuid()
  });

  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.errors
    });
  }
}
```

### Performance Standards

#### Database Query Optimization
```typescript
// ✅ Good: Optimized database queries
export async function getInventoryItems(params: {
  organizationId: string;
  warehouseId?: string;
  page: number;
  limit: number;
  search?: string;
}) {
  const where = {
    organizationId: params.organizationId,
    ...(params.warehouseId && { warehouseId: params.warehouseId }),
    ...(params.search && {
      OR: [
        { name: { contains: params.search, mode: 'insensitive' } },
        { sku: { contains: params.search, mode: 'insensitive' } }
      ]
    })
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
```

### Testing Standards

#### Component Testing
```typescript
// ✅ Good: Comprehensive component tests
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import InventoryList from '../InventoryList';

describe('InventoryList', () => {
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
    
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };

  test('displays inventory items correctly', async () => {
    const mockItems = [
      { id: '1', name: 'Widget A', sku: 'WGT-001', currentStock: 100 },
      { id: '2', name: 'Widget B', sku: 'WGT-002', currentStock: 50 }
    ];

    render(
      <InventoryList 
        warehouseId="warehouse-1" 
        onItemSelect={jest.fn()} 
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('Widget A')).toBeInTheDocument();
      expect(screen.getByText('Widget B')).toBeInTheDocument();
    });
  });

  test('handles item selection', async () => {
    const onItemSelect = jest.fn();
    
    render(
      <InventoryList 
  });
};
```

## 2. Enterprise Testing Standards

### 2.1 Comprehensive Testing Strategy
```typescript
// ✅ Enterprise testing with React Testing Library and MSW
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { InventoryWidget } from '../InventoryWidget';

// Mock service worker for API testing
const server = setupServer(
  rest.get('/api/inventory/:warehouseId', (req, res, ctx) => {
    return res(
      ctx.json([
        { id: '1', name: 'Widget A', sku: 'WGT-001', quantity: 100 },
        { id: '2', name: 'Widget B', sku: 'WGT-002', quantity: 50 }
      ])
    );
  }),
  
  rest.post('/api/inventory', async (req, res, ctx) => {
    const data = await req.json();
    return res(
      ctx.json({ id: '3', ...data, createdAt: new Date().toISOString() })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Enterprise test utilities
const createTestWrapper = ({ initialState = {}, tenantId = 'test-tenant' } = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider tenantId={tenantId}>
        <ThemeProvider theme={defaultTheme}>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

// Comprehensive component testing
describe('InventoryWidget Enterprise Tests', () => {
  it('should handle multi-tenant data isolation', async () => {
    const tenantAWrapper = createTestWrapper({ tenantId: 'tenant-a' });
    const tenantBWrapper = createTestWrapper({ tenantId: 'tenant-b' });
    
    // Test tenant A
    const { rerender } = render(
      <InventoryWidget warehouseId="warehouse-1" />,
      { wrapper: tenantAWrapper }
    );
    
    await waitFor(() => {
      expect(screen.getByText('Widget A')).toBeInTheDocument();
    });
    
    // Test tenant B isolation
    rerender(<InventoryWidget warehouseId="warehouse-1" />);
    // Should not see tenant A data
  });

  it('should handle offline functionality', async () => {
    // Simulate offline mode
    server.use(
      rest.get('/api/inventory/:warehouseId', (req, res, ctx) => {
        return res.networkError('Network unavailable');
      })
    );
    
    render(
      <InventoryWidget 
        warehouseId="warehouse-1" 
        enableOfflineMode={true}
      />,
      { wrapper: createTestWrapper() }
    );
    
    await waitFor(() => {
      expect(screen.getByText('Working offline')).toBeInTheDocument();
    });
  });

  it('should handle AI predictions and recommendations', async () => {
    server.use(
      rest.get('/api/ai/predictions/:itemId', (req, res, ctx) => {
        return res(
          ctx.json({
            demandForecast: 150,
            confidence: 0.85,
            recommendations: [
              { type: 'reorder', priority: 'high', message: 'Reorder recommended' }
            ]
          })
        );
      })
    );
    
    render(
      <InventoryWidget 
        warehouseId="warehouse-1" 
        enableAIPredictions={true}
      />,
      { wrapper: createTestWrapper() }
    );
    
    await waitFor(() => {
      expect(screen.getByText('AI Prediction: 150 units')).toBeInTheDocument();
      expect(screen.getByText('Reorder recommended')).toBeInTheDocument();
    });
  });
});

// Performance testing with React Testing Library
describe('Performance Tests', () => {
  it('should render large datasets efficiently', async () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: i.toString(),
      name: `Item ${i}`,
      sku: `SKU-${i.toString().padStart(4, '0')}`
    }));
    
    server.use(
      rest.get('/api/inventory/:warehouseId', (req, res, ctx) => {
        return res(ctx.json(largeDataset));
      })
    );
    
    const startTime = performance.now();
    
    render(
      <InventoryWidget warehouseId="warehouse-1" />,
      { wrapper: createTestWrapper() }
    );
    
    await waitFor(() => {
      expect(screen.getByText('Item 999')).toBeInTheDocument();
    });
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(3000); // Should render within 3 seconds
  });
});
```

### 2.2 API Testing Standards
```typescript
// ✅ Comprehensive API testing with Vitest and Supertest
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { setupTestDatabase, teardownTestDatabase } from '../test-utils/database';

describe('Inventory API Enterprise Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });
  
  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('POST /api/inventory', () => {
    it('should create inventory item with multi-tenant isolation', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .set('Authorization', 'Bearer tenant-a-token')
        .send({
          name: 'Test Widget',
          sku: 'TEST-001',
          warehouseId: 'warehouse-1',
          quantity: 100
        })
        .expect(201);
      
      expect(response.body).toMatchObject({
        name: 'Test Widget',
        sku: 'TEST-001',
        tenantId: 'tenant-a'
      });
      
      // Verify tenant isolation
      const tenantBResponse = await request(app)
        .get('/api/inventory')
        .set('Authorization', 'Bearer tenant-b-token')
        .expect(200);
      
      expect(tenantBResponse.body).not.toContainEqual(
        expect.objectContaining({ sku: 'TEST-001' })
      );
    });

    it('should handle ERP integration sync', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .set('Authorization', 'Bearer valid-token')
        .send({
          name: 'ERP Synced Item',
          sku: 'ERP-001',
          erpId: 'oracle-12345',
          syncToERP: true
        })
        .expect(201);
      
      expect(response.body.integrationStatus).toBe('syncing');
      
      // Verify ERP sync was triggered
      // This would be mocked in real tests
      expect(mockERPService.syncItem).toHaveBeenCalledWith(
        expect.objectContaining({ erpId: 'oracle-12345' })
      );
    });

    it('should validate required fields with proper error messages', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .set('Authorization', 'Bearer valid-token')
        .send({
          name: '', // Invalid: empty name
          sku: 'TEST-002'
          // Missing: warehouseId
        })
        .expect(400);
      
      expect(response.body.errors).toEqual([
        { field: 'name', message: 'Name is required and cannot be empty' },
        { field: 'warehouseId', message: 'Warehouse ID is required' }
      ]);
    });
  });

  describe('GraphQL API Tests', () => {
    it('should handle complex queries with nested data', async () => {
      const query = `
        query GetInventoryWithPredictions($warehouseId: ID!) {
          inventory(warehouseId: $warehouseId) {
            id
            name
            sku
            quantity
            predictions {
              demandForecast
              confidence
              nextOrderDate
            }
            warehouse {
              name
              location
            }
            supplier {
              name
              contactInfo
            }
          }
        }
      `;
      
      const response = await request(app)
        .post('/graphql')
        .set('Authorization', 'Bearer valid-token')
        .send({
          query,
          variables: { warehouseId: 'warehouse-1' }
        })
        .expect(200);
      
      expect(response.body.data.inventory).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            predictions: expect.objectContaining({
              demandForecast: expect.any(Number),
              confidence: expect.any(Number)
            }),
            warehouse: expect.objectContaining({
              name: expect.any(String)
            })
          })
        ])
      );
    });
  });
});
```

## 3. Enterprise Security Standards

### 3.1 Authentication & Authorization
```typescript
// ✅ Enterprise authentication with JWT and RBAC
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { RateLimiterRedis } from 'rate-limiter-flexible';

// Rate limiting for authentication endpoints
const authLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'auth_fail',
  points: 5, // Number of attempts
  duration: 300, // Per 5 minutes
  blockDuration: 900 // Block for 15 minutes
});

// Multi-tenant JWT authentication middleware
export const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    // Validate tenant access
    const tenant = await validateTenantAccess(decoded.tenantId);
    if (!tenant.isActive) {
      return res.status(403).json({ error: 'Tenant access suspended' });
    }
    
    // Check subscription limits
    if (await hasExceededSubscriptionLimits(tenant.id, decoded.userId)) {
      return res.status(429).json({ error: 'Subscription limits exceeded' });
    }
    
    // Attach user and tenant context
    req.user = decoded;
    req.tenant = tenant;
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

// Role-based access control
export const requirePermission = (permission: Permission) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userPermissions = await getUserPermissions(req.user.id, req.tenant.id);
      
      if (!userPermissions.includes(permission)) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: permission,
          available: userPermissions
        });
      }
      
      next();
    } catch (error) {
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

// Secure password hashing
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const validatePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeObject = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = validator.escape(value.trim());
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  };
  
  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params);
  
  next();
};
```

### 3.2 Data Protection & Privacy
```typescript
// ✅ Enterprise data protection with encryption
import crypto from 'crypto';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// AES-256-GCM encryption for sensitive data
export class DataEncryption {
  private static readonly algorithm = 'aes-256-gcm';
  private static readonly keyLength = 32;
  private static readonly ivLength = 16;
  private static readonly tagLength = 16;
  
  static encrypt(text: string, key: Buffer): EncryptedData {
    const iv = randomBytes(this.ivLength);
    const cipher = createCipheriv(this.algorithm, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }
  
  static decrypt(data: EncryptedData, key: Buffer): string {
    const iv = Buffer.from(data.iv, 'hex');
    const authTag = Buffer.from(data.authTag, 'hex');
    const decipher = createDecipheriv(this.algorithm, key, iv);
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

// PII data masking for logs and analytics
export const maskSensitiveData = (obj: any): any => {
  const sensitiveFields = ['password', 'ssn', 'creditCard', 'bankAccount', 'token'];
  
  const mask = (value: any, key: string): any => {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      if (typeof value === 'string') {
        return '***REDACTED***';
      }
      return value;
    }
    
    if (typeof value === 'object' && value !== null) {
      const masked: any = {};
      for (const [k, v] of Object.entries(value)) {
        masked[k] = mask(v, k);
      }
      return masked;
    }
    
    return value;
  };
  
  return mask(obj, '');
};

// GDPR compliance utilities
export class GDPRCompliance {
  static async exportUserData(userId: string, tenantId: string): Promise<UserDataExport> {
    const userData = await Promise.all([
      getUserProfile(userId),
      getUserActivityLog(userId),
      getUserPreferences(userId),
      getInventoryInteractions(userId)
    ]);
    
    return {
      exportDate: new Date().toISOString(),
      userId,
      tenantId,
      data: userData,
      format: 'JSON',
      version: '1.0'
    };
  }
  
  static async deleteUserData(userId: string, tenantId: string): Promise<DeletionReport> {
    const deletionTasks = [
      () => deleteUserProfile(userId),
      () => anonymizeActivityLogs(userId),
      () => removeUserPreferences(userId),
      () => clearUserSessions(userId)
    ];
    
    const results = await Promise.allSettled(deletionTasks.map(task => task()));
    
    return {
      deletionDate: new Date().toISOString(),
      userId,
      tenantId,
      tasksCompleted: results.filter(r => r.status === 'fulfilled').length,
      tasksFailed: results.filter(r => r.status === 'rejected').length,
      errors: results
        .filter(r => r.status === 'rejected')
        .map(r => (r as PromiseRejectedResult).reason)
    };
  }
}
```

## 4. Enterprise Performance Standards

### 4.1 Code Optimization Guidelines
```typescript
// ✅ Performance optimization with React.memo and useMemo
import React, { memo, useMemo, useCallback, useState } from 'react';
import { debounce } from 'lodash-es';

// Optimized component with proper memoization
export const InventorySearchWidget = memo<InventorySearchProps>(({ 
  items, 
  onSearch, 
  filters 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Debounced search to avoid excessive API calls
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      onSearch(term);
    }, 300),
    [onSearch]
  );
  
  // Memoized filtered results for large datasets
  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    
    return items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);
  
  // Memoized expensive calculations
  const statistics = useMemo(() => {
    return {
      totalItems: filteredItems.length,
      totalValue: filteredItems.reduce((sum, item) => sum + item.value, 0),
      averageValue: filteredItems.length > 0 
        ? filteredItems.reduce((sum, item) => sum + item.value, 0) / filteredItems.length 
        : 0
    };
  }, [filteredItems]);
  
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  }, [debouncedSearch]);
  
  return (
    <div className="inventory-search-widget">
      <SearchInput 
        value={searchTerm}
        onChange={handleSearchChange}
        placeholder="Search inventory..."
      />
      
      <StatisticsPanel {...statistics} />
      
      <VirtualizedList 
        items={filteredItems}
        renderItem={renderInventoryItem}
        height={400}
        itemHeight={60}
      />
    </div>
  );
});

// Virtualized list for large datasets
const VirtualizedList = memo<VirtualizedListProps>(({ 
  items, 
  renderItem, 
  height, 
  itemHeight 
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(height / itemHeight) + 1,
      items.length
    );
    
    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
      top: (startIndex + index) * itemHeight
    }));
  }, [items, scrollTop, itemHeight, height]);
  
  return (
    <div 
      className="virtualized-list"
      style={{ height, overflow: 'auto' }}
      onScroll={e => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index, top }) => (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              top,
              left: 0,
              right: 0,
              height: itemHeight
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
});
```

### 4.2 Database Performance Standards
```typescript
// ✅ Optimized database queries with proper indexing
import { Prisma } from '@prisma/client';

// Efficient paginated queries with cursor-based pagination
export const getInventoryItems = async ({
  tenantId,
  warehouseId,
  searchTerm,
  cursor,
  limit = 50
}: GetInventoryItemsParams): Promise<PaginatedInventoryItems> => {
  const where: Prisma.InventoryItemWhereInput = {
    tenantId,
    ...(warehouseId && { warehouseId }),
    ...(searchTerm && {
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { sku: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } }
      ]
    })
  };
  
  const items = await prisma.inventoryItem.findMany({
    where,
    include: {
      warehouse: {
        select: { id: true, name: true, location: true }
      },
      supplier: {
        select: { id: true, name: true, contactEmail: true }
      },
      _count: {
        select: { transactions: true, reservations: true }
      }
    },
    orderBy: { updatedAt: 'desc' },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 })
  });
  
  const hasNextPage = items.length > limit;
  if (hasNextPage) items.pop();
  
  return {
    items,
    hasNextPage,
    nextCursor: hasNextPage ? items[items.length - 1].id : null
  };
};

// Bulk operations for performance
export const bulkUpdateInventoryItems = async (
  updates: InventoryItemUpdate[]
): Promise<BatchOperationResult> => {
  const transaction = await prisma.$transaction(async (tx) => {
    const results = await Promise.allSettled(
      updates.map(update => 
        tx.inventoryItem.update({
          where: { id: update.id },
          data: update.data
        })
      )
    );
    
    return results;
  });
  
  const successful = transaction.filter(r => r.status === 'fulfilled');
  const failed = transaction.filter(r => r.status === 'rejected');
  
  return {
    totalOperations: updates.length,
    successful: successful.length,
    failed: failed.length,
    errors: failed.map(f => (f as PromiseRejectedResult).reason)
  };
};

// Database connection optimization
export const optimizedPrismaClient = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
}).$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const start = Date.now();
        const result = await query(args);
        const end = Date.now();
        
        // Log slow queries
        if (end - start > 1000) {
          logger.warn(`Slow query detected: ${model}.${operation} took ${end - start}ms`);
        }
        
        return result;
      }
    }
  }
});
```

## 5. Enterprise Documentation Standards

### 5.1 API Documentation Standards
```typescript
/**
 * @swagger
 * /api/inventory:
 *   post:
 *     summary: Create a new inventory item
 *     description: Creates a new inventory item with multi-tenant isolation and ERP integration
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateInventoryItemRequest'
 *           examples:
 *             basic:
 *               summary: Basic inventory item
 *               value:
 *                 name: "Widget A"
 *                 sku: "WGT-001"
 *                 warehouseId: "warehouse-123"
 *                 quantity: 100
 *             withERP:
 *               summary: Item with ERP integration
 *               value:
 *                 name: "Enterprise Widget"
 *                 sku: "ERP-001"
 *                 warehouseId: "warehouse-123"
 *                 quantity: 500
 *                 erpId: "oracle-12345"
 *                 syncToERP: true
 *     responses:
 *       201:
 *         description: Inventory item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InventoryItem'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       409:
 *         description: SKU already exists
 * 
 * components:
 *   schemas:
 *     CreateInventoryItemRequest:
 *       type: object
 *       required:
 *         - name
 *         - sku
 *         - warehouseId
 *         - quantity
 *       properties:
 *         name:
 *           type: string
 *           description: Display name for the inventory item
 *           minLength: 1
 *           maxLength: 255
 *           example: "Widget A"
 *         sku:
 *           type: string
 *           description: Unique stock keeping unit identifier
 *           pattern: "^[A-Z0-9-]+$"
 *           example: "WGT-001"
 *         warehouseId:
 *           type: string
 *           format: uuid
 *           description: ID of the warehouse where item is stored
 *         quantity:
 *           type: integer
 *           minimum: 0
 *           description: Initial quantity of the item
 *         erpId:
 *           type: string
 *           description: External ERP system identifier
 *         syncToERP:
 *           type: boolean
 *           description: Whether to sync this item to connected ERP system
 *           default: false
 */
```

### 5.2 Component Documentation Standards
```typescript
/**
 * InventorySearchWidget - Enterprise inventory search and filtering component
 * 
 * A high-performance, virtualized search widget for enterprise inventory management
 * with real-time filtering, AI-powered suggestions, and multi-tenant isolation.
 * 
 * @example
 * ```tsx
 * <InventorySearchWidget
 *   warehouseId="warehouse-123"
 *   onItemSelect={(item) => handleItemSelection(item)}
 *   enableAISuggestions={true}
 *   showPredictions={true}
 *   filters={{
 *     category: 'electronics',
 *     minQuantity: 10
 *   }}
 *   virtualizeAfter={100}
 * />
 * ```
 * 
 * @param warehouseId - Warehouse to search within (required for multi-warehouse setups)
 * @param onItemSelect - Callback fired when user selects an inventory item
 * @param enableAISuggestions - Enable AI-powered search suggestions (default: false)
 * @param showPredictions - Show demand predictions and recommendations (default: false)
 * @param filters - Advanced filtering options for search results
 * @param virtualizeAfter - Number of items after which to enable virtualization (default: 50)
 * @param searchDebounceMs - Debounce delay for search input (default: 300ms)
 * 
 * @features
 * - Real-time search with debounced input
 * - Virtualized rendering for large datasets (1000+ items)
 * - AI-powered search suggestions and autocomplete
 * - Advanced filtering by category, supplier, quantity, etc.
 * - Demand predictions and intelligent recommendations
 * - Multi-tenant data isolation
 * - Offline-first functionality with sync indicators
 * - Accessibility compliant (WCAG 2.1 AA)
 * - Mobile-responsive design
 * 
 * @performance
 * - Handles 10,000+ inventory items efficiently
 * - Search results appear within 150ms
 * - Virtual scrolling reduces DOM nodes by 90%
 * - Optimistic updates for immediate feedback
 * 
 * @accessibility
 * - Full keyboard navigation support
 * - Screen reader announcements for search results
 * - High contrast mode support
 * - Focus management for modal interactions
 * 
 * @testing
 * ```typescript
 * // Unit test example
 * test('should filter inventory items by search term', async () => {
 *   render(<InventorySearchWidget warehouseId="test-warehouse" />);
 *   
 *   const searchInput = screen.getByRole('searchbox');
 *   fireEvent.change(searchInput, { target: { value: 'widget' } });
 *   
 *   await waitFor(() => {
 *     expect(screen.getByText('Widget A')).toBeInTheDocument();
 *     expect(screen.queryByText('Different Item')).not.toBeInTheDocument();
 *   });
 * });
 * ```
 */
export interface InventorySearchWidgetProps {
  warehouseId: string;
  onItemSelect?: (item: InventoryItem) => void;
  enableAISuggestions?: boolean;
  showPredictions?: boolean;
  filters?: InventoryFilters;
  virtualizeAfter?: number;
  searchDebounceMs?: number;
  className?: string;
  'data-testid'?: string;
}
```

This comprehensive enterprise development standards document ensures FlowStock maintains the highest quality, security, and performance standards throughout its development lifecycle. These standards support the platform's evolution into a next-generation enterprise solution while maintaining developer productivity and code maintainability.

These standards ensure consistent, maintainable, and scalable code across the FlowStock platform.