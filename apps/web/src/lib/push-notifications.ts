// Push notification utilities

export interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    console.warn("This browser does not support notifications");
    return "denied";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Subscribe to push notifications
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey
          ? (urlBase64ToUint8Array(vapidKey) as BufferSource)
          : undefined,
      });
    }

    // Send subscription to server
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subscription),
    });

    return subscription;
  } catch (error) {
    console.error("Failed to subscribe to push notifications:", error);
    return null;
  }
}

export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();

      // Notify server
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      return true;
    }

    return false;
  } catch (error) {
    console.error("Failed to unsubscribe from push notifications:", error);
    return false;
  }
}

export function showLocalNotification(options: PushNotificationOptions) {
  if (!("Notification" in window)) {
    return;
  }

  if (Notification.permission === "granted") {
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || "/icons/icon-192x192.png",
      badge: options.badge || "/icons/icon-72x72.png",
      tag: options.tag,
      requireInteraction: options.requireInteraction,
      data: { url: options.url || "/dashboard" },
    });

    notification.onclick = (event) => {
      event.preventDefault();
      window.focus();
      const url = (event.target as any).data?.url || "/dashboard";
      window.location.href = url;
    };
  }
}

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

// Notification types for different events
export const NotificationTemplates = {
  lowStock: (itemName: string) => ({
    title: "Low Stock Alert",
    body: `${itemName} is running low on stock`,
    tag: "low-stock",
    url: "/dashboard/inventory",
  }),
  newBooking: (customerName: string) => ({
    title: "New Booking",
    body: `New booking from ${customerName}`,
    tag: "new-booking",
    url: "/dashboard/bookings",
  }),
  bookingFulfilled: (bookingId: string) => ({
    title: "Booking Fulfilled",
    body: `Booking #${bookingId} has been fulfilled`,
    tag: "booking-fulfilled",
    url: "/dashboard/bookings",
  }),
  inventoryUpdate: (itemName: string) => ({
    title: "Inventory Updated",
    body: `${itemName} has been updated`,
    tag: "inventory-update",
    url: "/dashboard/inventory",
  }),
};
