import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { login, logout, getSession, type AuthResponse } from "@/lib/api/auth";
import { requestEmergencyAccess } from "@/lib/api/delivery";
import { tokenStorage } from "@/lib/api/client";
import { useAddOnsStore } from "./addons.store";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string;
  avatar?: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  biometricEnabled: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signInWithCode: (code: string) => Promise<void>;
  signOut: () => Promise<void>;
  enableBiometric: () => Promise<boolean>;
  disableBiometric: () => Promise<void>;
  signInWithBiometric: () => Promise<boolean>;
  clearError: () => void;
}

const BIOMETRIC_KEY = "flowstock_biometric_enabled";
const BIOMETRIC_EMAIL_KEY = "flowstock_biometric_email";

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  biometricEnabled: false,
  error: null,

  // ── Initialize: restore session from stored token ─────────────────────────
  initialize: async () => {
    try {
      set({ isLoading: true });
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        set({ isLoading: false });
        return;
      }

      const user = await getSession();
      const biometricEnabled =
        (await AsyncStorage.getItem(BIOMETRIC_KEY)) === "true";

      if (user) {
        set({ user, isAuthenticated: true, biometricEnabled });
        // Hydrate add-on state for this tenant (non-blocking)
        useAddOnsStore.getState().load();
      }
    } catch {
      await tokenStorage.clearTokens();
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Sign in with email + password ──────────────────────────────────────────
  signIn: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await login({ email, password });
      set({
        user: response.user,
        isAuthenticated: true,
        error: null,
      });
      // Hydrate add-on state for this tenant (non-blocking)
      useAddOnsStore.getState().load();
      return response;
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Invalid email or password";
      set({ error: message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  signInWithCode: async (code: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data } = await requestEmergencyAccess(code);
      const { user, token, runId } = data as any; // Assuming API returns user, token, runId

      if (!token || !user) throw new Error("Invalid response from server");

      await tokenStorage.setAccessToken(token);
      // Emergency logins might not have refresh tokens or use samesite cookies
      // We'll set a dummy refresh token if needed or handle expiration gracefully
      
      set({ user, isAuthenticated: true, error: null, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || "Code access failed" });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Sign out ───────────────────────────────────────────────────────────────
  signOut: async () => {
    try {
      await logout();
    } finally {
      set({ user: null, isAuthenticated: false, error: null });
      // Reset add-ons back to static defaults so stale tenant data is cleared
      useAddOnsStore.getState().reset();
    }
  },

  // ── Enable biometric authentication ───────────────────────────────────────
  enableBiometric: async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();

    if (!compatible || !enrolled) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Authenticate to enable biometric login",
      cancelLabel: "Cancel",
    });

    if (result.success) {
      await AsyncStorage.setItem(BIOMETRIC_KEY, "true");
      const { user } = get();
      if (user?.email) {
        await AsyncStorage.setItem(BIOMETRIC_EMAIL_KEY, user.email);
      }
      set({ biometricEnabled: true });
      return true;
    }
    return false;
  },

  // ── Disable biometric authentication ───────────────────────────────────────
  disableBiometric: async () => {
    await AsyncStorage.removeItem(BIOMETRIC_KEY);
    set({ biometricEnabled: false });
  },

  // ── Sign in with biometric ─────────────────────────────────────────────────
  signInWithBiometric: async () => {
    const biometricEnabled =
      (await AsyncStorage.getItem(BIOMETRIC_KEY)) === "true";
    if (!biometricEnabled) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Sign in to Flowstock",
      cancelLabel: "Use password",
      fallbackLabel: "Use password",
    });

    if (result.success) {
      // Re-validate stored token
      const user = await getSession();
      if (user) {
        set({ user, isAuthenticated: true });
        return true;
      }
    }
    return false;
  },

  clearError: () => set({ error: null }),
}));
