import { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import { Mic, MicOff, X } from "lucide-react-native";
import { useVoiceCommand } from "@/lib/hooks/useVoiceCommand";
import type { VoiceCommandResult } from "@/lib/api/voice";

interface VoiceCommandButtonProps {
  /** Current screen name for context-aware commands */
  screen?: string;
  warehouseId?: string;
  onCommand?: (result: VoiceCommandResult) => void;
}

/**
 * Floating microphone button.
 *
 * Press (start) → hold → release to transcribe + process a voice command.
 * Shows a transcript bubble and the AI response while processing.
 */
export function VoiceCommandButton({ screen, warehouseId, onCommand }: VoiceCommandButtonProps) {
  const { state, transcript, result, error, startRecording, stopRecording, reset } =
    useVoiceCommand({ screen, warehouseId, onCommand });

  // Pulsing animation ring while recording
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (state === "recording") {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.6,
            duration: 700,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.current.start();
    } else {
      pulseLoop.current?.stop();
      pulseAnim.setValue(1);
    }
  }, [state, pulseAnim]);

  const isRecording = state === "recording";
  const isProcessing = state === "processing";
  const hasResult = state === "idle" && (result || error);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Transcript / result bubble */}
      {(isRecording || isProcessing || hasResult) && (
        <View style={styles.bubble}>
          {isProcessing && (
            <View style={styles.processingRow}>
              <ActivityIndicator size="small" color="#2563EB" />
              <Text style={styles.processingText}>Processing…</Text>
            </View>
          )}
          {transcript && !isProcessing && (
            <Text style={styles.transcriptText}>"{transcript}"</Text>
          )}
          {result && !isProcessing && (
            <Text style={styles.resultText}>{result.response}</Text>
          )}
          {error && !isProcessing && (
            <Text style={styles.errorText}>{error}</Text>
          )}
          {isRecording && !transcript && (
            <Text style={styles.listeningText}>Listening…</Text>
          )}
          {hasResult && (
            <TouchableOpacity style={styles.dismissBtn} onPress={reset}>
              <X color="#94A3B8" size={14} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Pulse ring */}
      {isRecording && (
        <Animated.View
          style={[
            styles.pulseRing,
            { transform: [{ scale: pulseAnim }], opacity: pulseAnim.interpolate({ inputRange: [1, 1.6], outputRange: [0.35, 0] }) },
          ]}
          pointerEvents="none"
        />
      )}

      {/* Microphone button */}
      <TouchableOpacity
        style={[
          styles.micButton,
          isRecording && styles.micButtonActive,
          isProcessing && styles.micButtonProcessing,
        ]}
        onPressIn={startRecording}
        onPressOut={stopRecording}
        activeOpacity={0.85}
        accessibilityLabel="Voice command"
        accessibilityHint="Hold to speak a command"
      >
        {isProcessing ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : isRecording ? (
          <MicOff color="#fff" size={26} />
        ) : (
          <Mic color="#fff" size={26} />
        )}
      </TouchableOpacity>
    </View>
  );
}

const MIC_SIZE = 60;
const RING_SIZE = MIC_SIZE + 28;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 24,
    right: 20,
    alignItems: "flex-end",
    gap: 12,
  },
  bubble: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    maxWidth: 280,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 4,
    position: "relative",
  },
  processingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  processingText: { fontSize: 14, color: "#2563EB", fontWeight: "600" },
  listeningText: { fontSize: 14, color: "#94A3B8", fontStyle: "italic" },
  transcriptText: { fontSize: 14, color: "#475569", fontStyle: "italic", marginBottom: 4 },
  resultText: { fontSize: 14, color: "#0F172A", fontWeight: "600", lineHeight: 20 },
  errorText: { fontSize: 14, color: "#DC2626", fontWeight: "500" },
  dismissBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 4,
  },
  pulseRing: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    backgroundColor: "#2563EB",
    marginBottom: (RING_SIZE - MIC_SIZE) / -2,
    marginRight: (RING_SIZE - MIC_SIZE) / -2,
  },
  micButton: {
    width: MIC_SIZE,
    height: MIC_SIZE,
    borderRadius: MIC_SIZE / 2,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2563EB",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 10,
  },
  micButtonActive: { backgroundColor: "#DC2626", shadowColor: "#DC2626" },
  micButtonProcessing: { backgroundColor: "#7C3AED", shadowColor: "#7C3AED" },
});
