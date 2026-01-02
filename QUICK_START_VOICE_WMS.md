# Quick Start: Voice-Enabled WMS Implementation

**Status**: Ready to Code 🚀  
**Current Phase**: Month 1, Week 1  
**Next Steps**: Begin building immediately

---

## 🎯 What We're Building

**LogiVox Voice-Enabled WMS** - The world's first warehouse management system with voice control built into every operation, not bolted on as an afterthought.

### Why This Matters
- **Hands-free**: Warehouse workers keep hands free for handling products
- **Eyes-free**: Workers look at products, not screens
- **3x faster**: Voice input is faster than typing on mobile devices
- **30% fewer errors**: Voice confirmation reduces picking/packing mistakes
- **Accessibility**: Works for all abilities
- **Safety**: No need to handle devices in hazardous situations

---

## ✅ What We Already Have (Built-In)

### Current Voice System
Located in: `apps/web/src/lib/voice-control.ts` and `apps/web/src/components/voice-control.tsx`

**Already Working**:
- ✅ Web Speech API integration (FREE browser API)
- ✅ 25+ basic voice commands (navigation, search, actions)
- ✅ Voice Control UI component (floating widget)
- ✅ Microphone permission handling
- ✅ Real-time transcript display
- ✅ Confidence scoring
- ✅ Screen reader compatibility
- ✅ Keyboard shortcuts (Ctrl+Shift+V)
- ✅ Error handling
- ✅ Command help system

**Voice Commands Working Now**:
- Navigation: "go to inventory", "open reports", "go to dashboard"
- Search: "find product {name}", "search customer {name}"
- Actions: "refresh", "help", "stop listening"

### Current WMS Features
- ✅ Core authentication & authorization
- ✅ Multi-tenant architecture
- ✅ Basic inventory management
- ✅ Location tracking
- ✅ Stock booking
- ✅ Purchase orders
- ✅ Sales orders
- ✅ Goods receipt notes
- ✅ Basic picking & packing
- ✅ Reporting framework

---

## 🚀 Phase 1: Week 1 Implementation Tasks

### Day 1-2: Enhanced Voice Engine Foundation

#### Task 1.1: Upgrade Voice Engine for Complex Workflows

**File**: `apps/web/src/lib/voice-control.ts`

**What to Add**:

