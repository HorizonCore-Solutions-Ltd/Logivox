/**
 * Voice Control System for LogiVox
 *
 * Browser-based speech recognition using Web Speech API (FREE!)
 *
 * Features:
 * - Voice navigation: "Go to inventory", "Open reports", "Check alerts"
 * - Voice data entry: "Add 100 units to Product ABC"
 * - Voice search: "Find supplier XYZ", "Show customers in New York"
 * - Accessibility integration (screen reader compatible)
 * - Hands-free operation for warehouse workers
 * - Multi-language support
 * - Noise filtering and accuracy improvements
 */

// Text-to-speech helper function
const speak = (text: string): void => {
  if ("speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }
};

export interface VoiceCommand {
  patterns: string[];
  description: string;
  action: (params: Record<string, string>) => void | Promise<void>;
  category: "navigation" | "data-entry" | "search" | "action";
  parameters?: {
    name: string;
    type: "number" | "string" | "product" | "customer" | "supplier";
    required: boolean;
  }[];
  requiresAuth?: boolean;
}

// Web Speech API types
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export interface VoiceState {
  listening: boolean;
  supported: boolean;
  transcript: string;
  confidence: number;
  lastCommand: string | null;
  error: string | null;
}

// ==========================================
// VOICE COMMAND DEFINITIONS
// ==========================================

export const VOICE_COMMANDS: VoiceCommand[] = [
  // Marketing & Public Navigation
  {
    patterns: [
      "go to homepage",
      "open home",
      "show landing",
      "go to marketing",
    ],
    description: "Navigate to the LogiVox homepage",
    action: () => {
      window.location.href = "/";
    },
    category: "navigation",
  },
  {
    patterns: ["show features", "go to features", "open features"],
    description: "Jump to the features section",
    action: () => {
      window.location.href = "/#features";
    },
    category: "navigation",
  },
  {
    patterns: ["show pricing", "open pricing", "go to pricing"],
    description: "Jump to pricing on the marketing page",
    action: () => {
      window.location.href = "/#pricing";
    },
    category: "navigation",
  },
  {
    patterns: ["show proof", "open trust", "customer proof", "show trust"],
    description: "Jump to the trust and proof section",
    action: () => {
      window.location.href = "/#trust";
    },
    category: "navigation",
  },
  {
    patterns: [
      "start free trial",
      "get started",
      "start now",
      "open call to action",
    ],
    description: "Jump to the get started call-to-action",
    action: () => {
      window.location.href = "/#get-started";
    },
    category: "navigation",
  },
  {
    patterns: ["login", "log in", "sign in"],
    description: "Open the sign-in page",
    action: () => {
      window.location.href = "/sign-in";
    },
    category: "navigation",
  },
  {
    patterns: ["sign up", "create account", "register"],
    description: "Open the sign-up page",
    action: () => {
      window.location.href = "/sign-up";
    },
    category: "navigation",
  },
  {
    patterns: ["open docs", "documentation", "api docs"],
    description: "Open the documentation portal",
    action: () => {
      window.location.href = "/docs";
    },
    category: "navigation",
  },
  {
    patterns: ["contact support", "open support", "talk to support"],
    description: "Navigate to the support page",
    action: () => {
      window.location.href = "/services/support";
    },
    category: "navigation",
  },
  {
    patterns: [
      "open voice guide",
      "voice help",
      "voice cheat sheet",
      "voice support",
    ],
    description: "Open the voice browser guide and cheat sheet",
    action: () => {
      window.location.href = "/voice-browser";
    },
    category: "navigation",
  },

  // Navigation Commands
  {
    patterns: [
      "go to inventory",
      "open inventory",
      "show inventory",
      "navigate to inventory",
    ],
    description: "Navigate to inventory page",
    action: () => {
      window.location.href = "/dashboard/inventory";
    },
    category: "navigation",
    requiresAuth: true,
  },
  {
    patterns: [
      "go to reports",
      "open reports",
      "show reports",
      "navigate to reports",
    ],
    description: "Navigate to reports page",
    action: () => {
      window.location.href = "/dashboard/reports";
    },
    category: "navigation",
    requiresAuth: true,
  },
  {
    patterns: ["check alerts", "show alerts", "open alerts", "view alerts"],
    description: "Navigate to alerts page",
    action: () => {
      window.location.href = "/dashboard/alerts";
    },
    category: "navigation",
    requiresAuth: true,
  },
  {
    patterns: ["go to dashboard", "open dashboard", "show dashboard", "home"],
    description: "Navigate to dashboard",
    action: () => {
      window.location.href = "/dashboard";
    },
    category: "navigation",
    requiresAuth: true,
  },
  {
    patterns: ["go to bookings", "open bookings", "show bookings"],
    description: "Navigate to bookings page",
    action: () => {
      window.location.href = "/dashboard/bookings";
    },
    category: "navigation",
    requiresAuth: true,
  },
  {
    patterns: ["go to customers", "open customers", "show customers"],
    description: "Navigate to customers page",
    action: () => {
      window.location.href = "/dashboard/customers";
    },
    category: "navigation",
    requiresAuth: true,
  },
  {
    patterns: ["go to suppliers", "open suppliers", "show suppliers"],
    description: "Navigate to suppliers page",
    action: () => {
      window.location.href = "/dashboard/suppliers";
    },
    category: "navigation",
  },
  {
    patterns: ["go to settings", "open settings", "show settings"],
    description: "Navigate to settings page",
    action: () => {
      window.location.href = "/dashboard/settings";
    },
    category: "navigation",
    requiresAuth: true,
  },

  // Search Commands
  {
    patterns: ["find {product}", "search for {product}", "look for {product}"],
    description: "Search for a product",
    action: (params) => {
      const product = params.product || "";
      const searchUrl = `/dashboard/inventory?search=${encodeURIComponent(product)}`;
      window.location.href = searchUrl;
    },
    category: "search",
    parameters: [{ name: "product", type: "string", required: true }],
    requiresAuth: true,
  },
  {
    patterns: [
      "find customer {customer}",
      "search customer {customer}",
      "look for customer {customer}",
    ],
    description: "Search for a customer",
    action: (params) => {
      const customer = params.customer || "";
      const searchUrl = `/dashboard/customers?search=${encodeURIComponent(customer)}`;
      window.location.href = searchUrl;
    },
    category: "search",
    parameters: [{ name: "customer", type: "string", required: true }],
    requiresAuth: true,
  },
  {
    patterns: [
      "find supplier {supplier}",
      "search supplier {supplier}",
      "look for supplier {supplier}",
    ],
    description: "Search for a supplier",
    action: (params) => {
      const supplier = params.supplier || "";
      const searchUrl = `/dashboard/suppliers?search=${encodeURIComponent(supplier)}`;
      window.location.href = searchUrl;
    },
    category: "search",
    parameters: [{ name: "supplier", type: "string", required: true }],
  },

  // Data Entry Commands
  {
    patterns: [
      "add {quantity} units to {product}",
      "add {quantity} of {product}",
      "increase {product} by {quantity}",
      "stock {quantity} {product}",
    ],
    description: "Add inventory to a product",
    action: (params) => {
      // TODO: Implement inventory adjustment
      console.log(`Adding ${params.quantity} units to ${params.product}`);
      // This would open a form or directly update inventory
    },
    category: "data-entry",
    parameters: [
      { name: "quantity", type: "number", required: true },
      { name: "product", type: "string", required: true },
    ],
    requiresAuth: true,
  },
  {
    patterns: [
      "book {quantity} {product} for {customer}",
      "reserve {quantity} {product} for {customer}",
      "create booking {quantity} {product} for {customer}",
    ],
    description: "Create a booking",
    action: (params) => {
      // TODO: Implement booking creation
      console.log(
        `Booking ${params.quantity} ${params.product} for ${params.customer}`,
      );
      // This would open booking form with pre-filled data
    },
    category: "data-entry",
    parameters: [
      { name: "quantity", type: "number", required: true },
      { name: "product", type: "string", required: true },
      { name: "customer", type: "string", required: true },
    ],
    requiresAuth: true,
  },

  // Action Commands
  {
    patterns: ["refresh", "reload", "update page"],
    description: "Refresh current page",
    action: () => window.location.reload(),
    category: "action",
  },
  {
    patterns: ["help", "show help", "voice commands", "what can I say"],
    description: "Show voice command help",
    action: () => {
      // TODO: Open voice command help modal
      console.log("Voice command help requested");
    },
    category: "action",
  },
  {
    patterns: ["stop listening", "stop voice", "turn off voice"],
    description: "Stop voice recognition",
    action: () => {
      // Handled by voice recognition system
    },
    category: "action",
  },

  // ==========================================
  // VEHICLE & LOAD OPTIMIZATION COMMANDS
  // ==========================================

  {
    patterns: [
      "recommend vehicle for order {orderNumber}",
      "what vehicle for order {orderNumber}",
      "suggest vehicle for order {orderNumber}",
      "which vehicle for order {orderNumber}",
    ],
    description: "Recommend vehicle for an order",
    action: async (params) => {
      try {
        const response = await fetch("/api/vehicle-types/recommend-for-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderNumber: params.orderNumber }),
        });
        const data = await response.json();

        if (data.success && data.vehicle) {
          speak(
            `Recommended ${data.vehicle.name}. ${Math.round(data.utilization.volumePercent)} percent utilization.`,
          );
        } else {
          speak("No suitable vehicle found.");
        }
      } catch (error) {
        console.error("Vehicle recommendation error:", error);
        speak("Error getting vehicle recommendation.");
      }
    },
    category: "action",
    parameters: [{ name: "orderNumber", type: "string", required: true }],
    requiresAuth: true,
  },

  {
    patterns: [
      "show vehicle types",
      "list vehicles",
      "what vehicles are available",
      "show available vehicles",
    ],
    description: "Show available vehicle types",
    action: () => {
      window.location.href = "/dashboard/vehicle-types";
    },
    category: "navigation",
    requiresAuth: true,
  },

  {
    patterns: [
      "what vehicle fits {volume} cubic feet",
      "which vehicle for {volume} cubic feet",
      "recommend vehicle for {volume} cubic feet",
    ],
    description: "Find vehicle by volume capacity",
    action: async (params) => {
      try {
        const volume = parseFloat(params.volume ?? "0");
        const response = await fetch("/api/vehicle-types/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            totalVolumeCubicFeet: volume,
            totalWeightLbs: volume * 10, // Rough estimate
            region: "UK",
          }),
        });
        const data = await response.json();

        if (data.success && data.recommended) {
          speak(
            `${data.recommended.name} can fit ${volume} cubic feet. Total capacity ${data.recommended.volumeCubicFeet} cubic feet.`,
          );
        } else {
          speak("No vehicle found for that volume.");
        }
      } catch (error) {
        console.error("Vehicle search error:", error);
        speak("Error finding vehicle.");
      }
    },
    category: "search",
    parameters: [{ name: "volume", type: "number", required: true }],
    requiresAuth: true,
  },

  {
    patterns: [
      "optimize load for order {orderNumber}",
      "plan load for order {orderNumber}",
      "calculate load for order {orderNumber}",
    ],
    description: "Optimize load plan for an order",
    action: async (params) => {
      try {
        const response = await fetch("/api/load-optimization/optimize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderNumber: params.orderNumber }),
        });
        const data = await response.json();

        if (data.success) {
          speak(
            `Load plan created. ${data.vehicle.name} with ${Math.round(data.loadPlan.utilization.volumePercent)} percent utilization.`,
          );
        } else {
          speak("Error creating load plan.");
        }
      } catch (error) {
        console.error("Load optimization error:", error);
        speak("Error optimizing load.");
      }
    },
    category: "action",
    parameters: [{ name: "orderNumber", type: "string", required: true }],
    requiresAuth: true,
  },

  {
    patterns: [
      "show {region} vehicles",
      "list {region} vehicle types",
      "what {region} vehicles do we have",
    ],
    description: "Show vehicles for a specific region",
    action: (params) => {
      const region = (params.region ?? "US").toUpperCase();
      window.location.href = `/dashboard/vehicle-types?region=${region}`;
    },
    category: "navigation",
    parameters: [{ name: "region", type: "string", required: true }],
    requiresAuth: true,
  },

  {
    patterns: ["stop listening", "stop voice", "turn off voice"],
    description: "Stop voice recognition",
    action: () => {
      // This will be handled by the VoiceControl component
      window.dispatchEvent(new CustomEvent("voice-stop-listening"));
    },
    category: "action",
  },
];

