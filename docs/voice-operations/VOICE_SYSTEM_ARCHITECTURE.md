# Logivox Voice System Architecture
## How It Works vs. Voxware

**Date:** January 7, 2026  
**Status:** Production Ready

---

## Executive Summary

Logivox voice system operates differently from Voxware, with a **unified platform approach** rather than separate console and worker interfaces. Our system provides **role-based access** where admin, manager, and picker roles all use the same interface but see different capabilities based on permissions.

### Key Differences from Voxware

| Feature | Voxware | Logivox |
|---------|---------|---------|
| **Architecture** | 2 separate logins (Console + Worker) | Single unified platform with role-based access |
| **Admin Interface** | Dedicated console | Admin dashboard + voice operations page |
| **Picker Interface** | Basic voice terminal | Full mobile app + web interface + voice |
| **Voice Technology** | Proprietary hardware-dependent | OpenAI Whisper + GPT-4 (cloud-based, device-agnostic) |
| **Training** | Extensive voice template training required | Zero-training AI (learns from usage) |
| **Languages** | Limited, requires templates per language | 20+ languages, automatic dialect adaptation |
| **Integration** | Bolt-on to existing WMS | Native, fully integrated WMS with voice |
| **Task Assignment** | Manual console assignment | AI-powered automatic + manual override |
| **Real-time Monitoring** | Console-only view | Multi-device dashboards, mobile, web |

---

## System Architecture Overview

### 1. **User Roles & Access Levels**

Logivox uses a **single-sign-on** system with role-based permissions:

```typescript
User Roles:
├── SUPER_ADMIN       // Platform administrator
├── ADMIN             // Organization administrator  
├── MANAGER           // Warehouse/Department manager
├── WAREHOUSE_MANAGER // Full warehouse control
├── WAREHOUSE_OPERATOR// Standard operations
├── PICKER            // Picking tasks
├── PACKER            // Packing tasks
├── RECEIVER          // Receiving operations
├── QC_INSPECTOR      // Quality control
├── SUPERVISOR        // Team supervision
└── VIEWER            // Read-only access
```

#### Login Process

**All users log in to same application:**
- URL: `https://logivox.ai/login` or mobile app
- Single credentials, role determines interface
- Session management with voice profile linkage

```typescript
// Login Flow
User enters credentials
  ↓
System authenticates
  ↓
Voice profile created/retrieved
  ↓
Dashboard loads based on role
  ↓
Voice session can start immediately
```

---

### 2. **Admin/Manager Console** (Equivalent to Voxware Console)

**Access:** Dashboard → Voice Operations (`/dashboard/voice-operations`)

#### Admin Capabilities

**🎯 Real-Time Monitoring**
```
Active Sessions Dashboard:
├── Live picker status (listening, speaking, working)
├── Task progress (pending, in-progress, completed)
├── Accuracy metrics per worker
├── Session duration tracking
└── Error/help request monitoring
```

**📊 Performance Analytics**
```
Analytics View:
├── Tasks per hour trends
├── Task type breakdown (picking, receiving, etc.)
├── Language usage statistics
├── Worker performance comparison
├── Accuracy rates by worker
├── Voice command success rates
└── Real-time KPIs
```

**👥 User Management**
```
Worker Management:
├── Assign tasks to specific pickers
├── View worker status (available, busy, offline)
├── Monitor task queues per worker
├── Override voice assignments
├── End/terminate voice sessions
└── View command history per worker
```

**⚙️ Voice Settings & Configuration**
```
Admin Controls:
├── Enable/disable voice for organization
├── Set default language per warehouse
├── Configure voice feedback levels
├── Adjust confidence thresholds
├── Manage voice profiles
├── View voice command logs
└── Export voice analytics
```

#### Manager Interface Components

**File:** `/app/dashboard/voice-operations/page.tsx`

```typescript
Admin Tabs:
1. Live Session Monitoring
   - Real-time voice session viewer
   - Active worker list
   - Current task display
   - Transcript monitoring
   
2. Active Sessions Table
   - Session ID
   - Worker name
   - Start time
   - Tasks completed
   - Accuracy %
   - Language
   - Duration
   - Status (Active/Paused/Ended)
   
3. Analytics Dashboard
   - Hourly task completion chart
   - Task type distribution
   - Language usage pie chart
   - Performance trends
   
4. Settings Panel
   - Organization-wide voice settings
   - Language preferences
   - Voice engine configuration
   - Training controls
```

