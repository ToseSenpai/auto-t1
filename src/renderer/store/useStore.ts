/**
 * Zustand Store - State Management
 */

import { create } from "zustand";

export interface LogEntry {
  id: string;
  type: "info" | "success" | "error" | "warning";
  message: string;
  timestamp: Date;
}

interface AutomationState {
  // Status
  isRunning: boolean;
  isPaused: boolean;

  // Login
  username: string;
  password: string;
  excelPath: string;

  // Progress
  current: number;
  total: number;
  percentage: number;

  // Stats
  successCount: number;
  errorCount: number;

  // Logs
  logs: LogEntry[];

  // Actions
  setUsername: (username: string) => void;
  setPassword: (password: string) => void;
  setExcelPath: (path: string) => void;
  startAutomation: () => void;
  stopAutomation: () => void;
  pauseAutomation: () => void;
  setProgress: (current: number, total: number) => void;
  addLog: (type: LogEntry["type"], message: string) => void;
  clearLogs: () => void;
  reset: () => void;
}

export const useStore = create<AutomationState>((set, get) => ({
  // Initial state
  isRunning: false,
  isPaused: false,
  username: "",
  password: "",
  excelPath: "data/input.xlsx",
  current: 0,
  total: 0,
  percentage: 0,
  successCount: 0,
  errorCount: 0,
  logs: [],

  // Actions
  setUsername: (username) => set({ username }),

  setPassword: (password) => set({ password }),

  setExcelPath: (path) => set({ excelPath: path }),

  startAutomation: () => {
    set({ isRunning: true, isPaused: false });
    get().addLog("info", "Automazione avviata");
  },

  stopAutomation: () => {
    set({ isRunning: false, isPaused: false });
    get().addLog("warning", "Automazione fermata");
  },

  pauseAutomation: () => {
    set((state) => ({ isPaused: !state.isPaused }));
    get().addLog("info", get().isPaused ? "Automazione in pausa" : "Automazione ripresa");
  },

  setProgress: (current, total) => {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    set({ current, total, percentage });
  },

  addLog: (type, message) => {
    const log: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      timestamp: new Date(),
    };

    set((state) => ({
      logs: [log, ...state.logs].slice(0, 100), // Keep last 100 logs
    }));

    // Update stats
    if (type === "success") {
      set((state) => ({ successCount: state.successCount + 1 }));
    } else if (type === "error") {
      set((state) => ({ errorCount: state.errorCount + 1 }));
    }
  },

  clearLogs: () => set({ logs: [] }),

  reset: () =>
    set({
      isRunning: false,
      isPaused: false,
      current: 0,
      total: 0,
      percentage: 0,
      successCount: 0,
      errorCount: 0,
      logs: [],
    }),
}));
