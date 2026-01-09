'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

// ============================================
// CAPA SYSTEM 14: MOBILE DASHBOARD
// ============================================
// Mobile-first interface for CAPA management
// Optimized for touch, large buttons, minimal data
// PWA-ready with offline capabilities

interface MobileCapa {
  id: string
  capaNumber: string
  title: string
  status: string
  priority: string
  severity: string
  targetCompletionDate: string
  updatedAt: string
  mobileMetadata?: {
    photoUrls: string[]
    voiceNoteUrl?: string
    hasOfflineEdits?: boolean
  }
  ncr?: {
    ncrNumber: string
    defectType: string
  }
}

export default function MobileCAPAPage() {
  const { data: session } = useSession()
  const [capas, setCapas] = useState<MobileCapa[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'assigned' | 'open' | 'overdue'>('assigned')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // New CAPA form
  const [newCapaTitle, setNewCapaTitle] = useState('')
  const [newCapaDescription, setNewCapaDescription] = useState('')
  const [newCapaPriority, setNewCapaPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM')
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([])
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    fetchCapas()
    
    // Check online status
    setIsOnline(navigator.onLine)
    window.addEventListener('online', () => setIsOnline(true))
    window.addEventListener('offline', () => setIsOnline(false))

    return () => {
      window.removeEventListener('online', () => setIsOnline(true))
      window.removeEventListener('offline', () => setIsOnline(false))
    }
  }, [filter])

  const fetchCapas = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter === 'assigned') params.append('assignedToMe', 'true')
      if (filter === 'open') params.append('status', 'OPEN')
      params.append('lightweight', 'true')

      const response = await fetch(`/api/capa/mobile?${params}`)
      const data = await response.json()

      setCapas(data.capas || [])
      setStats(data.stats)
    } catch (error) {
      console.error('Failed to fetch CAPAs:', error)
      // Load from localStorage if offline
      if (!navigator.onLine) {
        const cached = localStorage.getItem('cachedCAPAs')
        if (cached) {
          setCapas(JSON.parse(cached))
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const createMobileCapa = async () => {
    if (!newCapaTitle || !newCapaDescription) {
      alert('Please fill in title and description')
      return
    }

    try {
      const capaData = {
        action: 'CREATE_MOBILE_CAPA',
        title: newCapaTitle,
        description: newCapaDescription,
        priority: newCapaPriority,
        severity: newCapaPriority, // Auto-match severity to priority
        capaType: 'CORRECTIVE' as const,
        photoUrls: capturedPhotos,
        deviceInfo: {
          deviceType: /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'iOS' : 
                      /Android/.test(navigator.userAgent) ? 'Android' : 'Web',
          os: navigator.userAgent,
          appVersion: '1.0.0',
        },
      }

      if (!isOnline) {
        // Save to localStorage for offline sync
        const pending = JSON.parse(localStorage.getItem('pendingCAPAs') || '[]')
        pending.push({
          ...capaData,
          offlineCreatedAt: new Date().toISOString(),
        })
        localStorage.setItem('pendingCAPAs', JSON.stringify(pending))
        alert('📱 CAPA saved offline. Will sync when connection restored.')
        setShowCreateModal(false)
        return
      }

      const response = await fetch('/api/capa/mobile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(capaData)
      })

      const result = await response.json()

      if (result.success) {
        alert(`✅ CAPA Created: ${result.capaNumber}`)
        setShowCreateModal(false)
        setNewCapaTitle('')
        setNewCapaDescription('')
        setCapturedPhotos([])
        fetchCapas()
      } else {
        alert(result.error || 'Failed to create CAPA')
      }
    } catch (error) {
      console.error('Create CAPA error:', error)
      alert('Failed to create CAPA. Check connection and try again.')
    }
  }

  const quickUpdateStatus = async (capaId: string, newStatus: string) => {
    if (!confirm(`Change status to ${newStatus}?`)) return

    try {
      const response = await fetch('/api/capa/mobile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'QUICK_UPDATE_STATUS',
          capaId,
          status: newStatus,
        })
      })

      const result = await response.json()

      if (result.success) {
        alert(`Status updated to ${newStatus}`)
        fetchCapas()
      }
    } catch (error) {
      console.error('Status update error:', error)
    }
  }

  const capturePhoto = () => {
    // Simulate photo capture (in real PWA, use camera API)
    const photoUrl = `https://picsum.photos/800/600?random=${Date.now()}`
    setCapturedPhotos([...capturedPhotos, photoUrl])
  }

  const filteredCapas = filter === 'overdue' 
    ? capas.filter(c => new Date(c.targetCompletionDate) < new Date() && (c.status === 'OPEN' || c.status === 'IN_PROGRESS'))
    : capas

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header - Sticky */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">📱 Mobile CAPA</h1>
            <div className="text-xs opacity-90 flex items-center gap-2 mt-1">
              {isOnline ? (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> Online
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-400 rounded-full"></span> Offline
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-bold text-lg shadow-lg active:scale-95 transition-transform"
          >
            + New
          </button>
        </div>
      </div>

      {/* Stats Cards - Horizontal Scroll */}
      {stats && (
        <div className="overflow-x-auto bg-white border-b">
          <div className="flex gap-3 p-4 min-w-max">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 min-w-[140px]">
              <div className="text-blue-600 text-xs font-medium">My CAPAs</div>
              <div className="text-3xl font-bold text-blue-700 mt-1">{stats.totalAssigned}</div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 min-w-[140px]">
              <div className="text-green-600 text-xs font-medium">Open</div>
              <div className="text-3xl font-bold text-green-700 mt-1">{stats.openCAPAs}</div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 min-w-[140px]">
              <div className="text-red-600 text-xs font-medium">Overdue</div>
              <div className="text-3xl font-bold text-red-700 mt-1">{stats.overdueCAPAs}</div>
            </div>

            {stats.pendingSync > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 min-w-[140px]">
                <div className="text-orange-600 text-xs font-medium">Pending Sync</div>
                <div className="text-3xl font-bold text-orange-700 mt-1">{stats.pendingSync}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white border-b overflow-x-auto">
        <div className="flex min-w-max">
          {[
            { key: 'assigned', label: 'Assigned to Me' },
            { key: 'all', label: 'All CAPAs' },
            { key: 'open', label: 'Open Only' },
            { key: 'overdue', label: 'Overdue' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-6 py-4 font-medium border-b-2 transition-colors whitespace-nowrap ${
                filter === tab.key
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* CAPA Cards - Mobile Optimized */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : filteredCapas.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">📋</div>
            <div className="text-gray-500">No CAPAs found</div>
          </div>
        ) : (
          filteredCapas.map((capa) => (
            <div
              key={capa.id}
              className="bg-white rounded-lg shadow border p-4 active:shadow-lg transition-shadow"
            >
              {/* CAPA Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="text-xs text-blue-600 font-mono font-bold">
                    {capa.capaNumber}
                  </div>
                  <div className="text-base font-bold mt-1 line-clamp-2">
                    {capa.title}
                  </div>
                </div>
                <span className={`ml-2 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                  capa.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                  capa.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                  capa.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {capa.priority}
                </span>
              </div>

              {/* Metadata */}
              <div className="flex gap-2 mb-3 text-xs">
                <span className={`px-2 py-1 rounded ${
                  capa.status === 'CLOSED' ? 'bg-green-100 text-green-800' :
                  capa.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {capa.status}
                </span>
                
                {capa.mobileMetadata?.photoUrls && capa.mobileMetadata.photoUrls.length > 0 && (
                  <span className="px-2 py-1 rounded bg-purple-100 text-purple-800">
                    📸 {capa.mobileMetadata.photoUrls.length}
                  </span>
                )}

                {capa.mobileMetadata?.voiceNoteUrl && (
                  <span className="px-2 py-1 rounded bg-indigo-100 text-indigo-800">
                    🎤 Voice
                  </span>
                )}
              </div>

              {/* Due Date */}
              <div className={`text-xs mb-3 ${
                new Date(capa.targetCompletionDate) < new Date() && capa.status !== 'CLOSED'
                  ? 'text-red-600 font-bold'
                  : 'text-gray-600'
              }`}>
                Due: {new Date(capa.targetCompletionDate).toLocaleDateString()}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => quickUpdateStatus(capa.id, 'IN_PROGRESS')}
                  disabled={capa.status === 'IN_PROGRESS'}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded font-medium text-sm active:bg-blue-200 disabled:opacity-50"
                >
                  In Progress
                </button>
                <button
                  onClick={() => quickUpdateStatus(capa.id, 'UNDER_REVIEW')}
                  disabled={capa.status === 'UNDER_REVIEW'}
                  className="px-3 py-2 bg-purple-100 text-purple-700 rounded font-medium text-sm active:bg-purple-200 disabled:opacity-50"
                >
                  Review
                </button>
                <button
                  onClick={() => quickUpdateStatus(capa.id, 'CLOSED')}
                  disabled={capa.status === 'CLOSED'}
                  className="px-3 py-2 bg-green-100 text-green-700 rounded font-medium text-sm active:bg-green-200 disabled:opacity-50"
                >
                  Close
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create CAPA Modal - Full Screen on Mobile */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Create New CAPA</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-white text-3xl leading-none"
              >
                &times;
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4 pb-24">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">Title *</label>
              <input
                type="text"
                value={newCapaTitle}
                onChange={(e) => setNewCapaTitle(e.target.value)}
                placeholder="Brief description of the issue"
                className="w-full border rounded-lg px-4 py-3 text-base"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">Description *</label>
              <textarea
                value={newCapaDescription}
                onChange={(e) => setNewCapaDescription(e.target.value)}
                placeholder="Detailed description, root cause, etc."
                rows={6}
                className="w-full border rounded-lg px-4 py-3 text-base"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium mb-2">Priority *</label>
              <div className="grid grid-cols-3 gap-2">
                {['HIGH', 'MEDIUM', 'LOW'].map((priority) => (
                  <button
                    key={priority}
                    onClick={() => setNewCapaPriority(priority as any)}
                    className={`py-3 rounded-lg font-bold transition-all ${
                      newCapaPriority === priority
                        ? priority === 'HIGH' ? 'bg-red-600 text-white' :
                          priority === 'MEDIUM' ? 'bg-yellow-500 text-white' :
                          'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo Capture */}
            <div>
              <label className="block text-sm font-medium mb-2">Photos (optional)</label>
              <button
                onClick={capturePhoto}
                className="w-full bg-purple-100 text-purple-700 py-4 rounded-lg font-bold active:bg-purple-200"
              >
                📸 Capture Photo
              </button>
              
              {capturedPhotos.length > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  {capturedPhotos.length} photo(s) captured
                </div>
              )}
            </div>

            {/* Offline Notice */}
            {!isOnline && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="text-orange-800 font-medium">📡 Offline Mode</div>
                <div className="text-orange-700 text-sm mt-1">
                  CAPA will be saved locally and synced when connection is restored.
                </div>
              </div>
            )}
          </div>

          {/* Fixed Bottom Buttons */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex gap-2">
            <button
              onClick={() => setShowCreateModal(false)}
              className="flex-1 bg-gray-200 text-gray-700 py-4 rounded-lg font-bold active:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={createMobileCapa}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-bold active:opacity-90"
            >
              {isOnline ? 'Create CAPA' : 'Save Offline'}
            </button>
          </div>
        </div>
      )}

      {/* PWA Install Prompt Hint */}
      <div className="fixed bottom-20 left-4 right-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-4 shadow-lg text-center text-sm">
        💡 <strong>Pro Tip:</strong> Add to Home Screen for offline access!
      </div>
    </div>
  )
}