#### Admin Actions

**Task Management:**
```typescript
// Admins can:
✓ View all active tasks
✓ Assign/reassign tasks to pickers
✓ Change task priority
✓ Cancel/modify tasks
✓ Create new tasks
✓ Monitor task progress live
✓ View task dependencies
✓ Override AI assignments
```

**Picker Management:**
```typescript
// Admins can:
✓ See all active pickers
✓ Monitor picker locations
✓ View picker task queues
✓ Force-assign urgent tasks
✓ End picker sessions
✓ View picker performance metrics
✓ Respond to help requests
✓ Send broadcast messages
```

**Monitoring Capabilities:**
```typescript
// Real-time visibility:
✓ Live transcript of all voice commands
✓ Success/error rates per command
✓ Response times
✓ Task completion rates
✓ Picker utilization
✓ Order status (pending → in-progress → completed)
✓ Problem/exception alerts
✓ Help request notifications
```

---

### 3. **Picker Interface** (Equivalent to Voxware Worker Terminal)

**Access:** 
- Mobile app: `PickerMobile.tsx`
- Web interface: `/dashboard/voice-operations`
- Role: PICKER

#### Picker View - Limited Responsibilities

Pickers see a **simplified, task-focused interface**:

```typescript
Picker Dashboard:
├── My Current Task (1 task at a time)
│   ├── Task ID
│   ├── Order number
│   ├── Item SKU
│   ├── Location
│   ├── Quantity needed
│   ├── Instructions
│   └── Priority badge
│
├── Voice Control Panel
│   ├── Mic button (press to speak)
│   ├── Status indicator (listening/speaking)
│   ├── Live transcript
│   ├── Voice instructions playback
│   └── Help button
│
├── My Task Queue (Next 3-5 tasks)
│   ├── Upcoming locations
│   ├── Expected quantities
│   └── Priority indicators
│
└── My Stats (Personal performance)
    ├── Tasks completed today
    ├── My accuracy rate
    ├── Current streak
    └── Time on current task
```

#### What Pickers CAN'T See

```typescript
Pickers CANNOT:
✗ View other pickers' tasks
✗ See organization-wide analytics
✗ Access admin console
✗ Modify task assignments
✗ View all orders
✗ Access voice settings
✗ See voice command logs
✗ Manage other users
✗ Export data
```

#### Picker Voice Workflow

**Typical Picking Sequence:**

```
1. Picker says: "Start session"
   System: "Session started. You have 5 tasks in queue."

2. System: "Go to location A-12-3"
   Picker walks to location

3. Picker says: "Ready" or scans barcode
   System: "Pick 5 units of SKU-8374"

4. Picker picks items

5. Picker says: "5 picked" or "Picked 5"
   System: "5 units confirmed. Scan container."

6. Picker says: "T1234" (container number)
   System: "Container T1234 assigned. Next location B-7-2"

7. Process repeats...

8. Picker says: "Help" (if needed)
   System: "Help request sent to supervisor."
   (Admin console gets notification)

9. Picker says: "End session"
   System: "Session ended. You completed 42 tasks with 98% accuracy."
```

---

### 4. **Voice Engine Technology**

#### Core Components

**File:** `/lib/voice/voiceEngine.ts`

```typescript
Voice Processing Flow:

User speaks → Microphone capture
     ↓
OpenAI Whisper (Speech-to-Text)
     ↓
Text transcription + language detection
     ↓
GPT-4 Intent Understanding (NLU)
     ↓
Intent classification + entity extraction
     ↓
Action execution (database updates)
     ↓
Response generation (GPT-4)
     ↓
Text-to-Speech synthesis (OpenAI TTS)
     ↓
Audio feedback to user
```

#### Intent Recognition (AI-Powered)

**No Training Required** - System understands natural language:

```typescript
Supported Intents:
├── PICK_ITEM           - "pick the item" / "start picking"
├── CONFIRM             - "yes" / "correct" / "confirmed"
├── CANCEL              - "no" / "cancel" / "go back"
├── ASSIGN_CONTAINER    - "T1234" / "container T 2 1 4 5"
├── REPORT_QUANTITY     - "5 picked" / "picked five units"
├── REPORT_LOCATION     - "I'm at A12" / "location A twelve"
├── REQUEST_HELP        - "help" / "I need assistance"
├── REQUEST_REPEAT      - "repeat" / "say again"
├── COMPLETE_TASK       - "done" / "finished" / "complete"
└── REPORT_PROBLEM      - "damaged" / "wrong quantity" / "missing"
```

