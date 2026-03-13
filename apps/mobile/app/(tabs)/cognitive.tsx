import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  cognitiveApi,
  DecisionPayload,
  SimulationPayload,
} from "../../lib/api/cognitive";
import { useAuthStore } from "../../lib/store/auth.store";

export default function CognitiveScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleDecisionCycle = async () => {
    if (!user?.organizationId) return;
    setLoading(true);
    setResult(null);
    try {
      const payload: DecisionPayload = {
        organizationId: user.organizationId,
        event: "MANUAL_TRIGGER",
        metadata: { triggeredBy: user.id },
      };
      const response = await cognitiveApi.triggerDecisionCycle(payload);
      setResult(
        "Decision Cycle Completed:\n" + JSON.stringify(response, null, 2),
      );
    } catch (error: any) {
      setResult("Error: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handleRunSimulation = async () => {
    if (!user?.organizationId) return;
    setLoading(true);
    setResult(null);
    try {
      const payload: SimulationPayload = {
        organizationId: user.organizationId,
        scenarioType: "LABOR_STRESS_TEST",
        parameters: { laborShortage: 0.2 },
      };
      const response = await cognitiveApi.runSimulation(payload);
      setResult("Simulation Run:\n" + JSON.stringify(response, null, 2));
    } catch (error: any) {
      setResult("Error: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Cognitive Engine Control</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>Autonomous Decision Making</Text>
        <Text style={styles.description}>
          Manually trigger the cognitive loop to evaluate current stock levels,
          labor constraints, and financial thresholds.
        </Text>

        <TouchableOpacity
          style={[styles.button, loading && styles.disabledButton]}
          onPress={handleDecisionCycle}
          disabled={loading}
        >
          <Ionicons
            name="hardware-chip-outline"
            size={20}
            color="#FFF"
            style={styles.icon}
          />
          <Text style={styles.buttonText}>Trigger Decision Cycle</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <Text style={styles.subtitle}>Digital Twin Simulation</Text>
        <Text style={styles.description}>
          Run a predictive simulation to stress-test the current supply chain
          configuration against hypothetical scenarios.
        </Text>

        <TouchableOpacity
          style={[
            styles.button,
            styles.simButton,
            loading && styles.disabledButton,
          ]}
          onPress={handleRunSimulation}
          disabled={loading}
        >
          <Ionicons
            name="hardware-chip-outline"
            size={20}
            color="#FFF"
            style={styles.icon}
          />
          <Text style={styles.buttonText}>Run Simulation (Labor Stress)</Text>
        </TouchableOpacity>

        {loading && (
          <ActivityIndicator
            size="large"
            color="#2563EB"
            style={{ marginTop: 20 }}
          />
        )}

        {result && (
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>Result Output:</Text>
            <Text style={styles.resultText}>{result}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
  },
  content: {
    padding: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
    marginTop: 10,
  },
  description: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 16,
    lineHeight: 20,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 8,
    elevation: 2,
  },
  simButton: {
    backgroundColor: "#7C3AED",
  },
  disabledButton: {
    opacity: 0.6,
  },
  icon: {
    marginRight: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 24,
  },
  resultBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 8,
  },
  resultText: {
    fontSize: 13,
    color: "#334155",
    fontFamily: "monospace",
  },
});
