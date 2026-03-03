"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  History,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";

interface CommandResult {
  id: string;
  timestamp: Date;
  input: string;
  intent: string;
  response: string;
  confidence: number;
  success: boolean;
  source: "voice" | "text";
}

const RESULT_COLORS: Record<string, string> = {
  success: "bg-green-50 border-green-200",
  error: "bg-red-50 border-red-200",
  info: "bg-blue-50 border-blue-200",
};

export default function VoiceDashboard() {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [textCommand, setTextCommand] = useState("");
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<CommandResult[]>([]);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const addResult = useCallback(
    (
      input: string,
      intent: string,
      response: string,
      confidence: number,
      success: boolean,
      source: "voice" | "text",
    ) => {
      setResults((prev) => [
        {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          input,
          intent,
          response,
          confidence,
          success,
          source,
        },
        ...prev.slice(0, 49), // keep last 50
      ]);
    },
    [],
  );

  // ── Text command submission ──────────────────────────────────────────────
  const submitTextCommand = async () => {
    const cmd = textCommand.trim();
    if (!cmd || processing) return;
    setProcessing(true);
    setTextCommand("");
    setStatusMsg(null);
    try {
      const res = await fetch("/api/voice/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cmd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Command failed");
      addResult(
        cmd,
        data.intent ?? "UNKNOWN",
        data.response ?? "",
        data.confidence ?? 1,
        true,
        "text",
      );
    } catch (err) {
      addResult(
        cmd,
        "ERROR",
        err instanceof Error ? err.message : "Unknown error",
        0,
        false,
        "text",
      );
    } finally {
      setProcessing(false);
    }
  };

  // ── Voice recording ──────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await submitAudio(blob);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setStatusMsg("Recording… tap the mic again to stop.");
    } catch {
      setStatusMsg("Microphone access denied — use text input below.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    setStatusMsg("Processing audio…");
  };

  const submitAudio = async (blob: Blob) => {
    setProcessing(true);
    setStatusMsg(null);
    try {
      const form = new FormData();
      form.append("audio", blob, "command.webm");
      const res = await fetch("/api/voice/process", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Voice processing failed");
      addResult(
        data.transcription ?? "(voice)",
        data.intent ?? "UNKNOWN",
        data.response ?? "",
        data.confidence ?? 1,
        true,
        "voice",
      );
    } catch (err) {
      addResult(
        "(voice input)",
        "ERROR",
        err instanceof Error ? err.message : "Unknown error",
        0,
        false,
        "voice",
      );
    } finally {
      setProcessing(false);
    }
  };

  const toggleRecording = () =>
    isRecording ? stopRecording() : startRecording();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Voice Commands</h1>
            <p className="mt-2 text-gray-600">
              Control warehouse operations hands-free with voice or text
              commands.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/voice/history")}
            className="flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            History
          </Button>
        </div>

        {/* Quick Reference */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-500" />
              Available Commands
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                "pick [qty] [SKU]",
                "putaway [SKU] to [location]",
                "ship order [ID]",
                "pack order [ID]",
                "transfer [qty] [item] to [location]",
                "receive [qty] [SKU]",
                "cycle count [location]",
                "batch pick",
                "move [SKU] to [location]",
                "scan [barcode]",
                "confirm",
                "cancel",
                "repeat",
                "status",
                "exception",
              ].map((cmd) => (
                <span
                  key={cmd}
                  className="px-2 py-1 bg-gray-100 rounded font-mono text-gray-600"
                >
                  {cmd}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Control Panel */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-6">
              {/* Big mic button */}
              <button
                onClick={toggleRecording}
                disabled={processing}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg ${
                  isRecording
                    ? "bg-red-500 hover:bg-red-600 animate-pulse"
                    : processing
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isRecording ? (
                  <MicOff className="h-10 w-10 text-white" />
                ) : (
                  <Mic className="h-10 w-10 text-white" />
                )}
              </button>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                {isRecording ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Recording — tap to stop
                  </>
                ) : processing ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                    Processing…
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-gray-300" />
                    Ready — tap mic or type below
                  </>
                )}
              </div>

              {statusMsg && (
                <p className="text-sm text-blue-600 bg-blue-50 px-4 py-2 rounded-lg">
                  {statusMsg}
                </p>
              )}

              {/* Text fallback */}
              <div className="w-full flex gap-2">
                <Input
                  placeholder="Type a command (e.g. pick 5 SKU-123)…"
                  value={textCommand}
                  onChange={(e) => setTextCommand(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitTextCommand()}
                  disabled={processing || isRecording}
                  className="flex-1"
                />
                <Button
                  onClick={submitTextCommand}
                  disabled={!textCommand.trim() || processing || isRecording}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Feed */}
        {results.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Session Log
            </h2>
            <div className="space-y-3">
              {results.map((r) => (
                <div
                  key={r.id}
                  className={`border rounded-lg p-4 ${
                    r.success ? RESULT_COLORS.success : RESULT_COLORS.error
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {r.source === "voice" ? (
                          <Volume2 className="h-3 w-3 text-gray-500" />
                        ) : (
                          <Send className="h-3 w-3 text-gray-500" />
                        )}
                        <span className="text-xs text-gray-500 font-mono">
                          {r.input}
                        </span>
                        <Badge variant="outline" className="text-xs font-mono">
                          {r.intent}
                        </Badge>
                        {r.confidence < 1 && (
                          <span className="text-xs text-gray-400">
                            {Math.round(r.confidence * 100)}% conf.
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-800">{r.response}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {r.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-xs text-gray-400">
                        {r.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