**Natural Language Examples:**
```
User can say:
  "I picked five"
  "Five units picked"
  "Picked 5"
  "5"
  
All understood as: REPORT_QUANTITY (quantity: 5)
```

#### Adaptive Learning

```typescript
Voice Profile System:
- Automatically created per user
- Learns from each command
- Improves accuracy over time
- Adapts to accents/speech patterns
- No manual training required
- Tracks confidence levels
- Stores success rates
```

---

### 5. **Task Management System**

#### How Tasks Are Assigned

**Automatic Assignment (Default):**
```typescript
Wave Picking Service:
1. Wave created by manager/admin
   ↓
2. AI analyzes:
   - Available pickers
   - Picker locations
   - Task priorities
   - Zone assignments
   - Equipment requirements
   - Picker skill levels
   ↓
3. Optimal task distribution
   ↓
4. Tasks pushed to picker queues
   ↓
5. Pickers receive voice notification
```

**Manual Override (Admin):**
```typescript
Admin can:
1. View unassigned task pool
2. Select specific picker
3. Drag-drop task assignment
4. Set priority level
5. Add special instructions
6. Picker receives voice alert
```

#### Task Status Tracking

**Admin View:**
```
Task Dashboard:
├── All Tasks (filterable)
│   ├── PENDING      (not assigned)
│   ├── ASSIGNED     (assigned to picker)
│   ├── IN_PROGRESS  (picker working)
│   ├── COMPLETED    (finished)
│   └── CANCELLED    (aborted)
│
├── By Picker
│   ├── John: 3 in progress, 12 completed
│   ├── Maria: 5 in progress, 28 completed
│   └── Pierre: 2 in progress, 15 completed
│
├── By Order
│   ├── ORD-12345: 80% complete (8/10 items)
│   ├── ORD-12346: 100% complete
│   └── ORD-12347: 20% complete (1/5 items)
│
└── Real-time Updates
    └── Task status changes appear instantly
```

**Picker View:**
```
My Tasks:
├── Current Task (what I'm doing now)
├── Next Task (queued up)
└── Completed Today: 28 tasks, 98% accuracy
```

---

### 6. **Order Management & Visibility**

#### Admin Order View

**File:** `/app/dashboard/orders/page.tsx` or similar

```typescript
Order Dashboard Features:
├── Order List (all orders)
│   ├── Status: Pending → Picking → Packing → Shipped
│   ├── Priority indicators
│   ├── Customer info
│   ├── Item count
│   ├── Picker assigned
│   └── Progress %
│
├── Order Details
│   ├── Line items with status
│   ├── Picked quantities
│   ├── Picker name per item
│   ├── Timestamps
│   ├── Voice command logs
│   └── Exceptions/notes
│
├── Filters
│   ├── Status (open/closed/in-progress)
│   ├── Priority
│   ├── Customer
│   ├── Date range
│   └── Assigned picker
│
└── Actions
    ├── Create new order
    ├── Modify order
    ├── Cancel order
    ├── Rush order (bump priority)
    └── View voice activity
```

#### Picker Order View

**Limited to assigned tasks:**
```typescript
Picker sees:
✓ Current order number (e.g., ORD-12345)
✓ Item being picked
✓ Quantity needed
✓ Location
✗ NOT full order details
✗ NOT customer information
✗ NOT other pickers' orders
```

---

### 7. **Voice Session Management**

#### Starting a Voice Session

**Picker:**
```typescript
// From mobile app or web interface
1. Click "Start Voice Session"
2. Select language (if not default)
3. Voice engine initializes
4. System says: "Ready. Say your first command."
5. Mic button activates
6. Picker can start speaking
```

**System Creates:**
```typescript
VoiceSession {
  id: "VS-20260107-001"
  userId: "picker-123"
  status: "ACTIVE"
  language: "en-US"
  startTime: 2026-01-07 08:00:00
  warehouseId: "WH-001"
  taskType: "PICKING"
}
```

#### Admin Monitoring Sessions

