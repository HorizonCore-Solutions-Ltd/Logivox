'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Box,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Fab,
} from '@mui/material';
import {
  PlayArrow,
  CheckCircle,
  Error,
  QrCodeScanner,
  FilterList,
  Refresh,
  CloudOff,
  CloudDone,
} from '@mui/icons-material';
import { OfflineSyncService, SyncState } from '@/lib/services/offline-sync.service';

interface Task {
  id: string;
  taskNumber: string;
  taskType: string;
  status: string;
  priority: number;
  scheduledFor: Date | null;
  warehouse: {
    name: string;
  };
  fromLocation: {
    name: string;
  } | null;
  toLocation: {
    name: string;
  } | null;
  inventoryItem: {
    name: string;
    sku: string;
  } | null;
}

export default function MobileTaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [syncState, setSyncState] = useState<SyncState>({
    lastSyncAt: null,
    pendingChanges: 0,
    isSyncing: false,
    lastError: null,
  });

  useEffect(() => {
    loadTasks();
    updateSyncState();
    
    // Initialize offline sync
    OfflineSyncService.initialize();
    
    // Update sync state periodically
    const interval = setInterval(updateSyncState, 5000);
    
    return () => clearInterval(interval);
  }, [statusFilter, typeFilter]);

  const updateSyncState = () => {
    const state = OfflineSyncService.getSyncState();
    setSyncState(state);
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('taskType', typeFilter);
      
      const response = await fetch(`/api/mobile/tasks?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        setTasks(result.data.tasks);
        
        // Cache for offline use
        OfflineSyncService.setCachedData('tasks', result.data.tasks);
      } else {
        throw new Error('Failed to load tasks');
      }
    } catch (err) {
      // Try to load from cache
      const cachedTasks = OfflineSyncService.getCachedData<Task[]>('tasks');
      
      if (cachedTasks) {
        setTasks(cachedTasks);
        setError('Showing cached data (offline mode)');
      } else {
        setError('Failed to load tasks');
      }
      
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startTask = async (taskId: string) => {
    try {
      if (OfflineSyncService.isOnline()) {
        const response = await fetch(`/api/mobile/tasks/${taskId}/start`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        });
        
        if (response.ok) {
          loadTasks();
        } else {
          throw new Error('Failed to start task');
        }
      } else {
        // Queue for offline sync
        OfflineSyncService.queueChange('task', 'UPDATE', {
          id: taskId,
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        });
        
        // Update local state
        setTasks(tasks.map((task) =>
          task.id === taskId
            ? { ...task, status: 'IN_PROGRESS' }
            : task
        ));
        
        updateSyncState();
      }
    } catch (err) {
      setError('Failed to start task');
      console.error(err);
    }
  };

  const handleSync = async () => {
    setSyncState({ ...syncState, isSyncing: true });
    
    try {
      const result = await OfflineSyncService.sync();
      
      if (result.success) {
        await loadTasks();
        updateSyncState();
      } else {
        setError('Sync failed - will retry automatically');
      }
    } catch (err) {
      setError('Sync error occurred');
      console.error(err);
    } finally {
      setSyncState({ ...syncState, isSyncing: false });
    }
  };

  const getAuthToken = (): string => {
    return localStorage.getItem('auth_token') || '';
  };

  const getStatusColor = (status: string): 'default' | 'primary' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'PENDING':
        return 'default';
      case 'IN_PROGRESS':
        return 'primary';
      case 'COMPLETED':
        return 'success';
      case 'PAUSED':
        return 'warning';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityLabel = (priority: number): string => {
    if (priority >= 8) return 'Urgent';
    if (priority >= 5) return 'High';
    if (priority >= 3) return 'Medium';
    return 'Low';
  };

  const getPriorityColor = (priority: number): 'error' | 'warning' | 'info' | 'default' => {
    if (priority >= 8) return 'error';
    if (priority >= 5) return 'warning';
    if (priority >= 3) return 'info';
    return 'default';
  };

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      {/* Sync status banner */}
      <Card sx={{ mb: 2, backgroundColor: OfflineSyncService.isOnline() ? '#e8f5e9' : '#fff3e0' }}>
        <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {OfflineSyncService.isOnline() ? (
                <CloudDone fontSize="small" color="success" />
              ) : (
                <CloudOff fontSize="small" color="warning" />
              )}
              <Typography variant="body2">
                {OfflineSyncService.isOnline() ? 'Online' : 'Offline'}
                {syncState.pendingChanges > 0 && ` • ${syncState.pendingChanges} pending`}
              </Typography>
            </Box>
            
            <IconButton
              size="small"
              onClick={handleSync}
              disabled={syncState.isSyncing || !OfflineSyncService.isOnline()}
            >
              {syncState.isSyncing ? <CircularProgress size={20} /> : <Refresh fontSize="small" />}
            </IconButton>
          </Box>
        </CardContent>
      </Card>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          select
          size="small"
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ flex: 1 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="PENDING">Pending</MenuItem>
          <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
          <MenuItem value="COMPLETED">Completed</MenuItem>
        </TextField>
        
        <TextField
          select
          size="small"
          label="Type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          sx={{ flex: 1 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="PUTAWAY">Putaway</MenuItem>
          <MenuItem value="PICKING">Picking</MenuItem>
          <MenuItem value="REPLENISHMENT">Replenishment</MenuItem>
          <MenuItem value="CYCLE_COUNT">Cycle Count</MenuItem>
        </TextField>
      </Box>

      {error && (
        <Alert severity={error.includes('offline') ? 'info' : 'error'} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <List sx={{ p: 0 }}>
          {tasks.length === 0 ? (
            <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', mt: 4 }}>
              No tasks found
            </Typography>
          ) : (
            tasks.map((task) => (
              <Card key={task.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                      {task.taskNumber}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Chip
                        label={getPriorityLabel(task.priority)}
                        size="small"
                        color={getPriorityColor(task.priority)}
                      />
                      <Chip
                        label={task.status}
                        size="small"
                        color={getStatusColor(task.status)}
                      />
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {task.taskType}
                  </Typography>
                  
                  {task.inventoryItem && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>{task.inventoryItem.sku}</strong> - {task.inventoryItem.name}
                    </Typography>
                  )}
                  
                  <Box sx={{ display: 'flex', gap: 2, fontSize: '0.875rem', color: 'text.secondary' }}>
                    <span>📍 {task.warehouse.name}</span>
                    {task.fromLocation && <span>From: {task.fromLocation.name}</span>}
                    {task.toLocation && <span>To: {task.toLocation.name}</span>}
                  </Box>
                  
                  {task.status === 'PENDING' && (
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      <IconButton
                        color="primary"
                        onClick={() => startTask(task.id)}
                      >
                        <PlayArrow />
                      </IconButton>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </List>
      )}

      {/* Floating scan button */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
        onClick={() => {
          // Open barcode scanner
          console.log('Open barcode scanner');
        }}
      >
        <QrCodeScanner />
      </Fab>
    </Box>
  );
}
