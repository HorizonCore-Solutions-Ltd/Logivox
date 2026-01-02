/**
 * Keyboard Shortcuts Help Dialog
 * Displays all available keyboard shortcuts in the application
 * Accessible via Ctrl+Shift+K
 */

"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useKeyboardShortcut } from "@/lib/accessibility"
import {
  Command,
  Keyboard,
  Navigation,
  Table2,
  FileText,
  Mic,
  Settings,
} from "lucide-react"

/**
 * Keyboard shortcut definition
 */
interface Shortcut {
  key: string
  description: string
  category: string
}

/**
 * All application keyboard shortcuts organized by category
 */
const SHORTCUTS: Shortcut[] = [
  // Global shortcuts
  { key: "Ctrl+Shift+K", description: "Show keyboard shortcuts", category: "Global" },
  { key: "Ctrl+Shift+V", description: "Toggle voice control", category: "Global" },
  { key: "Ctrl+Shift+H", description: "Show voice control help", category: "Global" },
  { key: "Ctrl+K", description: "Focus search", category: "Global" },
  { key: "Ctrl+B", description: "Toggle sidebar", category: "Global" },
  { key: "Ctrl+Shift+T", description: "Toggle theme (dark/light)", category: "Global" },
  { key: "?", description: "Show help", category: "Global" },
  
  // Navigation shortcuts
  { key: "Ctrl+Shift+D", description: "Go to dashboard", category: "Navigation" },
  { key: "Ctrl+Shift+I", description: "Go to inventory", category: "Navigation" },
  { key: "Ctrl+Shift+B", description: "Go to bookings", category: "Navigation" },
  { key: "Ctrl+Shift+A", description: "Go to alerts", category: "Navigation" },
  { key: "Ctrl+Shift+R", description: "Go to reports", category: "Navigation" },
  
  // Modal/Dialog shortcuts
  { key: "Escape", description: "Close modal or dialog", category: "Modals" },
  { key: "Enter", description: "Confirm action", category: "Modals" },
  
  // Table navigation
  { key: "↓", description: "Next row", category: "Tables" },
  { key: "↑", description: "Previous row", category: "Tables" },
  { key: "Home", description: "First row", category: "Tables" },
  { key: "End", description: "Last row", category: "Tables" },
  { key: "Space", description: "Select row", category: "Tables" },
  { key: "Enter", description: "Open row details", category: "Tables" },
  
  // Form shortcuts
  { key: "Tab", description: "Next field", category: "Forms" },
  { key: "Shift+Tab", description: "Previous field", category: "Forms" },
  { key: "Ctrl+Enter", description: "Submit form", category: "Forms" },
  { key: "Escape", description: "Cancel editing", category: "Forms" },
]

/**
 * Group shortcuts by category
 */
function groupShortcutsByCategory(shortcuts: Shortcut[]) {
  return shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = []
    }
    acc[shortcut.category]!.push(shortcut)
    return acc
  }, {} as Record<string, Shortcut[]>)
}

/**
 * Get icon for category
 */
function getCategoryIcon(category: string) {
  switch (category) {
    case "Global":
      return <Command className="h-4 w-4" />
    case "Navigation":
      return <Navigation className="h-4 w-4" />
    case "Tables":
      return <Table2 className="h-4 w-4" />
    case "Forms":
      return <FileText className="h-4 w-4" />
    case "Modals":
      return <Settings className="h-4 w-4" />
    default:
      return <Keyboard className="h-4 w-4" />
  }
}

/**
 * Format keyboard shortcut for display
 */
function formatShortcut(shortcut: string): React.ReactNode {
  const parts = shortcut.split('+')
  
  return (
    <div className="flex items-center gap-1">
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          <kbd className="px-2 py-1 text-xs font-semibold bg-muted border border-border rounded">
            {part}
          </kbd>
          {index < parts.length - 1 && (
            <span className="text-muted-foreground">+</span>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = React.useState(false)
  const groupedShortcuts = React.useMemo(
    () => groupShortcutsByCategory(SHORTCUTS),
    []
  )

  // Register Ctrl+Shift+K to open shortcuts help
  useKeyboardShortcut("Ctrl+Shift+K", () => {
    setOpen(true)
  })

  // Also support ? key
  useKeyboardShortcut("?", () => {
    setOpen(true)
  }, { enabled: !open })

  const categories = Object.keys(groupedShortcuts)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary" />
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </div>
          <DialogDescription>
            Navigate LogiVox faster with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={categories[0]} className="w-full">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${categories.length}, 1fr)` }}>
            {categories.map((category) => (
              <TabsTrigger key={category} value={category} className="flex items-center gap-2">
                {getCategoryIcon(category)}
                <span className="hidden sm:inline">{category}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category} value={category} className="mt-4">
              <div className="h-[400px] overflow-y-auto pr-4">
                <div className="space-y-3">
                  {groupedShortcuts[category]!.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                    >
                      <span className="text-sm font-medium">{shortcut.description}</span>
                      {formatShortcut(shortcut.key)}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Keyboard className="h-4 w-4" />
            <span>Press {formatShortcut("Ctrl+Shift+K")} or {formatShortcut("?")} to show this dialog</span>
          </div>
          <Badge variant="outline">
            {SHORTCUTS.length} shortcuts
          </Badge>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Screen reader announcer for keyboard shortcuts
 * Announces when user activates a keyboard shortcut
 */
export function KeyboardShortcutAnnouncer() {
  return (
    <div
      id="keyboard-shortcut-announcements"
      className="sr-only"
      aria-live="polite"
      aria-atomic="true"
    />
  )
}