// ==========================================
// VOICE CONTROL ENGINE
// ==========================================

export class VoiceControlEngine {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private listeners: ((state: VoiceState) => void)[] = [];
  private currentState: VoiceState = {
    listening: false,
    supported: false,
    transcript: "",
    confidence: 0,
    lastCommand: null,
    error: null,
  };

  constructor() {
    this.initializeSpeechRecognition();
  }

  private initializeSpeechRecognition(): void {
    // Check for browser support
    const SpeechRecognition =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.updateState({
        supported: false,
        error: "Speech recognition not supported",
      });
      return;
    }

    this.recognition = new SpeechRecognition();

    if (!this.recognition) {
      this.updateState({
        supported: false,
        error: "Failed to create speech recognition",
      });
      return;
    }

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = "en-US";
    this.recognition.maxAlternatives = 3;

    // Event handlers
    this.recognition.onstart = () => {
      this.updateState({ listening: true, error: null });
    };

    this.recognition.onend = () => {
      this.updateState({ listening: false });

      // Auto-restart if we're supposed to be listening
      if (this.isListening) {
        setTimeout(() => this.startListening(), 100);
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("[VoiceControl] Speech recognition error:", event.error);

      let errorMessage = "Speech recognition error";
      switch (event.error) {
        case "no-speech":
          errorMessage = "No speech detected";
          break;
        case "audio-capture":
          errorMessage = "Microphone not available";
          break;
        case "not-allowed":
          errorMessage = "Microphone permission denied";
          break;
        case "network":
          errorMessage = "Network error";
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }

      this.updateState({ error: errorMessage, listening: false });
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result || !result[0]) continue;

        const transcript = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        const lastResult = event.results[event.results.length - 1];
        const confidence =
          lastResult && lastResult[0] ? lastResult[0].confidence : 0;
        this.updateState({
          transcript: finalTranscript.trim(),
          confidence: confidence || 0,
        });

        // Process the command
        this.processCommand(finalTranscript.trim(), confidence || 0);
      } else if (interimTranscript) {
        this.updateState({ transcript: interimTranscript.trim() });
      }
    };

    this.updateState({ supported: true });

    // Listen for custom events
    window.addEventListener("voice-stop-listening", () => {
      this.stopListening();
    });
  }

  private updateState(updates: Partial<VoiceState>): void {
    this.currentState = { ...this.currentState, ...updates };
    this.listeners.forEach((listener) => listener(this.currentState));
  }

  private processCommand(transcript: string, confidence: number): void {
    console.log(
      `[VoiceControl] Processing: "${transcript}" (confidence: ${confidence})`,
    );

    // Minimum confidence threshold
    if (confidence < 0.7) {
      console.log("[VoiceControl] Low confidence, ignoring command");
      return;
    }

    const normalizedTranscript = transcript.toLowerCase().trim();

    // Find matching command
    for (const command of VOICE_COMMANDS) {
      const match = this.matchCommand(normalizedTranscript, command);
      if (match) {
        console.log(`[VoiceControl] Matched command: ${command.description}`);

        // Check authentication requirement
        if (command.requiresAuth && !this.isUserAuthenticated()) {
          this.updateState({ error: "Command requires authentication" });
          return;
        }

        try {
          command.action(match.parameters);
          this.updateState({
            lastCommand: transcript,
            error: null,
          });
        } catch (error) {
          console.error("[VoiceControl] Command execution error:", error);
          this.updateState({ error: "Failed to execute command" });
        }
        return;
      }
    }

    console.log("[VoiceControl] No matching command found");
    this.updateState({ error: "Command not recognized" });
  }

  private matchCommand(
    transcript: string,
    command: VoiceCommand,
  ): { parameters: Record<string, string> } | null {
    for (const pattern of command.patterns) {
      const match = this.matchPattern(transcript, pattern);
      if (match) {
        return { parameters: match };
      }
    }
    return null;
  }

  private matchPattern(
    transcript: string,
    pattern: string,
  ): Record<string, string> | null {
    // Convert pattern to regex
    // {product} -> (?<product>.*?)
    const regexPattern = pattern.replace(/\{(\w+)\}/g, "(?<$1>.*?)");
    const regex = new RegExp(`^${regexPattern}$`, "i");

    const match = transcript.match(regex);
    if (match && match.groups) {
      // Clean up captured groups
      const parameters: Record<string, string> = {};
      for (const [key, value] of Object.entries(match.groups)) {
        parameters[key] = value.trim();
      }
      return parameters;
    }

    return null;
  }

  private isUserAuthenticated(): boolean {
    // TODO: Check actual authentication status
    // This would check for session token, etc.
    return (
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/dashboard")
    );
  }

  startListening(): void {
    if (!this.recognition) {
      this.updateState({ error: "Speech recognition not available" });
      return;
    }

    if (!this.isListening) {
      this.isListening = true;
      try {
        this.recognition.start();
      } catch (error) {
        console.error("[VoiceControl] Failed to start recognition:", error);
        this.updateState({ error: "Failed to start voice recognition" });
        this.isListening = false;
      }
    }
  }

  stopListening(): void {
    this.isListening = false;
    if (this.recognition) {
      this.recognition.stop();
    }
    this.updateState({ listening: false, transcript: "" });
  }

  isSupported(): boolean {
    return this.currentState.supported;
  }

  getState(): VoiceState {
    return this.currentState;
  }

  onStateChange(listener: (state: VoiceState) => void): void {
    this.listeners.push(listener);
  }

  offStateChange(listener: (state: VoiceState) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // Request microphone permission
  async requestPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop()); // Clean up
      return true;
    } catch (error) {
      console.error("[VoiceControl] Microphone permission denied:", error);
      this.updateState({ error: "Microphone permission required" });
      return false;
    }
  }
}

