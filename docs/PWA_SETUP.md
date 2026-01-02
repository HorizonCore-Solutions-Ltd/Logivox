# LogiVox PWA Setup Guide

## Overview

LogiVox is now configured as a Progressive Web App (PWA) with full offline support, push notifications, and native app-like experience.

## Features Implemented

### 1. PWA Configuration
- ✅ Web App Manifest (`/public/manifest.json`)
- ✅ Service Worker with caching strategies
- ✅ Offline-first architecture
- ✅ Install prompts and shortcuts
- ✅ Theme color and branding

### 2. Offline Support
- ✅ IndexedDB for offline data storage
- ✅ Background sync for offline operations
- ✅ Automatic retry for failed requests
- ✅ Offline indicator UI
- ✅ Sync queue management

### 3. Push Notifications
- ✅ Push notification subscription
- ✅ Notification permission handling
- ✅ Notification templates (low stock, bookings, etc.)
- ✅ Click-through to relevant pages
- ✅ Badge and icon support

### 4. Mobile Optimization
- ✅ Responsive design across all pages
- ✅ Touch-friendly UI components
- ✅ Mobile navigation
- ✅ Standalone display mode
- ✅ Status bar styling

### 5. Performance
- ✅ Resource caching (images, CSS, JS)
- ✅ API response caching
- ✅ Stale-while-revalidate strategy
- ✅ Precaching of critical assets
- ✅ Fast startup times

## Installation

### For Users

#### Desktop (Chrome, Edge, etc.)
1. Visit LogiVox in your browser
2. Look for the install icon in the address bar
3. Click "Install LogiVox"
4. The app will be added to your applications

#### Mobile (Android)
1. Open LogiVox in Chrome
2. Tap the menu (three dots)
3. Select "Add to Home screen"
4. Confirm the installation

#### Mobile (iOS/Safari)
1. Open LogiVox in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. Confirm the installation

### For Developers

#### Prerequisites
```bash
npm install next-pwa workbox-window
```

#### Configuration Files

1. **next.config.js** - PWA configuration with next-pwa
2. **public/manifest.json** - Web app manifest
3. **src/service-worker.ts** - Service worker logic
4. **src/lib/offline-sync.ts** - Offline sync utilities
5. **src/lib/push-notifications.ts** - Push notification utilities

#### Environment Variables

Create a `.env.local` file:

```env
# Optional: VAPID keys for push notifications
# Generate with: npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
```

## Usage

### Offline Sync

The app automatically queues operations when offline:

```typescript
import { addToSyncQueue } from '@/lib/offline-sync'

// Queue an operation
await addToSyncQueue({
  type: 'create',
  endpoint: '/api/inventory',
  data: { name: 'New Item', sku: '123' }
})

// Operations sync automatically when online
```

### Push Notifications

```typescript
import { showLocalNotification, NotificationTemplates } from '@/lib/push-notifications'

// Show a notification
showLocalNotification(NotificationTemplates.lowStock('Item Name'))

// Request permission
await requestNotificationPermission()

// Subscribe to push
await subscribeToPushNotifications()
```

### Offline Storage

```typescript
import { offlineDB } from '@/lib/offline-sync'

// Store data offline
await offlineDB.set('inventory', { id: '1', name: 'Item' })

// Retrieve offline data
const item = await offlineDB.get('inventory', '1')

// Get all items
const items = await offlineDB.getAll('inventory')
```

## Testing

### Test Offline Mode

1. Open DevTools (F12)
2. Go to Network tab
3. Select "Offline" from throttling dropdown
4. App should continue working

### Test Service Worker

1. Open DevTools > Application > Service Workers
2. Verify service worker is registered
3. Check "Update on reload" for development
4. View cached resources in Cache Storage

### Test Push Notifications

1. Go to PWA Settings page
2. Enable push notifications
3. Grant permission when prompted
4. Trigger a test notification

### Test Installation

1. Use Chrome/Edge on desktop
2. Visit app in incognito mode
3. Look for install prompt
4. Install and verify standalone mode

## Caching Strategies

### API Responses
- Strategy: NetworkFirst
- Cache Duration: 5 minutes
- Max Entries: 50

### Images
- Strategy: CacheFirst
- Cache Duration: 30 days
- Max Entries: 60

### Static Resources (CSS, JS)
- Strategy: StaleWhileRevalidate
- Updates in background

### Navigation
- App Shell caching
- Instant page loads

## PWA Settings Page

Access at `/dashboard/pwa-settings`:

- View installation status
- Enable/disable push notifications
- Check offline storage size
- Clear offline data
- Sync pending changes
- View PWA features

## Components

### PWAInstallPrompt
Shows install prompt after 30 seconds, respects dismissal (7 days).

### ServiceWorkerRegister
Handles service worker updates, shows reload prompt.

### OfflineIndicator
Displays offline status at top of screen.

## Troubleshooting

### Service Worker Not Updating

```bash
# Clear service worker cache
# DevTools > Application > Service Workers > Unregister
# Then hard refresh (Ctrl+Shift+R)
```

### Push Notifications Not Working

1. Check VAPID keys are configured
2. Verify HTTPS connection (required)
3. Check browser permission settings
4. Ensure service worker is active

### Offline Data Not Syncing

1. Check browser console for errors
2. Verify network is back online
3. Check pending sync count in PWA Settings
4. Manually trigger sync

### Icons Not Showing

1. Verify icon files exist in `/public/icons/`
2. Check manifest.json paths
3. Clear cache and reinstall

## Browser Support

- ✅ Chrome 90+ (full support)
- ✅ Edge 90+ (full support)
- ✅ Firefox 90+ (most features)
- ✅ Safari 15+ (limited push notification support)
- ✅ Chrome Android (full support)
- ⚠️ Safari iOS (no push notifications)

## Production Deployment

### Checklist

- [ ] Generate and add app icons
- [ ] Add app screenshots
- [ ] Configure VAPID keys for push
- [ ] Test on real devices
- [ ] Verify HTTPS is enabled
- [ ] Test offline functionality
- [ ] Check service worker registration
- [ ] Verify caching strategies
- [ ] Test push notifications
- [ ] Monitor PWA metrics

### Recommended Tools

- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - PWA audit
- [PWA Builder](https://www.pwabuilder.com/) - PWA testing and packaging
- [Workbox](https://developers.google.com/web/tools/workbox) - Service worker library

## Metrics to Track

- Installation rate
- Offline usage
- Push notification engagement
- Cache hit rate
- Service worker errors
- Sync queue size

## Future Enhancements

- [ ] Background sync API for better offline experience
- [ ] Periodic background sync for data refresh
- [ ] Web Share API integration
- [ ] Badging API for unread counts
- [ ] File System Access API
- [ ] Native file handling

## Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

## Support

For issues or questions:
- Check browser console for errors
- Review service worker status in DevTools
- Test in incognito mode to rule out cache issues
- Verify all dependencies are installed
