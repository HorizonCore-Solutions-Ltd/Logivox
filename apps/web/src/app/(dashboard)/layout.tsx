import { ReactNode } from "react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { PWAInstallPrompt } from "@/components/pwa/install-prompt";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { OfflineIndicator } from "@/components/pwa/offline-indicator";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardSidebar>
      {children}
      <PWAInstallPrompt />
      <ServiceWorkerRegister />
      <OfflineIndicator />
    </DashboardSidebar>
  );
}
