# Mobile App Guide

## FlowStock WMS - Mobile Application Documentation

### Overview

The FlowStock mobile application provides warehouse workers with a powerful, offline-first tool for managing warehouse operations on the go. Built for iOS and Android, it features barcode scanning, task management, offline sync, and real-time updates.

---

## Features

### 1. **Barcode Scanning**

Universal barcode scanner that recognizes:
- Inventory items (by barcode or SKU)
- Warehouse locations
- Sales orders
- Wave picks
- Tasks

**Supported Formats:**
- EAN-13
- CODE-128
- CODE-39
- QR Codes

**Usage:**
1. Tap the scan button (floating action button)
2. Point camera at barcode
3. App automatically detects and processes

### 2. **Offline-First Architecture**

Work without internet connection:
- All data cached locally
- Changes queued for sync
- Automatic sync when online
- Conflict resolution

**How It Works:**
1. Data is cached when online
2. Offline changes stored in queue
3. Auto-sync every 30 seconds when online
4. Manual sync via refresh button

### 3. **Task Management**

View and complete warehouse tasks:
- Auto-filtered to assigned user
- Priority-based ordering
- Status tracking (Pending, In Progress, Completed)
- Task actions (Start, Pause, Complete, Cancel)

**Task Types:**
- Putaway
- Picking
- Replenishment
- Cycle Count
- Transfer
- Relocation

### 4. **Push Notifications**

Real-time alerts for:
- New task assignments
- Task updates
- Urgent priorities
- Wave releases
- Low stock alerts

---

## Installation

### Prerequisites

- Node.js 18+
- React Native CLI or Expo CLI
- iOS: Xcode 14+ (macOS only)
- Android: Android Studio

### Setup

```bash
# Clone the repository
git clone https://github.com/your-org/flowstock-mobile.git
cd flowstock-mobile

# Install dependencies
npm install

# iOS specific
cd ios && pod install && cd ..

# Start Metro bundler
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

### Configuration

Create `.env` file in root:

```env
API_URL=https://your-api-url.com
API_VERSION=v1
SENTRY_DSN=your-sentry-dsn
FCM_SENDER_ID=your-fcm-sender-id
```

---

## Architecture

### Technology Stack

- **Framework:** React Native / Expo
- **State Management:** React Context + Hooks
- **Offline Storage:** AsyncStorage / SQLite
- **Barcode Scanning:** @react-native-camera-kit or expo-barcode-scanner
- **Push Notifications:** Firebase Cloud Messaging (FCM)
- **Sync:** Custom offline sync service

### Project Structure

```
mobile/
├── src/
│   ├── components/
│   │   ├── BarcodeScanner.tsx       # Barcode scanner component
│   │   ├── TaskList.tsx              # Task list view
│   │   ├── TaskDetail.tsx            # Task detail screen
│   │   └── SyncIndicator.tsx         # Sync status indicator
│   ├── screens/
│   │   ├── HomeScreen.tsx            # Dashboard
│   │   ├── TasksScreen.tsx           # Task management
│   │   ├── ScanScreen.tsx            # Barcode scanning
│   │   └── InventoryScreen.tsx       # Inventory lookup
│   ├── services/
│   │   ├── api.service.ts            # API client
│   │   ├── barcode.service.ts        # Barcode utilities
│   │   ├── offline-sync.service.ts   # Offline sync
│   │   └── notification.service.ts   # Push notifications
│   ├── hooks/
│   │   ├── useAuth.ts                # Authentication hook
│   │   ├── useOfflineSync.ts         # Sync hook
│   │   └── useBarcode.ts             # Barcode hook
│   ├── contexts/
│   │   ├── AuthContext.tsx           # Auth state
│   │   └── SyncContext.tsx           # Sync state
│   └── utils/
│       ├── storage.ts                # Local storage
│       └── constants.ts              # App constants
├── App.tsx                            # Root component
└── package.json
```

---

## API Integration

### Authentication

```typescript
// Login
const response = await fetch(`${API_URL}/api/mobile/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'worker@example.com',
    password: 'password',
    deviceInfo: {
      deviceId: 'unique-device-id',
      deviceName: 'iPhone 14',
      fcmToken: 'fcm-token',
    },
  }),
});

const { data } = await response.json();
// Store tokens
await AsyncStorage.setItem('auth_token', data.accessToken);
await AsyncStorage.setItem('refresh_token', data.refreshToken);
```

### Barcode Scanning

```typescript
// Scan barcode
const response = await fetch(`${API_URL}/api/mobile/barcode/scan`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    barcode: '1234567890123',
    context: 'PICKING',
  }),
});

const { data } = await response.json();
console.log(data.entityType); // 'INVENTORY_ITEM' | 'LOCATION' | 'SALES_ORDER'
console.log(data.entity); // Full entity details
```

### Task Management

```typescript
// Get tasks
const response = await fetch(
  `${API_URL}/api/mobile/tasks?status=PENDING`,
  {
    headers: { 'Authorization': `Bearer ${token}` },
  }
);

const { data } = await response.json();
console.log(data.tasks); // Array of tasks

// Start task
await fetch(`${API_URL}/api/mobile/tasks/${taskId}/start`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
});
```

### Offline Sync

```typescript
// Sync offline changes
const response = await fetch(`${API_URL}/api/mobile/sync`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    lastSyncAt: '2025-01-16T12:00:00Z',
    pendingChanges: [
      {
        entity: 'task',
        action: 'task_completion',
        data: {
          taskId: 'task-123',
          status: 'COMPLETED',
          completedAt: '2025-01-16T12:30:00Z',
        },
        localId: 'local_12345',
        timestamp: '2025-01-16T12:30:00Z',
      },
    ],
  }),
});

const { data } = await response.json();
console.log(data.appliedChanges); // Successfully synced changes
console.log(data.serverChanges); // Server updates
console.log(data.conflicts); // Sync conflicts
```

---

## Offline Sync Implementation

### Storage Schema

```typescript
// AsyncStorage keys
const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  OFFLINE_QUEUE: 'offline_queue',
  CACHED_TASKS: 'cached_tasks',
  CACHED_ITEMS: 'cached_items',
  LAST_SYNC: 'last_sync_time',
};
```

### Sync Queue

```typescript
interface SyncEntity {
  id: string;
  entity: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  data: any;
  localId: string;
  timestamp: Date;
  synced: boolean;
  syncedAt?: Date;
  error?: string;
}
```

### Conflict Resolution

1. **Server Wins:** Default strategy
2. **Client Wins:** For offline changes
3. **Manual:** User chooses in UI

```typescript
// Handle conflicts
if (conflict.conflictType === 'VERSION_MISMATCH') {
  // Show conflict resolution UI
  const resolution = await showConflictDialog(conflict);
  
  if (resolution === 'SERVER_WINS') {
    // Discard local changes
  } else if (resolution === 'CLIENT_WINS') {
    // Force push local changes
  }
}
```

---

## Push Notifications

### Setup (Firebase Cloud Messaging)

```typescript
// Request permission
const permission = await messaging().requestPermission();

if (permission === messaging.AuthorizationStatus.AUTHORIZED) {
  // Get FCM token
  const fcmToken = await messaging().getToken();
  
  // Send to server during login
  await fetch(`${API_URL}/api/mobile/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      deviceInfo: {
        deviceId,
        deviceName,
        fcmToken, // Include token
      },
    }),
  });
}
```

### Handle Notifications

```typescript
// Foreground messages
messaging().onMessage(async (remoteMessage) => {
  console.log('Notification received:', remoteMessage);
  
  // Show in-app notification
  showInAppNotification(remoteMessage.notification);
  
  // Refresh tasks if task assignment
  if (remoteMessage.data?.type === 'TASK_ASSIGNED') {
    refreshTasks();
  }
});

