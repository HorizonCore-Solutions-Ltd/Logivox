/**
 * Marshal Mobile App
 * Loading guidance and container placement for dock workers
 */

'use client';

import { useState, useEffect } from 'react';
import { Truck, Package, CheckCircle, AlertTriangle, ArrowRight, Eye, Camera, Zap } from 'lucide-react';

interface Container {
  id: string;
  containerNumber: string;
  weight: number;
  volume: number;
  status: string;
  loadSequence?: number;
  placementZone?: string;
  specialHandling?: string;
  containerItems: Array<{
    id: string;
    productName: string;
    quantity: number;
    weight: number;
    isFragile: boolean;
    isHazmat: boolean;
  }>;
}

interface LoadSheet {
  id: string;
  loadSheetNumber: string;
  customer: {
    name: string;
  };
  bayDoor?: {
    doorNumber: string;
  };
  trailerNumber?: string;
  driverName?: string;
  totalContainers: number;
  containers: Container[];
}

export default function MarshalMobile() {
  const [loadSheets, setLoadSheets] = useState<LoadSheet[]>([]);
  const [selectedLoadSheet, setSelectedLoadSheet] = useState<LoadSheet | null>(null);
  const [currentContainer, setCurrentContainer] = useState<Container | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [loadedContainers, setLoadedContainers] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchActiveLoadSheets();
  }, []);

  const fetchActiveLoadSheets = async () => {
    try {
      const response = await fetch('/api/loadsheets?status=CONFIRMED');
      const data = await response.json();
      
      if (data.loadSheets) {
        // Filter load sheets with bay door assignments
        const activeSheets = data.loadSheets.filter((ls: LoadSheet) => ls.bayDoor);
        setLoadSheets(activeSheets);
      }
      setLoading(false);
    } catch (error) {
      console.error('Fetch error:', error);
      setLoading(false);
    }
  };

  const selectLoadSheet = (loadSheet: LoadSheet) => {
    setSelectedLoadSheet(loadSheet);
    
    // Sort containers by load sequence
    const sortedContainers = [...loadSheet.containers].sort((a, b) => {
      const seqA = a.loadSequence || 999;
      const seqB = b.loadSequence || 999;
      return seqA - seqB;
    });
    
    // Find first unloaded container
    const nextContainer = sortedContainers.find(
      (c) => !loadedContainers.has(c.id) && c.status !== 'SHIPPED'
    );
    
    if (nextContainer) {
      setCurrentContainer(nextContainer);
    }
  };

  const scanContainer = async () => {
    setScanning(true);
    
    // Simulate barcode scan (in production, use device camera API)
    setTimeout(() => {
      setScanning(false);
      
      if (currentContainer) {
        confirmContainerLoaded(currentContainer.id);
      }
    }, 1500);
  };

  const confirmContainerLoaded = async (containerId: string) => {
    try {
      // Update container status
      const response = await fetch('/api/containers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          containerId,
          status: 'IN_TRANSIT',
        }),
      });

      if (response.ok) {
        // Mark as loaded
        setLoadedContainers((prev) => new Set([...prev, containerId]));
        
        // Move to next container
        if (selectedLoadSheet) {
          const sortedContainers = [...selectedLoadSheet.containers].sort((a, b) => {
            const seqA = a.loadSequence || 999;
            const seqB = b.loadSequence || 999;
            return seqA - seqB;
          });
          
          const nextContainer = sortedContainers.find(
            (c) => !loadedContainers.has(c.id) && c.id !== containerId && c.status !== 'SHIPPED'
          );
          
          if (nextContainer) {
            setCurrentContainer(nextContainer);
          } else {
            // All containers loaded
            setCurrentContainer(null);
            alert('All containers loaded! Load sheet complete.');
          }
        }
      }
    } catch (error) {
      console.error('Confirm error:', error);
      alert('Error confirming container load');
    }
  };

  const markLoadSheetDeparted = async () => {
    if (!selectedLoadSheet) return;
    
    try {
      const response = await fetch('/api/loadsheets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loadSheetId: selectedLoadSheet.id,
          action: 'depart',
        }),
      });

      if (response.ok) {
        alert('Load sheet marked as departed!');
        setSelectedLoadSheet(null);
        setCurrentContainer(null);
        setLoadedContainers(new Set());
        fetchActiveLoadSheets();
      }
    } catch (error) {
      console.error('Depart error:', error);
      alert('Error marking load sheet as departed');
    }
  };

  const getProgress = () => {
    if (!selectedLoadSheet) return 0;
    const total = selectedLoadSheet.totalContainers;
    const loaded = loadedContainers.size;
    return Math.round((loaded / total) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Marshal</h1>
            <p className="text-sm text-gray-400">Loading Guidance</p>
          </div>
          <Truck className="w-8 h-8 text-blue-400" />
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {!selectedLoadSheet ? (
          /* Load Sheet Selection */
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-3">Active Load Sheets</h2>
            
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
              </div>
            ) : loadSheets.length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-8 text-center">
                <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No active load sheets</p>
              </div>
            ) : (
              loadSheets.map((loadSheet) => (
                <div
                  key={loadSheet.id}
                  onClick={() => selectLoadSheet(loadSheet)}
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-blue-500 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{loadSheet.loadSheetNumber}</h3>
                      <p className="text-sm text-gray-400">{loadSheet.customer.name}</p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-blue-400" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {loadSheet.bayDoor && (
                      <div>
                        <span className="text-gray-400">Bay Door:</span>
                        <span className="ml-2 font-semibold">{loadSheet.bayDoor.doorNumber}</span>
                      </div>
                    )}
                    {loadSheet.trailerNumber && (
                      <div>
                        <span className="text-gray-400">Trailer:</span>
                        <span className="ml-2 font-semibold">{loadSheet.trailerNumber}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-400">Containers:</span>
                      <span className="ml-2 font-semibold">{loadSheet.totalContainers}</span>
                    </div>
                    {loadSheet.driverName && (
                      <div>
                        <span className="text-gray-400">Driver:</span>
                        <span className="ml-2 font-semibold">{loadSheet.driverName}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Loading Guidance */
          <div className="space-y-4">
            {/* Load Sheet Info */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg">{selectedLoadSheet.loadSheetNumber}</h3>
                  <p className="text-sm text-gray-400">{selectedLoadSheet.customer.name}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedLoadSheet(null);
                    setCurrentContainer(null);
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition"
                >
                  Back
                </button>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-400">Loading Progress</span>
                  <span className="font-semibold">{getProgress()}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${getProgress()}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-400">Loaded:</span>
                  <span className="ml-2 font-semibold text-green-400">
                    {loadedContainers.size} / {selectedLoadSheet.totalContainers}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Bay Door:</span>
                  <span className="ml-2 font-semibold">
                    {selectedLoadSheet.bayDoor?.doorNumber || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Current Container */}
            {currentContainer ? (
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-6 border-2 border-blue-400">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-blue-200 text-sm mb-1">LOAD NEXT</p>
                    <h2 className="text-3xl font-bold">{currentContainer.containerNumber}</h2>
                  </div>
                  {currentContainer.loadSequence && (
                    <div className="bg-blue-900 bg-opacity-50 rounded-full w-16 h-16 flex items-center justify-center">
                      <span className="text-2xl font-bold">#{currentContainer.loadSequence}</span>
                    </div>
                  )}
                </div>

                {/* Container Details */}
                <div className="space-y-3 mb-6">
                  <div className="bg-blue-900 bg-opacity-50 rounded-lg p-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-blue-200">Weight</p>
                        <p className="font-bold text-lg">{currentContainer.weight}kg</p>
                      </div>
                      <div>
                        <p className="text-blue-200">Volume</p>
                        <p className="font-bold text-lg">{currentContainer.volume.toFixed(2)}m³</p>
                      </div>
                    </div>
                  </div>

                  {currentContainer.placementZone && (
                    <div className="bg-yellow-500 bg-opacity-20 border border-yellow-400 rounded-lg p-3">
                      <p className="text-yellow-200 text-xs mb-1">PLACEMENT ZONE</p>
                      <p className="font-bold text-lg">{currentContainer.placementZone}</p>
                    </div>
                  )}

                  {/* Special Handling */}
                  {currentContainer.specialHandling && (
                    <div className="bg-red-500 bg-opacity-20 border border-red-400 rounded-lg p-3 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <div>
                        <p className="text-red-200 text-xs">SPECIAL HANDLING</p>
                        <p className="font-semibold">{currentContainer.specialHandling}</p>
                      </div>
                    </div>
                  )}

                  {/* Item Flags */}
                  {currentContainer.containerItems && (
                    <div className="flex gap-2">
                      {currentContainer.containerItems.some((item) => item.isFragile) && (
                        <div className="bg-orange-500 bg-opacity-20 border border-orange-400 rounded px-3 py-1 text-xs font-semibold">
                          FRAGILE
                        </div>
                      )}
                      {currentContainer.containerItems.some((item) => item.isHazmat) && (
                        <div className="bg-red-500 bg-opacity-20 border border-red-400 rounded px-3 py-1 text-xs font-semibold">
                          HAZMAT
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Scan Button */}
                <button
                  onClick={scanContainer}
                  disabled={scanning}
                  className="w-full bg-white text-blue-900 py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-3 hover:bg-blue-50 transition disabled:opacity-50"
                >
                  {scanning ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-900"></div>
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Camera className="w-6 h-6" />
                      Scan Container
                    </>
                  )}
                </button>

                {/* Manual Confirm */}
                <button
                  onClick={() => confirmContainerLoaded(currentContainer.id)}
                  disabled={scanning}
                  className="w-full mt-3 bg-blue-700 hover:bg-blue-600 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <CheckCircle className="w-5 h-5" />
                  Confirm Loaded
                </button>
              </div>
            ) : (
              /* All Loaded */
              <div className="bg-green-600 rounded-lg p-8 text-center">
                <CheckCircle className="w-20 h-20 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">All Containers Loaded!</h2>
                <p className="text-green-100 mb-6">
                  {selectedLoadSheet.totalContainers} containers loaded successfully
                </p>
                
                <button
                  onClick={markLoadSheetDeparted}
                  className="w-full bg-white text-green-900 py-4 rounded-lg font-bold text-lg hover:bg-green-50 transition"
                >
                  Mark as Departed
                </button>
              </div>
            )}

            {/* Container List */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="font-semibold mb-3">All Containers</h3>
              <div className="space-y-2">
                {selectedLoadSheet.containers
                  .sort((a, b) => (a.loadSequence || 999) - (b.loadSequence || 999))
                  .map((container) => {
                    const isLoaded = loadedContainers.has(container.id);
                    const isCurrent = currentContainer?.id === container.id;
                    
                    return (
                      <div
                        key={container.id}
                        className={`p-3 rounded-lg flex items-center justify-between ${
                          isCurrent
                            ? 'bg-blue-600 border-2 border-blue-400'
                            : isLoaded
                            ? 'bg-green-900 bg-opacity-30 border border-green-600'
                            : 'bg-gray-700 border border-gray-600'
                        }`}
                      >
                        <div>
                          <div className="font-semibold">{container.containerNumber}</div>
                          <div className="text-xs text-gray-400">
                            {container.weight}kg • {container.volume.toFixed(1)}m³
                          </div>
                        </div>
                        
                        {isLoaded ? (
                          <CheckCircle className="w-6 h-6 text-green-400" />
                        ) : isCurrent ? (
                          <Zap className="w-6 h-6 text-blue-400 animate-pulse" />
                        ) : (
                          <div className="text-gray-500 text-sm">
                            {container.loadSequence ? `#${container.loadSequence}` : 'Pending'}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
