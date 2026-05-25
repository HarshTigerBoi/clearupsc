import { create } from "zustand";
import type { PlanName } from "@/types";

interface AppStore {
  plan: PlanName;
  setPlan: (plan: PlanName) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  plan: "free",
  setPlan: (plan) => set({ plan }),
}));
