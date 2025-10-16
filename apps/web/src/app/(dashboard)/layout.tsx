import { ReactNode } from "react"
import { PWAInstallPrompt } from "@/components/pwa/install-prompt"
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register"
import { OfflineIndicator } from "@/components/pwa/offline-indicator"
import { VoiceControl, VoiceControlAnnouncer } from "@/components/voice-control"

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-muted/20">
      {children}
      <PWAInstallPrompt />
      <ServiceWorkerRegister />
      <OfflineIndicator />
      <VoiceControl />
      <VoiceControlAnnouncer />
    </div>
  )
}