**Real-time Session View:**
```
Active Sessions Table:
┌──────────┬──────────────┬──────────┬───────────┬──────────┬──────────┐
│ Session  │ Worker       │ Language │ Tasks     │ Accuracy │ Duration │
├──────────┼──────────────┼──────────┼───────────┼──────────┼──────────┤
│ VS-001   │ John Smith   │ en-US 🇺🇸 │ 28/30     │ 98.5%    │ 1h 12m   │
│ VS-002   │ Maria Garcia │ es-MX 🇲🇽 │ 42/45     │ 99.2%    │ 2h 05m   │
│ VS-003   │ Pierre D.    │ fr-FR 🇫🇷 │ 15/18     │ 97.8%    │ 32m      │
└──────────┴──────────────┴──────────┴───────────┴──────────┴──────────┘

Admin Actions:
[View Transcript] [End Session] [Send Message] [View Tasks]
```

#### Ending a Voice Session

**Picker:**
```
Say: "End session" or "I'm done"
System: "Session ended. Great work today!"
```

**Admin:**
```
Click [End Session] button
Confirmation: "End John's session? He has 2 tasks in progress."
[Yes] [No]
```

---

### 8. **Command History & Logging**

#### Admin View - Full Visibility

**Voice Command Log:**
```typescript
Command History Table:
├── Timestamp
├── Worker name
├── Spoken text (transcript)
├── Recognized intent
├── Confidence score
├── Response given
├── Success/failure
├── Processing time
└── Action taken (if any)

Example:
┌──────────┬────────────┬─────────────────┬─────────────┬────────────┬─────────────┬─────────┐
│ Time     │ Worker     │ Command         │ Intent      │ Confidence │ Response    │ Success │
├──────────┼────────────┼─────────────────┼─────────────┼────────────┼─────────────┼─────────┤
│ 08:23:15 │ John Smith │ "T1234"         │ ASSIGN_CONT │ 95%        │ "Assigned"  │ ✓       │
│ 08:23:42 │ John Smith │ "5 picked"      │ REPORT_QTY  │ 98%        │ "Confirmed" │ ✓       │
│ 08:24:10 │ Maria G.   │ "cinco piezas"  │ REPORT_QTY  │ 96%        │ "Cinco OK"  │ ✓       │
│ 08:24:35 │ John Smith │ "halp"          │ REQUEST_HLP │ 72%        │ "Help sent" │ ✓       │
└──────────┴────────────┴─────────────────┴─────────────┴────────────┴─────────────┴─────────┘
```

#### Picker View - Limited History

**Personal Command History (last 10 commands):**
```
My Recent Commands:
├── 08:23:42 - "5 picked" → Confirmed
├── 08:22:15 - "T1234" → Container assigned
├── 08:20:30 - "Ready" → Next location
└── ...
```

---

### 9. **Real-Time Communication**

#### Help Requests

**Picker:**
```
Says: "Help" or "I need assistance"
System: "Help request sent. A supervisor will assist you."
```

**Admin Console:**
```
🔔 ALERT: Help Request
Worker: John Smith
Location: A-12-3
Task: ORD-12345 - SKU-8374
Reason: Requested via voice
Time: 08:24:35

[Respond] [Assign Supervisor] [Call Worker] [View Task]
```

#### Collaboration System

**File:** `/lib/services/collaboration-service.ts`

```typescript
Collaboration Features:
├── Peer help requests
├── Supervisor escalations
├── Problem reporting
├── Team messaging
├── Broadcast announcements
└── Emergency alerts

Admin can:
✓ See all help requests
✓ Assign responders
✓ Monitor resolution time
✓ View collaboration history
✓ Send team broadcasts
```

---

### 10. **Training System**

#### Zero-Training Voice (Unlike Voxware)

**Voxware Approach:**
```
1. Record voice templates
2. Train specific commands
3. Repeat for each language
4. Re-train for new workers
5. Regular template updates
```

**Logivox Approach:**
```
1. Worker logs in
2. Starts speaking naturally
3. AI understands immediately
4. System learns preferences
5. No training required
```

#### Adaptive Learning

```typescript
Voice Profile Learning:
- Accent adaptation (automatic)
- Speech pattern recognition
- Command preference tracking
- Confidence improvement
- Error pattern analysis
- Success rate optimization

Example:
Worker says "T twelve thirty-four" instead of "T1234"
System learns: This worker speaks container numbers differently
Next time: Recognizes both formats
```

---

### 11. **Multi-Language Support**

#### 20+ Languages Supported

**File:** `/app/dashboard/voice-operations/page.tsx`

