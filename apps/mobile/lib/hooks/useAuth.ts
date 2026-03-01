import { useEffect } from "react";
import { useAuthStore } from "@/lib/store/auth.store";

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    store.initialize();
  }, []);

  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    biometricEnabled: store.biometricEnabled,
    error: store.error,
    signIn: store.signIn,
    signOut: store.signOut,
    enableBiometric: store.enableBiometric,
    signInWithBiometric: store.signInWithBiometric,
    clearError: store.clearError,
  };
}