// ==========================================
// ACCESSIBILITY HELPERS
// ==========================================

/**
 * Announce text to screen readers
 */
export function announceToScreenReader(text: string): void {
  const announcement = document.createElement("div");
  announcement.setAttribute("aria-live", "polite");
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only";
  announcement.textContent = text;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Get voice command help text for screen readers
 */
export function getVoiceCommandsHelp(): string {
  const commandsByCategory = VOICE_COMMANDS.reduce(
    (acc, cmd) => {
      if (!acc[cmd.category]) {
        acc[cmd.category] = [];
      }
      acc[cmd.category]!.push(cmd);
      return acc;
    },
    {} as Record<string, VoiceCommand[]>,
  );

  let help = "Voice commands available: ";

  Object.entries(commandsByCategory).forEach(([category, commands]) => {
    help += `${category}: `;
    commands.forEach((cmd) => {
      help += `${cmd.patterns[0]}, `;
    });
  });

  return help;
}

// ==========================================
// REACT HOOKS
// ==========================================

import { useState, useEffect, useRef } from "react";

export function useVoiceControl() {
  const [state, setState] = useState<VoiceState>({
    listening: false,
    supported: false,
    transcript: "",
    confidence: 0,
    lastCommand: null,
    error: null,
  });

  const engineRef = useRef<VoiceControlEngine | null>(null);

  useEffect(() => {
    engineRef.current = new VoiceControlEngine();

    const handleStateChange = (newState: VoiceState) => {
      setState(newState);
    };

    engineRef.current.onStateChange(handleStateChange);
    setState(engineRef.current.getState());

    return () => {
      if (engineRef.current) {
        engineRef.current.offStateChange(handleStateChange);
        engineRef.current.stopListening();
      }
    };
  }, []);

  const startListening = () => {
    engineRef.current?.startListening();
  };

  const stopListening = () => {
    engineRef.current?.stopListening();
  };

  const requestPermission = async () => {
    return await engineRef.current?.requestPermission();
  };

  return {
    ...state,
    startListening,
    stopListening,
    requestPermission,
    isSupported: () => engineRef.current?.isSupported() ?? false,
  };
}
