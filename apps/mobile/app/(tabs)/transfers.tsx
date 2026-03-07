import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { transferApi, ManualTransferPayload } from "../../lib/api/transfers";
import { useAuthStore } from "../../lib/store/auth.store";

export default function TransfersScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Form State
  const [targetOrgId, setTargetOrgId] = useState("");
  const [sku, setSku] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [result, setResult] = useState<string | null>(null);

  const handleCreateTransfer = async () => {
    if (!user?.organizationId) {
      Alert.alert("Error", "No active organization session.");
      return;
    }
    if (!targetOrgId || !sku || !quantity) {
      Alert.alert("Validation", "Please fill in all fields.");
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const payload: ManualTransferPayload = {
        sourceOrgId: user.organizationId,
        targetOrgId: targetOrgId, // In a real app, this would be a dropdown of known partners
        sku: sku,
        quantity: parseInt(quantity, 10),
        requesterId: user.id,
      };

      const response = await transferApi.createManualTransfer(payload);
      setResult(
        "Transfer Created Successfully:\n" + JSON.stringify(response, null, 2),
      );
    } catch (error: any) {
      setResult(
        "Error creating transfer: " + (error.message || "Unknown error"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGlobalRecall = async () => {
    if (!user?.organizationId) return;
    setLoading(true);
    setResult(null);
    try {
      // Assuming current org is the main DC for this context
      const response = await transferApi.runGlobalRecall(user.organizationId);
      setResult(
        "Recall Analysis Initiated:\n" + JSON.stringify(response, null, 2),
      );
    } catch (error: any) {
      setResult("Error running recall: " + (error.message || "Unknown error"));
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
        <Text style={styles.title}>Global Logistics & Transfers</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionHeader}>Create Manual Transfer</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Target Organization ID</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. org_12345"
            value={targetOrgId}
            onChangeText={setTargetOrgId}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>SKU</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. WIDGET-A"
            value={sku}
            onChangeText={setSku}
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Quantity</Text>
          <TextInput
            style={styles.input}
            placeholder="10"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.disabledButton]}
          onPress={handleCreateTransfer}
          disabled={loading}
        >
          <Ionicons
            name="paper-plane-outline"
            size={20}
            color="#FFF"
            style={styles.icon}
          />
          <Text style={styles.buttonText}>Submit Transfer Request</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <Text style={styles.sectionHeader}>Network Management</Text>
        <Text style={styles.description}>
          Initiate a global recall to identify stagnant inventory across all
          connected nodes and return it to the central DC.
        </Text>

        <TouchableOpacity
          style={[
            styles.button,
            styles.recallButton,
            loading && styles.disabledButton,
          ]}
          onPress={handleGlobalRecall}
          disabled={loading}
        >
          <Ionicons
            name="refresh-circle-outline"
            size={20}
            color="#FFF"
            style={styles.icon}
          />
          <Text style={styles.buttonText}>Trigger Global Recall</Text>
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
  sectionHeader: {
    fontSize: 18,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 16,
    marginTop: 8,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#1E293B",
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
    backgroundColor: "#10B981",
    paddingVertical: 14,
    borderRadius: 8,
    elevation: 2,
    marginTop: 8,
  },
  recallButton: {
    backgroundColor: "#DC2626", // Red for recall
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
