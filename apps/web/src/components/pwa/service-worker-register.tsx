"use client"

import { useEffect, useState } from "react"
import { Workbox } from "workbox-window"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { RefreshCw } from "lucide-react"

export function ServiceWorkerRegister() {
  const [showReload, setShowReload] = useState(false)
  const [wb, setWb] = useState<Workbox | null>(null)

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      const workbox = new Workbox('/sw.js')

      workbox.addEventListener('installed', (event) => {
        if (event.isUpdate) {
          setShowReload(true)
          toast({
            title: "Update Available",
            description: "A new version of LogiVox is available.",
            duration: 0,
          })
        }
      })

      workbox.addEventListener('waiting', () => {
        setShowReload(true)
      })

      workbox.addEventListener('controlling', () => {
        window.location.reload()
      })

      workbox.register()
      setWb(workbox)
    }
  }, [])

  const handleReload = () => {
    if (wb) {
      wb.addEventListener('controlling', () => {
        window.location.reload()
      })
      wb.messageSkipWaiting()
    }
  }

  if (!showReload) return null

  return (
    <div className="fixed bottom-4 left-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-4 flex items-center gap-3">
        <div className="flex-1">
          <p className="font-medium">Update Available</p>
          <p className="text-sm opacity-90">Click to update and reload</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleReload}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Update
        </Button>
      </div>
    </div>
  )
}