```typescript
Available Languages:
├── 🇺🇸 English (US)
├── 🇬🇧 English (UK)
├── 🇪🇸 Spanish (Spain)
├── 🇲🇽 Spanish (Mexico)
├── 🇫🇷 French
├── 🇩🇪 German
├── 🇮🇹 Italian
├── 🇧🇷 Portuguese (Brazil)
├── 🇨🇳 Chinese (Simplified)
├── 🇯🇵 Japanese
├── 🇰🇷 Korean
├── 🇸🇦 Arabic
├── 🇮🇳 Hindi
├── 🇵🇱 Polish
├── 🇳🇱 Dutch
├── 🇷🇺 Russian
├── 🇹🇷 Turkish
├── 🇻🇳 Vietnamese
├── 🇹🇭 Thai
└── 🇸🇪 Swedish
```

#### Language Selection

**Admin:**
```
Can set:
✓ Default language per warehouse
✓ Default language per user
✓ Force language for specific roles
✓ View language usage analytics
```

**Picker:**
```
Can select:
✓ Personal preferred language
✓ Can switch mid-session
✓ System remembers preference
```

---

### 12. **Performance Analytics**

#### Admin Analytics Dashboard

**Key Metrics:**
```typescript
Voice Operations KPIs:
├── Active Sessions (real-time)
│   └── Current: 73 workers active
│
├── Tasks Today
│   ├── Total: 2,847
│   ├── Completed: 2,654 (93%)
│   ├── In Progress: 193
│   └── vs. Yesterday: +12%
│
├── Accuracy Rate
│   ├── Overall: 98.5%
│   ├── Voice commands: 97.8%
│   ├── Picking accuracy: 99.2%
│   └── vs. Last Week: +1.2%
│
├── Average Time/Task
│   ├── Overall: 8.2 min
│   ├── Picking: 7.5 min
│   ├── Packing: 5.1 min
│   └── vs. Baseline: -15%
│
└── Productivity Gains
    ├── vs. Manual: +32%
    ├── vs. RF scanning: +28%
    └── Voice adoption rate: 94%
```

**Charts & Visualizations:**
```
- Hourly task completion trends
- Task type distribution (pie chart)
- Language usage breakdown
- Worker performance comparison
- Accuracy trends over time
- Voice command success rates
```

#### Individual Worker Analytics

**Admin View:**
```typescript
Worker Performance Detail:
├── John Smith (Picker)
│   ├── Today: 42 tasks, 99.1% accuracy
│   ├── This week: 287 tasks, 98.5% avg
│   ├── Units per hour: 35 UPH
│   ├── Voice accuracy: 97.8%
│   ├── Fastest task: 4.2 min
│   ├── Average task: 7.8 min
│   └── Streak: 156 tasks error-free
│
├── Voice Command Stats
│   ├── Total commands: 342
│   ├── Success rate: 97.8%
│   ├── Most used: "picked" (89 times)
│   ├── Errors: 8 (mostly background noise)
│   └── Help requests: 2
│
└── Improvement Areas
    ├── Container assignment (occasional errors)
    └── Suggestion: Practice container numbers
```

**Picker View:**
```
My Performance:
├── Today: 42 tasks ✓
├── Accuracy: 99.1% 🎯
├── Streak: 156 tasks 🔥
└── Rank: #3 in warehouse 🏆
```

---

### 13. **Mobile vs. Desktop Experience**

#### Mobile App (Primary Picker Interface)

**File:** `/components/mobile/PickerMobile.tsx`

```typescript
Mobile Features:
├── Large voice button (thumb-friendly)
├── Visual waveform (speech feedback)
├── Current task display (simplified)
├── Barcode scanner integration
├── Offline mode support
├── Badge scanning
├── Container tracking
└── Quick help button
```

**Optimizations:**
```
- Large touch targets
- Voice-first design
- Minimal text entry
- Quick scan options
- One-handed operation
- Battery efficiency
- Offline sync
```

#### Desktop/Tablet (Admin/Manager Interface)

**Admin Dashboard:**
```typescript
Desktop Features:
├── Multi-panel layout
├── Real-time monitoring grid
├── Advanced analytics
├── Detailed command logs
├── Task management tools
├── User administration
├── Report generation
└── System settings
```

---

### 14. **API Endpoints**

#### Voice Processing API