```typescript
// Add these new interfaces at the top

interface VoiceWorkflowContext {
  workflowType: 'receiving' | 'putaway' | 'picking' | 'cycle-count' | 'qc' | 'packing';
  currentStep: number;
  totalSteps: number;
  data: Record<string, any>;
  requiresConfirmation: boolean;
}

interface VoiceConfirmationDialog {
  message: string;
  expectedResponses: string[]; // e.g., ["yes", "confirm", "correct"]
  cancelResponses: string[];   // e.g., ["no", "cancel", "incorrect"]
  onConfirm: () => void;
  onCancel: () => void;
  timeout?: number; // Auto-cancel after X seconds
}

interface VoiceFeedbackConfig {
  audio: {
    success: string;      // URL or beep pattern
    error: string;
    warning: string;
    info: string;
  };
  speech: {
    enabled: boolean;
    rate: number;         // 0.5 - 2.0
    pitch: number;        // 0.0 - 2.0
    volume: number;       // 0.0 - 1.0
    voice: string | null; // Preferred voice name
  };
  haptic: {
    enabled: boolean;
    patterns: {
      success: number[];
      error: number[];
      warning: number[];
    };
  };
}

// Extend VoiceControlEngine class with new methods

class VoiceControlEngine {
  private currentWorkflow: VoiceWorkflowContext | null = null;
  private pendingConfirmation: VoiceConfirmationDialog | null = null;
  private feedbackConfig: VoiceFeedbackConfig;
  private speechSynthesis: SpeechSynthesis | null = null;
  
  // ... existing code ...
  
  /**
   * Start a multi-step workflow
   */
  startWorkflow(workflowType: VoiceWorkflowContext['workflowType'], initialData?: Record<string, any>): void {
    this.currentWorkflow = {
      workflowType,
      currentStep: 0,
      totalSteps: this.getWorkflowSteps(workflowType),
      data: initialData || {},
      requiresConfirmation: true
    };
    
    this.speak(`Starting ${workflowType} workflow. ${this.getNextStepInstruction()}`);
    this.updateState({ 
      error: null,
      lastCommand: `workflow:${workflowType}:started`
    });
  }
  
  /**
   * Progress to next step in workflow
   */
  nextWorkflowStep(data?: Record<string, any>): void {
    if (!this.currentWorkflow) {
      this.speak('No active workflow');
      return;
    }
    
    if (data) {
      this.currentWorkflow.data = { ...this.currentWorkflow.data, ...data };
    }
    
    this.currentWorkflow.currentStep++;
    
    if (this.currentWorkflow.currentStep >= this.currentWorkflow.totalSteps) {
      this.completeWorkflow();
    } else {
      this.speak(this.getNextStepInstruction());
    }
  }
  
  /**
   * Complete current workflow
   */
  completeWorkflow(): void {
    if (!this.currentWorkflow) return;
    
    const workflow = this.currentWorkflow;
    this.currentWorkflow = null;
    
    this.speak(`${workflow.workflowType} workflow complete`);
    this.playSuccess();
    
    // Emit workflow completion event
    window.dispatchEvent(new CustomEvent('voice-workflow-complete', {
      detail: { workflowType: workflow.workflowType, data: workflow.data }
    }));
  }
  
  /**
   * Request confirmation for critical operations
   */
  requestConfirmation(dialog: VoiceConfirmationDialog): void {
    this.pendingConfirmation = dialog;
    this.speak(dialog.message);
    
    if (dialog.timeout) {
      setTimeout(() => {
        if (this.pendingConfirmation === dialog) {
          this.speak('Confirmation timeout. Cancelled.');
          dialog.onCancel();
          this.pendingConfirmation = null;
        }
      }, dialog.timeout);
    }
  }
  
  /**
   * Handle confirmation response
   */
  private handleConfirmation(transcript: string): boolean {
    if (!this.pendingConfirmation) return false;
    
    const normalized = transcript.toLowerCase().trim();
    
    if (this.pendingConfirmation.expectedResponses.some(r => normalized.includes(r))) {
      this.pendingConfirmation.onConfirm();
      this.pendingConfirmation = null;
      this.playSuccess();
      return true;
    }
    
    if (this.pendingConfirmation.cancelResponses.some(r => normalized.includes(r))) {
      this.pendingConfirmation.onCancel();
      this.pendingConfirmation = null;
      this.playError();
      return true;
    }
    
    this.speak('Please say yes or no');
    return true;
  }
  
  /**
   * Text-to-speech feedback
   */
  speak(text: string): void {
    if (!this.speechSynthesis || !this.feedbackConfig.speech.enabled) {
      console.log('[Voice] Would speak:', text);
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this.feedbackConfig.speech.rate;
    utterance.pitch = this.feedbackConfig.speech.pitch;
    utterance.volume = this.feedbackConfig.speech.volume;
    
    if (this.feedbackConfig.speech.voice) {
      const voices = this.speechSynthesis.getVoices();
      const voice = voices.find(v => v.name === this.feedbackConfig.speech.voice);
      if (voice) utterance.voice = voice;
    }
    
    this.speechSynthesis.speak(utterance);
  }
  
  /**
   * Audio feedback (beeps)
   */
  playSuccess(): void {
    this.playAudioFeedback('success');
  }
  
  playError(): void {
    this.playAudioFeedback('error');
  }
  
  playWarning(): void {
    this.playAudioFeedback('warning');
  }
  
  private playAudioFeedback(type: 'success' | 'error' | 'warning' | 'info'): void {
    // Create simple beep using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different frequencies for different feedback types
    const frequencies = {
      success: 800,  // High pleasant tone
      error: 200,    // Low buzz
      warning: 600,  // Medium tone
      info: 400
    };
    
    oscillator.frequency.value = frequencies[type];
    oscillator.type = type === 'error' ? 'sawtooth' : 'sine';
    
    gainNode.gain.value = 0.3;
    oscillator.start();
    
    setTimeout(() => {
      oscillator.stop();
    }, type === 'error' ? 300 : 150);
  }
  
  /**
   * Haptic feedback (mobile devices)
   */
  vibrate(pattern: number[]): void {
    if ('vibrate' in navigator && this.feedbackConfig.haptic.enabled) {
      navigator.vibrate(pattern);
    }
  }
  
  /**
   * Get instruction for next step in workflow
   */
  private getNextStepInstruction(): string {
    if (!this.currentWorkflow) return '';
    
    const { workflowType, currentStep } = this.currentWorkflow;
    
    // Workflow-specific instructions
    const instructions: Record<string, string[]> = {
      'receiving': [
        'Scan the purchase order barcode or say the P O number',
        'Scan the item barcode',
        'Tell me the quantity received',
        'Say the lot number if applicable',
        'Say the expiry date if applicable',
        'Complete receiving or scan next item'
      ],
      'cycle-count': [
        'Navigate to the location',
        'Tell me what you count',
        'Move to next location or complete count'
      ],
      'picking': [
        'Navigate to the pick location',
        'Tell me the quantity picked',
        'Scan the item to verify',
        'Place in tote and move to next pick'
      ]
      // ... more workflows
    };
    
    return instructions[workflowType]?.[currentStep] || 'Continue with next step';
  }
  
  private getWorkflowSteps(workflowType: string): number {
    const steps: Record<string, number> = {
      'receiving': 6,
      'cycle-count': 3,
      'picking': 4,
      'putaway': 3,
      'packing': 5,
      'qc': 4
    };
    return steps[workflowType] || 5;
  }
}

// Export helper functions
export function startReceivingWorkflow(poNumber: string) {
  const engine = getVoiceEngineInstance();
  engine.startWorkflow('receiving', { poNumber });
}

export function startCycleCountWorkflow() {
  const engine = getVoiceEngineInstance();
  engine.startWorkflow('cycle-count');
}

export function startPickingWorkflow(orderId: string) {
  const engine = getVoiceEngineInstance();
  engine.startWorkflow('picking', { orderId });
}
```

