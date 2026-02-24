import { ReactNode } from "react";
import { PWAInstallPrompt } from "@/components/pwa/install-prompt";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { OfflineIndicator } from "@/components/pwa/offline-indicator";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/20">
      {children}
      <PWAInstallPrompt />
      <ServiceWorkerRegister />
      <OfflineIndicator />
    </div>
  );
}
