import { useState, useRef, useCallback } from "react";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { readAsStringAsync } from "expo-file-system";
import { transcribeAudio, processVoiceCommand } from "@/lib/api/voice";
import type { VoiceCommandResult } from "@/lib/api/voice";

type RecordingState = "idle" | "recording" | "processing" | "error";

interface UseVoiceCommandOptions {
  screen?: string;
  warehouseId?: string;
  onCommand?: (result: VoiceCommandResult) => void;
  onError?: (error: string) => void;
}

export function useVoiceCommand(options: UseVoiceCommandOptions = {}) {
  const [state, setState] = useState<RecordingState>("idle");
  const [transcript, setTranscript] = useState<string | null>(null);
  const [result, setResult] = useState<VoiceCommandResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  // ── Start recording ────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      setState("recording");
      setError(null);
      setTranscript(null);
      setResult(null);

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        throw new Error("Microphone permission denied");
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      await recording.startAsync();
      recordingRef.current = recording;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Recording failed";
      setError(msg);
      setState("error");
      options.onError?.(msg);
    }
  }, [options]);

  // ── Stop recording + transcribe + process ─────────────────────────────────
  const stopRecording = useCallback(async () => {
    if (!recordingRef.current || state !== "recording") return;

    try {
      setState("processing");
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const recording = recordingRef.current;
      await recording.stopAndUnloadAsync();

      const uri = recording.getURI();
      recordingRef.current = null;

      if (!uri) throw new Error("No audio recorded");

      // Read file as base64
      const base64 = await readAsStringAsync(uri, {
        encoding: "base64",
      } as Parameters<typeof readAsStringAsync>[1]);

      // Transcribe → process
      const { transcript: text } = await transcribeAudio(base64, "audio/m4a");
      setTranscript(text);

      const commandResult = await processVoiceCommand(text, {
        screen: options.screen,
        warehouseId: options.warehouseId,
      });

      setResult(commandResult);
      setState("idle");

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      options.onCommand?.(commandResult);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Processing failed";
      setError(msg);
      setState("error");
      options.onError?.(msg);
    }
  }, [state, options]);

  const reset = useCallback(() => {
    setState("idle");
    setError(null);
    setTranscript(null);
    setResult(null);
  }, []);

  return {
    state,
    transcript,
    result,
    error,
    isRecording: state === "recording",
    isProcessing: state === "processing",
    startRecording,
    stopRecording,
    reset,
  };
}
