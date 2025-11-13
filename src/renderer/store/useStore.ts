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

/**
 * Date/Time Configuration Interface
 * - 'today-fixed': Data odierna + ora fissa (es. 20:00)
 * - 'today-current': Data odierna + ora attuale
 * - 'custom-fixed': Data personalizzata + ora fissa
 * - 'custom-current': Data personalizzata + ora attuale
 */
export interface DateTimeConfig {
  mode: 'today-fixed' | 'today-current' | 'custom-fixed' | 'custom-current';
  customDate?: string; // Format: YYYY-MM-DD (only if mode includes 'custom')
  fixedTime?: string; // Format: HH:MM (only if mode includes 'fixed')
}

/**
 * MRN Processing Step
 * Rappresenta i vari step dell'automazione per ogni MRN
 */
export type MRNProcessingStep =
  | 'initializing'           // Pre-login
  | 'logging-in'            // Login action
  | 'navigating'            // Navigate to Dichiarazioni
  | 'creating-declaration'  // Click "Nuova dichiarazione"
  | 'selecting-ncts'        // Click NCTS
  | 'selecting-mxdhl'       // Click MX DHL
  | 'confirming'            // Click OK
  | 'loading-page'          // Wait for page load
  | 'filling-mrn'           // Fill MRN field
  | 'verifying-sede'        // Verify Sede destinazione
  | 'filling-datetime'      // Fill arrival date/time
  | 'sending'               // Click Send button
  | 'completed'             // MRN completed
  | 'error';                // Error occurred

interface AutomationState {
  // Status
  isRunning: boolean;
  isPaused: boolean;

  // Login
  username: string;
  password: string;
  excelPath: string;

  // Date/Time Configuration
  dateTimeConfig: DateTimeConfig;

  // Progress
  current: number;
  total: number;
  percentage: number;

  // Stats
  successCount: number;
  errorCount: number;

  // Logs
  logs: LogEntry[];

  // MRN Tracking
  currentMRN: string | null;
  currentMRNIndex: number;
  currentStep: MRNProcessingStep | null;

  // Actions
  setUsername: (username: string) => void;
  setPassword: (password: string) => void;
  setExcelPath: (path: string) => void;
  setDateTimeConfig: (config: DateTimeConfig) => void;
  startAutomation: () => void;
  stopAutomation: () => void;
  pauseAutomation: () => void;
  setProgress: (current: number, total: number) => void;
  addLog: (type: LogEntry["type"], message: string) => void;
  clearLogs: () => void;
  setCurrentMRN: (mrn: string | null, index: number) => void;
  setCurrentStep: (step: MRNProcessingStep | null) => void;
  reset: () => void;
}

export const useStore = create<AutomationState>((set, get) => ({
  // Initial state
  isRunning: false,
  isPaused: false,
  username: "",
  password: "",
  excelPath: "data/input.xlsx",
  dateTimeConfig: {
    mode: 'today-fixed',
    fixedTime: '20:00', // Default: oggi alle 20:00 (backward compatible)
  },
  current: 0,
  total: 0,
  percentage: 0,
  successCount: 0,
  errorCount: 0,
  logs: [],
  currentMRN: null,
  currentMRNIndex: 0,
  currentStep: null,

  // Actions
  setUsername: (username) => set({ username }),

  setPassword: (password) => set({ password }),

  setExcelPath: (path) => set({ excelPath: path }),

  setDateTimeConfig: (config) => set({ dateTimeConfig: config }),

  startAutomation: () => {
    set({ isRunning: true, isPaused: false });
    get().addLog("info", "Automazione avviata");
  },

  stopAutomation: () => {
    set({
      isRunning: false,
      isPaused: false,
      currentMRN: null,
      currentMRNIndex: 0,
      currentStep: null
    });
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

  setCurrentMRN: (mrn, index) => set({ currentMRN: mrn, currentMRNIndex: index }),

  setCurrentStep: (step) => set({ currentStep: step }),

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
      currentMRN: null,
      currentMRNIndex: 0,
      currentStep: null,
    }),
}));