**Testing**:
```bash
# Test voice feedback
npm run dev
# Open http://localhost:3000
# Click voice control button
# Say "start receiving P O 12345"
# Listen for spoken response and beep
```

---

#### Task 1.2: Create Voice Workflow Components

**New File**: `apps/web/src/components/voice/VoiceWorkflow.tsx`

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { useVoiceControl } from '@/lib/voice-control';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, Mic } from 'lucide-react';

interface VoiceWorkflowProps {
  workflowType: string;
  onComplete?: (data: Record<string, any>) => void;
}

export function VoiceWorkflow({ workflowType, onComplete }: VoiceWorkflowProps) {
  const { transcript, listening } = useVoiceControl();
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<string[]>([]);
  const [workflowData, setWorkflowData] = useState<Record<string, any>>({});
  
  useEffect(() => {
    // Listen for workflow events
    const handleWorkflowComplete = (event: CustomEvent) => {
      if (onComplete) {
        onComplete(event.detail.data);
      }
    };
    
    window.addEventListener('voice-workflow-complete' as any, handleWorkflowComplete);
    
    return () => {
      window.removeEventListener('voice-workflow-complete' as any, handleWorkflowComplete);
    };
  }, [onComplete]);
  
  const getWorkflowSteps = (type: string): string[] => {
    const workflowSteps: Record<string, string[]> = {
      receiving: [
        'Scan or say PO number',
        'Scan item barcode',
        'Say quantity received',
        'Say lot number (if needed)',
        'Say expiry date (if needed)',
        'Complete or next item'
      ],
      'cycle-count': [
        'Navigate to location',
        'Count and say quantity',
        'Next location or complete'
      ],
      picking: [
        'Go to pick location',
        'Say quantity picked',
        'Scan to verify',
        'Next pick or complete'
      ]
    };
    return workflowSteps[type] || [];
  };
  
  useEffect(() => {
    setSteps(getWorkflowSteps(workflowType));
  }, [workflowType]);
  
  const progress = steps.length > 0 ? (currentStep / steps.length) * 100 : 0;
  
  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mic className={`h-5 w-5 ${listening ? 'text-red-500 animate-pulse' : 'text-muted-foreground'}`} />
            {workflowType.charAt(0).toUpperCase() + workflowType.slice(1)} Workflow
          </CardTitle>
          <Badge variant={listening ? 'default' : 'secondary'}>
            {listening ? 'Listening' : 'Ready'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span className="font-medium">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          <Progress value={progress} />
        </div>
        
        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start gap-3">
              {index < currentStep ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              ) : index === currentStep ? (
                <Circle className="h-5 w-5 text-blue-600 mt-0.5 fill-current" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground mt-0.5" />
              )}
              <div className="flex-1">
                <div className={`text-sm ${
                  index === currentStep 
                    ? 'font-medium text-foreground' 
                    : index < currentStep 
                      ? 'text-muted-foreground line-through' 
                      : 'text-muted-foreground'
                }`}>
                  {step}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Current transcript */}
        {listening && transcript && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">You said:</div>
            <div className="text-sm font-medium">{transcript}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

### Day 3-4: Database Schema for Core Inventory

#### Task 2.1: Extend Prisma Schema

**File**: `prisma/schema.prisma`

**Add these models** (append to existing schema):

```prisma
// ==========================================
// WAREHOUSE STRUCTURE & LOCATION MANAGEMENT
// ==========================================

model Warehouse {
  id                String    @id @default(cuid())
  code              String    @unique
  name              String
  type              WarehouseType @default(DISTRIBUTION_CENTER)
  
  // Address
  addressLine1      String
  addressLine2      String?
  city              String
  state             String
  zipCode           String
  country           String    @default("US")
  timezone          String    @default("America/New_York")
  
  // Capacity
  totalSquareFeet   Float?
  usableSquareFeet  Float?
  maxPalletCount    Int?
  currentPalletCount Int      @default(0)
  
  // Configuration
  temperatureControlled Boolean @default(false)
  temperatureMin    Float?
  temperatureMax    Float?
  hazmatCertified   Boolean @default(false)
  securityLevel     SecurityLevel @default(STANDARD)
  
  // Voice settings
  voiceEnabled      Boolean @default(true)
  voiceLanguage     String @default("en-US")
  voiceConfirmation Boolean @default(true)
  
  // Status
  isActive          Boolean @default(true)
  
  // Relations
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id])
  zones             Zone[]
  locations         Location[]
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([organizationId])
  @@index([code])
  @@map("warehouses")
}

model Zone {
  id                String    @id @default(cuid())
  code              String
  name              String
  type              ZoneType
  description       String?
  
  // Hierarchy
  warehouseId       String
  warehouse         Warehouse @relation(fields: [warehouseId], references: [id], onDelete: Cascade)
  parentZoneId      String?
  parentZone        Zone? @relation("ZoneHierarchy", fields: [parentZoneId], references: [id])
  childZones        Zone[] @relation("ZoneHierarchy")
  
  // Physical attributes
  aisles            Aisle[]
  
  // Zone characteristics
  temperatureControlled Boolean @default(false)
  allowsMixedSKU    Boolean @default(true)
  pickingPriority   Int @default(100)
  
  // Constraints
  allowedStorageTypes String[] // BULK, PICK_FACE, RESERVE, QUARANTINE
  restrictions      Json? // Additional rules
  
  isActive          Boolean @default(true)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@unique([warehouseId, code])
  @@index([warehouseId])
  @@index([type])
  @@map("zones")
}

model Aisle {
  id                String    @id @default(cuid())
  code              String
  name              String
  description       String?
  
  zoneId            String
  zone              Zone @relation(fields: [zoneId], references: [id], onDelete: Cascade)
  
  racks             Rack[]
  
  // Picking optimization
  pickingSequence   Int
  preferredDirection PickDirection @default(FORWARD)
  
  isActive          Boolean @default(true)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@unique([zoneId, code])
  @@index([zoneId])
  @@map("aisles")
}

model Rack {
  id                String    @id @default(cuid())
  code              String
  
  aisleId           String
  aisle             Aisle @relation(fields: [aisleId], references: [id], onDelete: Cascade)
  
  bays              Bay[]
  
  // Physical attributes
  side              RackSide
  position          Int
  height            Float?
  
  isActive          Boolean @default(true)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@unique([aisleId, code])
  @@index([aisleId])
  @@map("racks")
}

model Bay {
  id                String    @id @default(cuid())
  code              String
  
  rackId            String
  rack              Rack @relation(fields: [rackId], references: [id], onDelete: Cascade)
  
  shelves           Shelf[]
  
  // Physical attributes
  level             Int
  position          Int
  
  isActive          Boolean @default(true)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@unique([rackId, code])
  @@index([rackId])
  @@map("bays")
}

model Shelf {
  id                String    @id @default(cuid())
  code              String
  
  bayId             String
  bay               Bay @relation(fields: [bayId], references: [id], onDelete: Cascade)
  
  bins              Bin[]
  
  // Physical attributes
  height            Float
  width             Float
  depth             Float
  maxWeight         Float?
  
  isActive          Boolean @default(true)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@unique([bayId, code])
  @@index([bayId])
  @@map("shelves")
}

model Bin {
  id                String    @id @default(cuid())
  code              String
  
  shelfId           String
  shelf             Shelf @relation(fields: [shelfId], references: [id], onDelete: Cascade)
  
  // Physical attributes
  position          Int
  barcode           String?
  
  isActive          Boolean @default(true)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@unique([shelfId, code])
  @@index([shelfId])
  @@map("bins")
}

model Location {
  id                String    @id @default(cuid())
  code              String    @unique
  barcode           String?   @unique
  
  // Full hierarchical path for easy lookup
  warehouseId       String
  warehouse         Warehouse @relation(fields: [warehouseId], references: [id], onDelete: Cascade)
  fullPath          String    // e.g., "WH01-A-01-R-02-B-03-S-02-BIN-01"
  
  // Location type
  locationType      LocationType
  storageType       StorageType
  
  // Capacity
  maxVolumeCubicFt  Float?
  maxWeightLbs      Float?
  maxPallets        Int?
  currentPallets    Int @default(0)
  currentVolume     Float @default(0)
  currentWeight     Float @default(0)
  
  // Status
  status            LocationStatus @default(AVAILABLE)
  isPickFace        Boolean @default(false)
  isReserve         Boolean @default(false)
  
  // Restrictions
  allowMixedSKU     Boolean @default(true)
  allowMixedLot     Boolean @default(false)
  temperatureZone   String?
  hazmatCompatible  Boolean @default(false)
  
  // Optimization
  pickingSequence   Int?
  velocity          LocationVelocity @default(MEDIUM)
  lastPickedAt      DateTime?
  pickCount         Int @default(0)
  
  // Inventory in this location
  inventory         InventoryLocation[]
  
  // Voice-specific
  voiceFriendlyName String? // e.g., "Rack Alpha One Two"
  voicePhoneticCode String? // For difficult pronunciations
  
  // Relationships
  suggestedForPutaway ReceivingLine[] @relation("SuggestedPutaway")
  actualPutaways      ReceivingLine[] @relation("ActualPutaway")
  
  isActive          Boolean @default(true)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([warehouseId])
  @@index([locationType])
  @@index([status])
  @@index([isPickFace])
  @@index([barcode])
  @@index([fullPath])
  @@map("locations")
}

// Inventory location tracking (many-to-many with additional data)
model InventoryLocation {
  id                String    @id @default(cuid())
  
  inventoryItemId   String
  inventoryItem     InventoryItem @relation(fields: [inventoryItemId], references: [id], onDelete: Cascade)
  
  locationId        String
  location          Location @relation(fields: [locationId], references: [id], onDelete: Cascade)
  
  quantity          Float
  quantityUnit      String
  
  // Tracking
  lotNumber         String?
  serialNumber      String?
  expiryDate        DateTime?
  receivedDate      DateTime
  
  // Status
  status            InventoryStatus @default(AVAILABLE)
  
  // Reservation
  allocatedQuantity Float @default(0)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@unique([inventoryItemId, locationId, lotNumber, serialNumber])
  @@index([locationId])
  @@index([inventoryItemId])
  @@index([status])
  @@index([expiryDate])
  @@index([lotNumber])
  @@index([serialNumber])
  @@map("inventory_locations")
}

// Enums
enum WarehouseType {
  DISTRIBUTION_CENTER
  FULFILLMENT_CENTER
  COLD_STORAGE
  CROSS_DOCK
  RETAIL_STORE
  MANUFACTURING
  THIRD_PARTY_LOGISTICS
}

enum ZoneType {
  RECEIVING
  STAGING
  RESERVE_STORAGE
  PICK_FACE
  PACKING
  SHIPPING
  RETURNS
  QUARANTINE
  VALUE_ADDED_SERVICES
  KITTING
  CROSS_DOCK
}

enum LocationType {
  DOCK_DOOR
  RECEIVING_AREA
  STAGING_AREA
  BULK_STORAGE
  PALLET_RACK
  CARTON_FLOW
  PICK_FACE
  RESERVE
  PACKING_STATION
  SHIPPING_LANE
  QUARANTINE
  RETURNS_PROCESSING
  KITTING_STATION
}

enum StorageType {
  FLOOR
  PALLET_RACK
  CANTILEVER
  DRIVE_IN
  PUSH_BACK
  CARTON_FLOW
  MEZZANINE
  MOBILE_RACK
  VERTICAL_LIFT
  CAROUSEL
}

enum LocationStatus {
  AVAILABLE
  OCCUPIED
  FULL
  RESERVED
  BLOCKED
  MAINTENANCE
  DAMAGED
}

enum LocationVelocity {
  VERY_HIGH  // A+ picks
  HIGH       // A picks
  MEDIUM     // B picks
  LOW        // C picks
  VERY_LOW   // D picks
}

enum InventoryStatus {
  AVAILABLE
  ALLOCATED
  IN_TRANSIT
  QUARANTINE
  DAMAGED
  EXPIRED
  ON_HOLD
  RESERVED
}

enum RackSide {
  LEFT
  RIGHT
}

enum PickDirection {
  FORWARD
  REVERSE
  BIDIRECTIONAL
}

enum SecurityLevel {
  STANDARD
  CONTROLLED
  HIGH_SECURITY
  MAXIMUM_SECURITY
}
```

**Run migrations**:
```bash
npx prisma format
npx prisma generate
npx prisma migrate dev --name add_wms_warehouse_structure
```

---

### Day 5: Create Seed Data & Test APIs

#### Task 3.1: Create Seed Data

**File**: `prisma/seed-wms.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedWMS() {
  console.log('🌱 Seeding WMS data...');
  
  // Create test warehouse
  const warehouse = await prisma.warehouse.create({
    data: {
      code: 'WH001',
      name: 'Main Distribution Center',
      type: 'DISTRIBUTION_CENTER',
      addressLine1: '123 Warehouse Way',
      city: 'Commerce City',
      state: 'CA',
      zipCode: '90001',
      country: 'US',
      timezone: 'America/Los_Angeles',
      totalSquareFeet: 100000,
      usableSquareFeet: 85000,
      maxPalletCount: 5000,
      voiceEnabled: true,
      voiceLanguage: 'en-US',
      organizationId: 'YOUR_ORG_ID_HERE' // Replace with actual org ID
    }
  });
  
  console.log('✅ Created warehouse:', warehouse.code);
  
  // Create zones
  const receivingZone = await prisma.zone.create({
    data: {
      code: 'RCV',
      name: 'Receiving Zone',
      type: 'RECEIVING',
      warehouseId: warehouse.id,
      pickingPriority: 1,
      allowsMixedSKU: true
    }
  });
  
  const pickFaceZone = await prisma.zone.create({
    data: {
      code: 'PICK',
      name: 'Pick Face Zone',
      type: 'PICK_FACE',
      warehouseId: warehouse.id,
      pickingPriority: 100,
      allowsMixedSKU: false
    }
  });
  
  console.log('✅ Created zones');
  
  // Create aisles in pick face zone
  const aisleA = await prisma.aisle.create({
    data: {
      code: 'A',
      name: 'Aisle A',
      zoneId: pickFaceZone.id,
      pickingSequence: 1,
      preferredDirection: 'FORWARD'
    }
  });
  
  // Create racks
  const rackA01 = await prisma.rack.create({
    data: {
      code: 'A01',
      aisleId: aisleA.id,
      side: 'LEFT',
      position: 1,
      height: 20
    }
  });
  
  // Create bays
  const bay = await prisma.bay.create({
    data: {
      code: 'B01',
      rackId: rackA01.id,
      level: 1,
      position: 1
    }
  });
  
  // Create shelves
  const shelf = await prisma.shelf.create({
    data: {
      code: 'S01',
      bayId: bay.id,
      height: 2,
      width: 4,
      depth: 2,
      maxWeight: 500
    }
  });
  
  // Create bins and locations
  for (let i = 1; i <= 4; i++) {
    const bin = await prisma.bin.create({
      data: {
        code: `BIN${i.toString().padStart(2, '0')}`,
        shelfId: shelf.id,
        position: i,
        barcode: `WH001-A-A01-B01-S01-BIN${i.toString().padStart(2, '0')}`
      }
    });
    
    await prisma.location.create({
      data: {
        code: `A01-B01-S01-BIN${i.toString().padStart(2, '0')}`,
        barcode: `WH001-A-A01-B01-S01-BIN${i.toString().padStart(2, '0')}`,
        warehouseId: warehouse.id,
        fullPath: `WH001/PICK/A/A01/B01/S01/BIN${i.toString().padStart(2, '0')}`,
        locationType: 'PICK_FACE',
        storageType: 'PALLET_RACK',
        maxVolumeCubicFt: 8,
        maxWeightLbs: 500,
        maxPallets: 1,
        status: 'AVAILABLE',
        isPickFace: true,
        allowMixedSKU: false,
        pickingSequence: i,
        velocity: 'HIGH',
        voiceFriendlyName: `Aisle A zero one, Bay zero one, Shelf zero one, Bin ${i}`
      }
    });
  }
  
  console.log('✅ Created locations');
  console.log('✅ WMS seed data complete!');
}

seedWMS()
  .catch((e) => {
    console.error('❌ Error seeding WMS data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Run seed**:
```bash
ts-node prisma/seed-wms.ts
```

---

## 📝 Summary of Week 1 Deliverables

By end of Week 1, you should have:

✅ **Enhanced Voice Engine**
- Multi-step workflow support
- Confirmation dialogs
- Text-to-speech feedback
- Audio feedback (beeps)
- Haptic feedback (mobile)

✅ **Voice Workflow UI Components**
- Step-by-step progress display
- Real-time transcript
- Visual feedback

✅ **Database Schema**
- Complete warehouse structure (warehouse → zone → aisle → rack → bay → shelf → bin)
- Location management
- Inventory location tracking
- All necessary enums

✅ **Seed Data**
- Test warehouse with full structure
- Sample locations ready for testing

---

## 🎯 Week 2 Preview: Location APIs

Next week you'll build:
- Location CRUD APIs (GET, POST, PUT, DELETE)
- Location search with filters
- Location hierarchy navigation
- Capacity management
- Voice-enabled location lookup

**Success Criteria**:
- Can create warehouses with full structure
- Can search locations by code, barcode, or voice-friendly name
- Can query inventory by location
- Voice command "where is {SKU}" works end-to-end

---

## 🚀 Ready to Start?

1. **Review this plan** with your team
2. **Assign roles** (voice engineer, backend, frontend)
3. **Set up development environment**
4. **Begin Task 1.1** (Enhanced Voice Engine)
5. **Ship something every day!**

---

**Questions? Issues? Need help?**
- Review [VOICE_ENABLED_WMS_TRANSFORMATION_PLAN.md](./VOICE_ENABLED_WMS_TRANSFORMATION_PLAN.md) for overall architecture
- Review [VOICE_WMS_EXECUTION_ROADMAP.md](./VOICE_WMS_EXECUTION_ROADMAP.md) for full 12-month plan
- Check existing voice implementation in `apps/web/src/lib/voice-control.ts`

**Let's build the future of warehouse management!** 🎤📦🚀