// Background messages
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('Background notification:', remoteMessage);
});

// Notification opened app
messaging().onNotificationOpenedApp((remoteMessage) => {
  console.log('Notification opened app:', remoteMessage);
  
  // Navigate to relevant screen
  if (remoteMessage.data?.taskId) {
    navigation.navigate('TaskDetail', {
      taskId: remoteMessage.data.taskId,
    });
  }
});
```

---

## Barcode Scanning Integration

### Camera Permissions

```typescript
// Request camera permission
import { Camera } from 'expo-camera';

const [permission, requestPermission] = Camera.useCameraPermissions();

if (!permission?.granted) {
  await requestPermission();
}
```

### Scanner Component

```typescript
import { Camera, CameraView } from 'expo-camera';

function BarcodeScanner({ onScan }) {
  const handleBarCodeScanned = ({ type, data }) => {
    console.log(`Scanned ${type}: ${data}`);
    
    // Process barcode
    onScan({ data, format: type, timestamp: new Date() });
  };

  return (
    <CameraView
      style={{ flex: 1 }}
      onBarcodeScanned={handleBarCodeScanned}
      barcodeScannerSettings={{
        barcodeTypes: ['ean13', 'code128', 'qr'],
      }}
    />
  );
}
```

---

## Best Practices

### 1. **Error Handling**

```typescript
try {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  return await response.json();
} catch (error) {
  if (error.message.includes('Network request failed')) {
    // Offline - queue for sync
    queueForOfflineSync(request);
  } else {
    // Show error to user
    showErrorAlert(error.message);
  }
}
```

### 2. **Performance**

- Cache images locally
- Use FlatList for long lists
- Debounce search inputs
- Lazy load data
- Optimize images

### 3. **Security**

- Store tokens securely (Keychain/Keystore)
- Use HTTPS only
- Validate SSL certificates
- Implement token refresh
- Clear sensitive data on logout

### 4. **User Experience**

- Show loading states
- Provide offline indicators
- Give sync status feedback
- Use haptic feedback
- Support dark mode

---

## Testing

### Unit Tests

```bash
npm test
```

### E2E Tests (Detox)

```bash
# iOS
npm run e2e:ios

# Android
npm run e2e:android
```

### Manual Testing Checklist

- [ ] Login/logout
- [ ] Barcode scanning (all formats)
- [ ] Task list loading
- [ ] Task actions (start, complete, cancel)
- [ ] Offline mode
- [ ] Sync when coming online
- [ ] Push notifications
- [ ] Conflict resolution

---

## Deployment

### iOS (App Store)

```bash
# Build release
npm run ios:release

# Archive in Xcode
# Upload to App Store Connect
```

### Android (Play Store)

```bash
# Generate release APK
cd android
./gradlew assembleRelease

# Or generate AAB
./gradlew bundleRelease
```

---

## Troubleshooting

### Common Issues

**1. Barcode scanner not working**
- Check camera permissions
- Verify supported formats
- Test with known good barcodes

**2. Offline sync not syncing**
- Check network connectivity
- Verify auth token validity
- Inspect sync queue

**3. Push notifications not received**
- Verify FCM setup
- Check device notification settings
- Test with Firebase Console

**4. App crashes on launch**
- Clear app data
- Reinstall app
- Check native dependencies

---

## Support

For issues or questions:
- Email: support@flowstock.com
- Slack: #mobile-support
- Documentation: https://docs.flowstock.com/mobile

---

## License

© 2025 FlowStock WMS. All rights reserved.
