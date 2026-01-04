/**
 * Picker Mobile Interface
 * Voice-directed picking with container assignment
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Package, CheckCircle, AlertCircle, Volume2, Loader2 } from 'lucide-react';

interface PickerMobileProps {
  userId: string;
  warehouseId: string;
  organizationId: string;
}

interface VoiceSession {
  id: string;
  status: string;
  startedAt: string;
}

interface CurrentTask {
  type: 'ASSIGN_CONTAINER' | 'PICK_ITEM' | 'CONFIRM' | 'COMPLETE';
  instruction: string;
  data?: any;
}

export default function PickerMobile({ userId, warehouseId, organizationId }: PickerMobileProps) {
  // State management
  const [isListening, setIsListening] = useState(false);
  const [session, setSession] = useState<VoiceSession | null>(null);
  const [currentContainer, setCurrentContainer] = useState<string | null>(null);
  const [currentTask, setCurrentTask] = useState<CurrentTask>({
    type: 'ASSIGN_CONTAINER',
    instruction: 'Say a container number to begin (e.g., "T2134")',
  });
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  
  // Initialize voice session on mount
  useEffect(() => {
    startSession();
    setupWebSpeechAPI();
    
    return () => {
      if (session) {
        endSession();
      }
    };
  }, []);
  
  // Auto-read responses
  useEffect(() => {
    if (response) {
      speakResponse(response);
    }
  }, [response]);
  
  /**
   * Start voice session
   */
  const startSession = async () => {
    try {
      const res = await fetch('/api/voice/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionType: 'PICKING',
          warehouseId,
          taskType: 'VOICE_PICKING',
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSession(data.session);
        setResponse('Voice session started. Say a container number to begin.');
      }
    } catch (error) {
      console.error('Start session error:', error);
      setError('Failed to start voice session');
    }
  };
  
  /**
   * End voice session
   */
  const endSession = async () => {
    if (!session) return;
    
    try {
      await fetch('/api/voice/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          action: 'end',
        }),
      });
      
      setSession(null);
    } catch (error) {
      console.error('End session error:', error);
    }
  };
  
  /**
   * Setup Web Speech API for continuous listening
   */
  const setupWebSpeechAPI = () => {
    if (!('webkitSpeechRecognition' in window)) {
      console.warn('Web Speech API not supported');
      return;
    }
    
    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('Listening...');
    };
    
    recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const text = event.results[last][0].transcript;
      
      setTranscript(text);
      processVoiceInput(text);
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setError(`Voice error: ${event.error}`);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognitionRef.current = recognition;
  };
  
  /**
   * Toggle voice listening
   */
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };
  
  /**
   * Start listening
   */
  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setError(null);
      recognitionRef.current.start();
    }
  };
  
  /**
   * Stop listening
   */
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };
  
  /**
   * Process voice input
   */
  const processVoiceInput = async (text: string) => {
    if (!session) {
      setError('No active session');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Create audio blob for OpenAI Whisper (if needed)
      // For now, we'll use the transcript directly
      
      const formData = new FormData();
      
      // Convert text to audio blob (simplified - in production, use actual audio)
      const audioBlob = new Blob([text], { type: 'text/plain' });
      formData.append('audio', audioBlob, 'voice.txt');
      formData.append('sessionId', session.id);
      formData.append('context', JSON.stringify({
        taskType: currentTask.type,
        warehouseId,
        orderId: currentTask.data?.orderId,
        location: currentTask.data?.location,
        metadata: {
          organizationId,
          warehouseId,
          currentContainer,
        },
      }));
      
      const res = await fetch('/api/voice/process', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      
      if (data.success) {
        setResponse(data.responseText);
        
        // Handle action
        if (data.action) {
          handleAction(data.action, data);
        }
      } else {
        setError(data.error || 'Voice processing failed');
        setResponse(data.responseText || 'Please try again');
      }
      
    } catch (error) {
      console.error('Process voice input error:', error);
      setError('Failed to process voice command');
      setResponse('Sorry, I encountered an error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  /**
   * Handle action from voice command
   */
  const handleAction = async (action: any, voiceData: any) => {
    switch (action.type) {
      case 'CONTAINER_ASSIGNED':
        setCurrentContainer(action.data.containerNumber);
        setCurrentTask({
          type: 'PICK_ITEM',
          instruction: 'Container assigned. Start scanning or saying SKU numbers.',
          data: { containerId: action.data.containerId },
        });
        break;
        
      case 'ITEM_PICKED':
        // Add item to list
        const newItem = {
          sku: voiceData.entities?.sku || 'Unknown',
          quantity: voiceData.entities?.quantity || 1,
          timestamp: new Date().toISOString(),
        };
        setItems((prev) => [...prev, newItem]);
        setCurrentTask({
          type: 'PICK_ITEM',
          instruction: `Item added. ${items.length + 1} items picked. Continue or say "done".`,
          data: currentTask.data,
        });
        break;
        
      case 'HELP_REQUESTED':
        setCurrentTask({
          type: 'CONFIRM',
          instruction: 'Help request sent. Continue working while help arrives.',
          data: currentTask.data,
        });
        break;
        
      case 'TASK_COMPLETED':
        setCurrentTask({
          type: 'COMPLETE',
          instruction: `Great! ${items.length} items picked. Container ${currentContainer} complete.`,
        });
        // Reset after 5 seconds
        setTimeout(() => {
          setCurrentContainer(null);
          setItems([]);
          setCurrentTask({
            type: 'ASSIGN_CONTAINER',
            instruction: 'Say a container number to begin next pick.',
          });
        }, 5000);
        break;
    }
  };
  
  /**
   * Speak response using Text-to-Speech
   */
  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };
  
  /**
   * Manual container assignment
   */
  const assignContainerManually = async () => {
    const containerNumber = prompt('Enter container number (e.g., T2134):');
    
    if (containerNumber) {
      await processVoiceInput(containerNumber);
    }
  };
  
  /**
   * Manual item addition
   */
  const addItemManually = () => {
    const sku = prompt('Enter SKU:');
    const quantity = prompt('Enter quantity:');
    
    if (sku && quantity) {
      processVoiceInput(`${sku} quantity ${quantity}`);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Voice-Directed Picking</h1>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className={`w-2 h-2 rounded-full ${session ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>{session ? 'Session Active' : 'No Session'}</span>
        </div>
      </div>
      
      {/* Current Container */}
      {currentContainer && (
        <div className="bg-blue-600 p-4 rounded-lg mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-5 h-5" />
            <span className="font-semibold">Current Container</span>
          </div>
          <div className="text-2xl font-bold">{currentContainer}</div>
          <div className="text-sm text-blue-100 mt-1">
            {items.length} items picked
          </div>
        </div>
      )}
      
      {/* Current Task */}
      <div className="bg-gray-800 p-4 rounded-lg mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Volume2 className="w-5 h-5 text-green-500" />
          <span className="font-semibold">Instruction</span>
        </div>
        <p className="text-lg">{currentTask.instruction}</p>
      </div>
      
      {/* Voice Button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={toggleListening}
          disabled={isProcessing || !session}
          className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 scale-110'
              : 'bg-green-500 hover:bg-green-600'
          } ${isProcessing || !session ? 'opacity-50 cursor-not-allowed' : ''} shadow-lg`}
        >
          {isProcessing ? (
            <Loader2 className="w-12 h-12 animate-spin" />
          ) : isListening ? (
            <MicOff className="w-12 h-12" />
          ) : (
            <Mic className="w-12 h-12" />
          )}
        </button>
      </div>
      
      {/* Status Text */}
      <div className="text-center mb-4">
        <p className="text-sm text-gray-400">
          {isListening ? 'Listening...' : isProcessing ? 'Processing...' : 'Tap to speak'}
        </p>
      </div>
      
      {/* Transcript */}
      {transcript && (
        <div className="bg-gray-800 p-3 rounded-lg mb-3">
          <div className="text-xs text-gray-400 mb-1">You said:</div>
          <div className="text-sm">{transcript}</div>
        </div>
      )}
      
      {/* Response */}
      {response && (
        <div className="bg-green-900/30 border border-green-500 p-3 rounded-lg mb-3">
          <div className="text-xs text-green-400 mb-1">System:</div>
          <div className="text-sm">{response}</div>
        </div>
      )}
      
      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-500 p-3 rounded-lg mb-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-xs text-red-400 mb-1">Error:</div>
            <div className="text-sm">{error}</div>
          </div>
        </div>
      )}
      
      {/* Picked Items List */}
      {items.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <h3 className="font-semibold mb-3">Picked Items ({items.length})</h3>
          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-700 rounded"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="font-mono text-sm">{item.sku}</span>
                </div>
                <span className="text-sm text-gray-400">Qty: {item.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Manual Actions */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        <button
          onClick={assignContainerManually}
          className="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg transition"
        >
          <Package className="w-5 h-5 mx-auto mb-1" />
          <span className="text-sm">Assign Container</span>
        </button>
        
        <button
          onClick={addItemManually}
          disabled={!currentContainer}
          className="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle className="w-5 h-5 mx-auto mb-1" />
          <span className="text-sm">Add Item</span>
        </button>
      </div>
      
      {/* Session Controls */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <button
          onClick={() => {
            if (session) {
              endSession();
              window.location.reload();
            } else {
              startSession();
            }
          }}
          className="w-full bg-red-600 hover:bg-red-700 p-3 rounded-lg transition"
        >
          {session ? 'End Session' : 'Start Session'}
        </button>
      </div>
    </div>
  );
}
