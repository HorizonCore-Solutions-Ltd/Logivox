"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Smartphone,
  Bell,
  BellOff,
  Download,
  Trash2,
  Database,
  WifiOff,
} from "lucide-react";
import {
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from "@/lib/push-notifications";
import { offlineDB, processSyncQueue } from "@/lib/offline-sync";
import { toast } from "@/hooks/use-toast";

export default function PWASettingsPage() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [offlineStorageSize, setOfflineStorageSize] = useState(0);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  useEffect(() => {
    // Check if PWA is installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Check notification permission
    if ("Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
    }

    // Calculate offline storage size
    calculateStorageSize();
    checkPendingSync();
  }, []);

  const calculateStorageSize = async () => {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      setOfflineStorageSize(estimate.usage || 0);
    }
  };

  const checkPendingSync = async () => {
    try {
      const items = await offlineDB.getAll("pendingSync");
      setPendingSyncCount(items.length);
    } catch (error) {
      console.error("Failed to check pending sync:", error);
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const permission = await requestNotificationPermission();
      if (permission === "granted") {
        await subscribeToPushNotifications();
        setNotificationsEnabled(true);
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive push notifications",
        });
      } else {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications in your browser settings",
          variant: "destructive",
        });
      }
    } else {
      await unsubscribeFromPushNotifications();
      setNotificationsEnabled(false);
      toast({
        title: "Notifications Disabled",
        description: "You won't receive push notifications anymore",
      });
    }
  };

  const handleClearOfflineData = async () => {
    try {
      await offlineDB.clear("inventory");
      await offlineDB.clear("bookings");
      await offlineDB.clear("customers");
      await calculateStorageSize();
      toast({
        title: "Offline Data Cleared",
        description: "All cached data has been removed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear offline data",
        variant: "destructive",
      });
    }
  };

  const handleSyncNow = async () => {
    try {
      await processSyncQueue();
      await checkPendingSync();
      toast({
        title: "Sync Complete",
        description: "All pending changes have been synchronized",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Some changes could not be synchronized",
        variant: "destructive",
      });
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mobile & PWA Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your progressive web app experience
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Installation Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Installation
            </CardTitle>
            <CardDescription>PWA installation status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {isInstalled ? "Installed" : "Not Installed"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isInstalled
                    ? "LogiVox is running as an installed app"
                    : "Install LogiVox for a better experience"}
                </p>
              </div>
              <div
                className={`h-3 w-3 rounded-full ${
                  isInstalled ? "bg-green-500" : "bg-gray-300"
                }`}
              />
            </div>
            {!isInstalled && (
              <p className="text-xs text-muted-foreground">
                Look for the install prompt in your browser's address bar or
                menu
              </p>
            )}
          </CardContent>
        </Card>

        {/* Push Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {notificationsEnabled ? (
                <Bell className="h-5 w-5" />
              ) : (
                <BellOff className="h-5 w-5" />
              )}
              Push Notifications
            </CardTitle>
            <CardDescription>Manage notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications" className="cursor-pointer">
                Enable push notifications
              </Label>
              <Switch
                id="notifications"
                checked={notificationsEnabled}
                onCheckedChange={handleNotificationToggle}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Receive alerts for low stock, new bookings, and important updates
            </p>
          </CardContent>
        </Card>

        {/* Offline Storage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Offline Storage
            </CardTitle>
            <CardDescription>Cached data for offline use</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Storage Used</p>
              <p className="text-2xl font-bold">
                {formatBytes(offlineStorageSize)}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearOfflineData}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Offline Data
            </Button>
            <p className="text-xs text-muted-foreground">
              Clearing data will require re-downloading when offline
            </p>
          </CardContent>
        </Card>

        {/* Sync Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WifiOff className="h-5 w-5" />
              Offline Sync
            </CardTitle>
            <CardDescription>Pending synchronization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Pending Changes</p>
              <p className="text-2xl font-bold">{pendingSyncCount}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncNow}
              disabled={pendingSyncCount === 0}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Sync Now
            </Button>
            <p className="text-xs text-muted-foreground">
              Changes made offline will sync automatically when online
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Progressive Web App Features</CardTitle>
          <CardDescription>What you get with LogiVox PWA</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">✓ Offline Access</h4>
              <p className="text-sm text-muted-foreground">
                Access your inventory and bookings even without internet
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">✓ Fast Loading</h4>
              <p className="text-sm text-muted-foreground">
                Instant app startup with cached resources
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">✓ Push Notifications</h4>
              <p className="text-sm text-muted-foreground">
                Real-time alerts for important events
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">✓ Native Experience</h4>
              <p className="text-sm text-muted-foreground">
                Full-screen app that feels like a native application
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">✓ Auto Updates</h4>
              <p className="text-sm text-muted-foreground">
                Always get the latest features automatically
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">✓ Background Sync</h4>
              <p className="text-sm text-muted-foreground">
                Automatic data synchronization when connection returns
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