**POST `/api/voice/process`**
```typescript
// Process voice command
Request:
{
  audioData: Buffer,
  userId: string,
  sessionId: string,
  context: {
    taskType: "picking",
    orderId: "ORD-12345",
    location: "A-12-3"
  }
}

Response:
{
  success: true,
  recognizedText: "5 picked",
  intent: "REPORT_QUANTITY",
  confidence: 0.98,
  responseText: "5 units recorded",
  action: {
    type: "QUANTITY_UPDATED",
    data: { quantity: 5 }
  }
}
```

#### Session Management API

**POST `/api/voice/session`**
```typescript
// Start voice session
Request:
{
  userId: string,
  sessionType: "PICKING",
  warehouseId: string
}

Response:
{
  sessionId: "VS-20260107-001",
  status: "ACTIVE",
  language: "en-US",
  voiceProfile: {
    confidence: 0.85,
    totalCommands: 1247,
    accuracy: 0.982
  }
}
```

---

### 15. **Database Schema**

#### Voice-Related Tables

**VoiceProfile:**
```prisma
model VoiceProfile {
  id               String   @id
  userId           String   @unique
  organizationId   String
  language         String
  confidence       Float
  totalCommands    Int
  successfulCmds   Int
  accuracy         Float
  voiceEnabled     Boolean
  autoLearn        Boolean
  feedbackLevel    String
  lastTrainedAt    DateTime
  
  user             User     @relation
  sessions         VoiceSession[]
  commands         VoiceCommand[]
}
```

**VoiceSession:**
```prisma
model VoiceSession {
  id              String   @id
  voiceProfileId  String
  sessionType     String
  status          String
  startedAt       DateTime
  endedAt         DateTime?
  duration        Int?
  commandCount    Int
  errorCount      Int
  accuracy        Float?
  warehouseId     String?
  taskType        String?
  
  voiceProfile    VoiceProfile @relation
  commands        VoiceCommand[]
}
```

**VoiceCommand:**
```prisma
model VoiceCommand {
  id              String   @id
  voiceProfileId  String
  sessionId       String?
  spokenText      String
  recognizedText  String
  intent          String
  confidence      Float
  language        String
  processingTime  Int
  successful      Boolean
  responseText    String
  commandType     String
  metadata        Json
  createdAt       DateTime
  
  voiceProfile    VoiceProfile @relation
  session         VoiceSession? @relation
}
```

---

## Comparison Summary

### Voxware (Traditional Approach)

```
✗ Two separate login systems
✗ Hardware-dependent
✗ Extensive training required
✗ Limited languages
✗ Console-only admin interface
✗ Basic worker terminal
✗ Bolt-on to existing WMS
✗ Manual task assignment primary
✗ Limited real-time visibility
✗ Proprietary technology
```

### Logivox (Modern Approach)

```
✓ Unified role-based platform
✓ Device-agnostic (any device)
✓ Zero-training AI
✓ 20+ languages, auto-adapt
✓ Full web + mobile admin dashboards
✓ Rich picker mobile app
✓ Native integrated WMS
✓ AI-powered auto-assignment
✓ Real-time monitoring across all devices
✓ Open API, cloud-based
```

---

## Getting Started

### For Administrators

1. **Login:** `https://logivox.ai/login` with ADMIN credentials
2. **Navigate:** Dashboard → Voice Operations
3. **Setup:**
   - Configure default language
   - Review available pickers
   - Create/import tasks
   - Monitor live sessions
4. **Monitor:** View real-time analytics and worker progress

### For Pickers

1. **Login:** Mobile app or web with PICKER credentials
2. **Start Session:** Tap "Start Voice Session"
3. **Begin Working:** Follow voice instructions
4. **Use Commands:** Speak naturally (e.g., "5 picked", "T1234", "help")
5. **End Session:** Say "end session" when done

---

## Support & Documentation

- **Quick Start:** [VOICE_QUICK_START.md](./VOICE_QUICK_START.md)
- **Complete Guide:** [VOICE_SYSTEM_COMPLETE_GUIDE.md](./VOICE_SYSTEM_COMPLETE_GUIDE.md)
- **API Reference:** [API_DOCUMENTATION.md](../technical/API_DOCUMENTATION.md)
- **Training:** [FLOWSTOCK_ACADEMY_TRAINING_SYSTEM.md](../training/FLOWSTOCK_ACADEMY_TRAINING_SYSTEM.md)

---

## Questions?

**Contact:** support@logivox.ai  
**Demo:** Schedule at logivox.ai/demo  
**Documentation:** logivox.ai/docs
