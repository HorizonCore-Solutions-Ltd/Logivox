/**
 * Voice-Directed CAPA Component
 * Hands-free CAPA workflows using voice commands
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Mic,
  MicOff,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface VoiceResponse {
  success: boolean;
  voiceResponse: string;
  nextStep?: string;
  capa?: any;
  error?: string;
}

export default function VoiceDirectedCAPAPage() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [command, setCommand] = useState<string>("CREATE_CAPA");
  const [currentCAPA, setCurrentCAPA] = useState<any>(null);
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: "user" | "system"; message: string }>
  >([]);
  const [context, setContext] = useState<any>({});

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Web Speech API
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setTranscript(transcript);
        handleVoiceCommand(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        toast.error("Voice recognition error. Please try again.");
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      toast.error("Voice recognition not supported in this browser");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [command, currentCAPA]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleVoiceCommand = async (voiceTranscript: string) => {
    setIsProcessing(true);

    // Add user message to history
    setConversationHistory((prev) => [
      ...prev,
      { role: "user", message: voiceTranscript },
    ]);

    try {
      const response = await fetch("/api/capa/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command,
          transcript: voiceTranscript,
          capaId: currentCAPA?.id,
          context,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process voice command");
      }

      const result: VoiceResponse = await response.json();

      // Add system response to history
      setConversationHistory((prev) => [
        ...prev,
        { role: "system", message: result.voiceResponse },
      ]);

      // Speak response
      speakResponse(result.voiceResponse);

      // Update state based on response
      if (result.capa) {
        setCurrentCAPA(result.capa);
      }

      if (result.nextStep) {
        setCommand(result.nextStep);
      }

      if (result.success) {
        toast.success("Command processed successfully");
      }
    } catch (error) {
      console.error("Error processing voice command:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to process command";
      toast.error(errorMessage);

      setConversationHistory((prev) => [
        ...prev,
        { role: "system", message: `Error: ${errorMessage}` },
      ]);

      speakResponse(`Error: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const resetWorkflow = () => {
    setCommand("CREATE_CAPA");
    setCurrentCAPA(null);
    setConversationHistory([]);
    setContext({});
    setTranscript("");
  };

  const getCommandBadge = (cmd: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      CREATE_CAPA: { label: "Create CAPA", color: "bg-blue-100 text-blue-800" },
      ADD_ACTION: { label: "Add Action", color: "bg-green-100 text-green-800" },
      INTERVIEW_5WHYS: {
        label: "5 Whys Interview",
        color: "bg-purple-100 text-purple-800",
      },
      UPDATE_STATUS: {
        label: "Update Status",
        color: "bg-yellow-100 text-yellow-800",
      },
      VERIFY_EFFECTIVENESS: {
        label: "Verify",
        color: "bg-pink-100 text-pink-800",
      },
      SEARCH_CAPA: { label: "Search", color: "bg-gray-100 text-gray-800" },
    };

    const badge = badges[cmd] || { label: cmd, color: "bg-gray-100 text-gray-800" };
    return <Badge className={badge.color}>{badge.label}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Voice-Directed CAPA</h1>
          <p className="text-gray-600 mt-1">
            Hands-free CAPA creation and management
          </p>
        </div>
        <Button variant="outline" onClick={resetWorkflow}>
          New Workflow
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Voice Control Panel */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Voice Control</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Command */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Command</label>
              {getCommandBadge(command)}
            </div>

            {/* Current CAPA */}
            {currentCAPA && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm font-medium text-blue-900">
                  {currentCAPA.capaNumber}
                </div>
                <div className="text-xs text-blue-700 mt-1">
                  {currentCAPA.problemStatement?.substring(0, 50)}...
                </div>
              </div>
            )}

            {/* Voice Button */}
            <div className="flex flex-col items-center justify-center py-8">
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing}
                className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all ${
                  isListening
                    ? "bg-red-500 hover:bg-red-600 animate-pulse"
                    : isProcessing
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="h-12 w-12 text-white animate-spin" />
                ) : isListening ? (
                  <MicOff className="h-12 w-12 text-white" />
                ) : (
                  <Mic className="h-12 w-12 text-white" />
                )}
              </button>

              <p className="text-sm text-gray-600 mt-4 text-center">
                {isProcessing
                  ? "Processing..."
                  : isListening
                  ? "Listening... Speak now"
                  : "Click to start voice command"}
              </p>
            </div>

            {/* Transcript */}
            {transcript && (
              <div className="bg-gray-50 border rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">You said:</div>
                <div className="text-sm">{transcript}</div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Quick Commands</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCommand("CREATE_CAPA")}
                >
                  Create
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCommand("SEARCH_CAPA")}
                >
                  Search
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCommand("INTERVIEW_5WHYS")}
                  disabled={!currentCAPA}
                >
                  5 Whys
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCommand("ADD_ACTION")}
                  disabled={!currentCAPA}
                >
                  Add Action
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversation History */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Conversation History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {conversationHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Mic className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Start speaking to create or manage CAPAs</p>
                  <p className="text-sm mt-2">
                    Try: "Create a CAPA for defective welds on station 5"
                  </p>
                </div>
              ) : (
                conversationHistory.map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 ${
                      item.role === "user" ? "justify-end" : ""
                    }`}
                  >
                    {item.role === "system" && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}

                    <div
                      className={`flex-1 max-w-[80%] rounded-lg p-3 ${
                        item.role === "user"
                          ? "bg-gray-100 text-gray-900"
                          : "bg-blue-50 text-blue-900"
                      }`}
                    >
                      <div className="text-xs font-medium mb-1 opacity-60">
                        {item.role === "user" ? "You" : "System"}
                      </div>
                      <div className="text-sm">{item.message}</div>
                    </div>

                    {item.role === "user" && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                          <Mic className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Help Card */}
      <Card>
        <CardHeader>
          <CardTitle>Voice Command Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Create CAPA</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>"Create a CAPA for damaged packaging"</li>
                <li>"Report critical issue with forklift brakes"</li>
                <li>"Document low severity labeling error"</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">5 Whys Interview</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>"The machine overheated"</li>
                <li>"Because the coolant level was low"</li>
                <li>"The maintenance schedule was not followed"</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Add Actions</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>"Immediately shut down line 3"</li>
                <li>"Retrain all operators on safety procedures"</li>
                <li>"Prevent by implementing daily checks"</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
