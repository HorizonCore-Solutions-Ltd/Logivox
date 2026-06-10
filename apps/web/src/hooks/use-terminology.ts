// apps/web/src/hooks/use-terminology.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

type TerminologyState = {
  terms: {
    container: string;
    pallet: string;
    tipping: string; // e.g. "Unloading", "De-vanning"
    returns: string;
    driver: string;
    loadSheet: string;
  };
  updateTerm: (key: keyof TerminologyState["terms"], value: string) => void;
};

// Simple global state for terminology preferences
export const useTerminology = create<TerminologyState>()(
  persist(
    (set) => ({
      terms: {
        container: "Container",
        pallet: "Pallet",
        tipping: "Tipping",
        returns: "Returns",
        driver: "Driver",
        loadSheet: "Load Sheet",
      },
      updateTerm: (key, value) =>
        set((state) => ({ terms: { ...state.terms, [key]: value } })),
    }),
    {
      name: "logivox-terminology",
      migrate: (persistedState: any) => persistedState,
    },
  ),
);
