/**
 * WebSocket Service - Real-Time Updates
 * Pusher integration for live dashboard updates
 */

import Pusher from 'pusher';
import PusherClient from 'pusher-js';

// Server-side Pusher instance
let pusherServer: Pusher | null = null;

export function getPusherServer(): Pusher {
  if (!pusherServer) {
    pusherServer = new Pusher({
      appId: process.env.PUSHER_APP_ID || '',
      key: process.env.PUSHER_KEY || '',
      secret: process.env.PUSHER_SECRET || '',
      cluster: process.env.PUSHER_CLUSTER || 'us2',
      useTLS: true,
    });
  }
  return pusherServer;
}

// Client-side Pusher instance (for browser)
export function getPusherClient(): PusherClient {
  return new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY || '', {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
  });
}

/**
 * Trigger real-time event
 */
export async function triggerRealtimeEvent(
  channel: string,
  event: string,
  data: any
) {
  try {
    const pusher = getPusherServer();
    await pusher.trigger(channel, event, data);
    return true;
  } catch (error) {
    console.error('Pusher trigger error:', error);
    return false;
  }
}

/**
 * Channel naming conventions
 */
export const CHANNELS = {
  // Warehouse-specific channels
  warehouse: (warehouseId: string) => `warehouse-${warehouseId}`,
  
  // Load sheet updates
  loadSheet: (loadSheetId: string) => `loadsheet-${loadSheetId}`,
  loadSheets: (warehouseId: string) => `loadsheets-${warehouseId}`,
  
  // Container updates
  container: (containerId: string) => `container-${containerId}`,
  containers: (warehouseId: string) => `containers-${warehouseId}`,
  
  // Bay door updates
  bayDoor: (doorId: string) => `baydoor-${doorId}`,
  bayDoors: (warehouseId: string) => `baydoors-${warehouseId}`,
  
  // Voice session updates
  voiceSession: (sessionId: string) => `voice-${sessionId}`,
  
  // AI supervision updates
  supervision: (workerId: string) => `supervision-${workerId}`,
  interventions: (warehouseId: string) => `interventions-${warehouseId}`,
  
  // Collaboration updates
  collaboration: (requestId: string) => `collab-${requestId}`,
  collaborations: (userId: string) => `collabs-${userId}`,
  
  // Wave picking updates
  wave: (waveId: string) => `wave-${waveId}`,
  waves: (warehouseId: string) => `waves-${warehouseId}`,
};

/**
 * Event types
 */
export const EVENTS = {
  // Load sheet events
  LOAD_SHEET_CREATED: 'loadsheet:created',
  LOAD_SHEET_UPDATED: 'loadsheet:updated',
  LOAD_SHEET_APPROVED: 'loadsheet:approved',
  LOAD_SHEET_DISTRIBUTED: 'loadsheet:distributed',
  LOAD_SHEET_DEPARTED: 'loadsheet:departed',
  
  // Container events
  CONTAINER_CREATED: 'container:created',
  CONTAINER_UPDATED: 'container:updated',
  CONTAINER_ITEM_ADDED: 'container:item-added',
  CONTAINER_ASSIGNED: 'container:assigned',
  
  // Bay door events
  BAY_DOOR_ASSIGNED: 'baydoor:assigned',
  BAY_DOOR_RELEASED: 'baydoor:released',
  BAY_DOOR_STATUS_CHANGED: 'baydoor:status-changed',
  
  // Voice events
  VOICE_COMMAND_PROCESSED: 'voice:command-processed',
  VOICE_SESSION_STARTED: 'voice:session-started',
  VOICE_SESSION_ENDED: 'voice:session-ended',
  
  // AI supervision events
  INTERVENTION_CREATED: 'intervention:created',
  INTERVENTION_ACKNOWLEDGED: 'intervention:acknowledged',
  INTERVENTION_RESOLVED: 'intervention:resolved',
  PERFORMANCE_UPDATED: 'performance:updated',
  
  // Collaboration events
  COLLABORATION_REQUESTED: 'collab:requested',
  COLLABORATION_ACCEPTED: 'collab:accepted',
  COLLABORATION_COMPLETED: 'collab:completed',
  MESSAGE_SENT: 'collab:message',
  
  // Wave picking events
  WAVE_CREATED: 'wave:created',
  WAVE_RELEASED: 'wave:released',
  WAVE_COMPLETED: 'wave:completed',
  ORDER_STATUS_CHANGED: 'order:status-changed',
};

/**
 * Helper functions for common events
 */

export async function notifyLoadSheetUpdate(loadSheetId: string, loadSheet: any) {
  await triggerRealtimeEvent(
    CHANNELS.loadSheet(loadSheetId),
    EVENTS.LOAD_SHEET_UPDATED,
    loadSheet
  );
}

export async function notifyContainerUpdate(containerId: string, container: any) {
  await triggerRealtimeEvent(
    CHANNELS.container(containerId),
    EVENTS.CONTAINER_UPDATED,
    container
  );
}

export async function notifyBayDoorUpdate(doorId: string, door: any) {
  await triggerRealtimeEvent(
    CHANNELS.bayDoor(doorId),
    EVENTS.BAY_DOOR_STATUS_CHANGED,
    door
  );
}

export async function notifyIntervention(warehouseId: string, intervention: any) {
  await triggerRealtimeEvent(
    CHANNELS.interventions(warehouseId),
    EVENTS.INTERVENTION_CREATED,
    intervention
  );
}

export async function notifyCollaborationRequest(userId: string, request: any) {
  await triggerRealtimeEvent(
    CHANNELS.collaborations(userId),
    EVENTS.COLLABORATION_REQUESTED,
    request
  );
}

export async function notifyWaveUpdate(waveId: string, wave: any) {
  await triggerRealtimeEvent(
    CHANNELS.wave(waveId),
    EVENTS.WAVE_RELEASED,
    wave
  );
}

/**
 * Subscribe to channel (client-side hook)
 */
export function useRealtimeChannel(channelName: string, eventName: string, callback: (data: any) => void) {
  if (typeof window === 'undefined') return;

  const pusher = getPusherClient();
  const channel = pusher.subscribe(channelName);
  
  channel.bind(eventName, callback);
  
  return () => {
    channel.unbind(eventName, callback);
    pusher.unsubscribe(channelName);
  };
}
