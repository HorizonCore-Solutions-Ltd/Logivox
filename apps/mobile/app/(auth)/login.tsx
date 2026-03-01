import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as LocalAuthentication from "expo-local-authentication";
import * as Haptics from "expo-haptics";
import { useAuthStore } from "@/lib/store/auth.store";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signInWithBiometric, signInWithCode, biometricEnabled, isLoading, error, clearError } =
    useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [accessCode, setAccessCode] = useState("");

  const handleCodeAccess = async () => {
    if (!accessCode.trim()) return;
    try {
        await signInWithCode(accessCode);
        setShowCodeModal(false);
        router.replace("/(tabs)");
    } catch (e) {
        // error handling by store
    }
  };

  useEffect(() => {
    checkBiometric();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert("Sign In Failed", error, [
        { text: "OK", onPress: clearError },
      ]);
    }
  }, [error]);

  const checkBiometric = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(compatible && enrolled && biometricEnabled);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Required", "Please enter your email and password.");
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await signIn(email.trim().toLowerCase(), password);
      router.replace("/(tabs)");
    } catch {
      // Error handled by store
    }
  };

  const handleBiometric = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const success = await signInWithBiometric();
    if (success) {
      router.replace("/(tabs)");
    } else {
      Alert.alert("Biometric Failed", "Could not authenticate. Please use your password.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inner}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>FS</Text>
          </View>
          <Text style={styles.appName}>Flowstock</Text>
          <Text style={styles.tagline}>Warehouse Management System</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
        <Modal visible={showCodeModal} animationType="slide" transparent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1, justifyContent: 'flex-end'}}>
                <TouchableOpacity style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)'}} onPress={() => setShowCodeModal(false)} />
                <View style={{backgroundColor: '#1e293b', padding: 24, borderTopLeftRadius: 16, borderTopRightRadius: 16}}>
                    <Text style={{fontSize: 18, color: '#fff', fontWeight: 'bold', marginBottom: 12}}>Emergency Driver Access</Text>
                    <Text style={{color: '#94a3b8', marginBottom: 16}}>Enter your one-time service code provided by dispatch.</Text>
                    <TextInput 
                        style={[styles.input, { marginBottom: 16, textAlign: 'center', fontSize: 24, letterSpacing: 4 }]} 
                        placeholder="000"
                        placeholderTextColor="#475569"
                        keyboardType="number-pad"
                        maxLength={3}
                        value={accessCode}
                        onChangeText={setAccessCode}
                        autoFocus
                    />
                    <TouchableOpacity 
                        style={[styles.loginButton, {backgroundColor: '#f97316'}]}
                        onPress={handleCodeAccess}
                        disabled={isLoading}
                    >
                         {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Enter Service Mode</Text>}
                    </TouchableOpacity>
                     <TouchableOpacity style={{alignItems: 'center', padding: 16}} onPress={() => setShowCodeModal(false)}>
                        <Text style={{color: '#94a3b8'}}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>

          <Text style={styles.welcomeText}>Welcome back</Text>
          <Text style={styles.subText}>Sign in to your account</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                textContentType="password"
                autoComplete="password"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeText}>{showPassword ? "Hide" : "Show"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {biometricAvailable && (
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometric}
            >
              <Text style={styles.biometricIcon}>🔐</Text>
              <Text style={styles.biometricText}>
                Sign in with{" "}
                {Platform.OS === "ios" ? "Face ID / Touch ID" : "Biometrics"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity onPress={() => setShowCodeModal(true)}>
            <Text style={{textAlign: 'center', color: '#6366f1', marginTop: 16, fontWeight: '600'}}>
                Emergency Driver? Access Here
            </Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          © 2026 Flowstock. All rights reserved.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
  },
  appName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#f8fafc",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  form: {
    backgroundColor: "#1e293b",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: 4,
  },
  subText: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#f8fafc",
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  eyeButton: {
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  eyeText: {
    color: "#6366f1",
    fontSize: 13,
    fontWeight: "600",
  },
  loginButton: {
    backgroundColor: "#6366f1",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  biometricButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 8,
  },
  biometricIcon: {
    fontSize: 20,
  },
  biometricText: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    textAlign: "center",
    color: "#334155",
    fontSize: 12,
    marginTop: 32,
  },
});
