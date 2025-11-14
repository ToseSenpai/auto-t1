/**
 * Electron Preload Script
 * Bridge sicuro tra Main Process e Renderer Process
 */

import { contextBridge, ipcRenderer } from "electron";

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

// Espone API sicure al renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  // Excel
  selectExcelFile: () => ipcRenderer.invoke("excel:select-file"),

  // Automazione
  startAutomation: (data: {
    username: string;
    password: string;
    excelPath: string;
    dateTimeConfig: DateTimeConfig;
  }) => ipcRenderer.invoke("automation:start", data),

  processRows: () => ipcRenderer.invoke("automation:process-rows"),

  stopAutomation: () => ipcRenderer.invoke("automation:stop"),

  getAutomationUrl: () => ipcRenderer.invoke("automation:get-url"),

  checkMrnRange: (data: {
    username: string;
    password: string;
    excelPath: string;
  }) => ipcRenderer.invoke("automation:check-mrn-range", data),

  startPart3SearchOnly: (data: {
    username: string;
    password: string;
    excelPath: string;
  }) => ipcRenderer.invoke("automation:part3-search-only", data),

  // Listener per eventi dal main process
  onStatus: (callback: (data: { type: string; message: string }) => void) => {
    ipcRenderer.on("automation:status", (_, data) => callback(data));
  },

  onProgress: (
    callback: (data: { current: number; total: number; rowData: any }) => void
  ) => {
    ipcRenderer.on("automation:progress", (_, data) => callback(data));
  },

  onMRNStart: (
    callback: (data: { mrn: string; index: number; total: number }) => void
  ) => {
    ipcRenderer.on("automation:mrn-start", (_, data) => callback(data));
  },

  onMRNStep: (
    callback: (data: { step: MRNProcessingStep; message: string }) => void
  ) => {
    ipcRenderer.on("automation:mrn-step", (_, data) => callback(data));
  },

  onMRNComplete: (
    callback: (data: { mrn: string; success: boolean; error?: string }) => void
  ) => {
    ipcRenderer.on("automation:mrn-complete", (_, data) => callback(data));
  },

  // Rimuovi listener
  removeStatusListener: () => {
    ipcRenderer.removeAllListeners("automation:status");
  },

  removeProgressListener: () => {
    ipcRenderer.removeAllListeners("automation:progress");
  },

  removeMRNStartListener: () => {
    ipcRenderer.removeAllListeners("automation:mrn-start");
  },

  removeMRNStepListener: () => {
    ipcRenderer.removeAllListeners("automation:mrn-step");
  },

  removeMRNCompleteListener: () => {
    ipcRenderer.removeAllListeners("automation:mrn-complete");
  },
});

// Type definitions per TypeScript
export interface ElectronAPI {
  selectExcelFile: () => Promise<{
    success: boolean;
    filePath?: string;
    fileName?: string;
    cancelled?: boolean;
    error?: string;
  }>;
  startAutomation: (data: {
    username: string;
    password: string;
    excelPath: string;
    dateTimeConfig: DateTimeConfig;
  }) => Promise<{ success: boolean; error?: string }>;
  processRows: () => Promise<{
    success: boolean;
    error?: string;
    stats?: { total: number; success: number; errors: number };
  }>;
  stopAutomation: () => Promise<{ success: boolean; error?: string }>;
  getAutomationUrl: () => Promise<{ success: boolean; url: string }>;
  checkMrnRange: (data: {
    username: string;
    password: string;
    excelPath: string;
  }) => Promise<{ success: boolean; count?: number; error?: string }>;
  startPart3SearchOnly: (data: {
    username: string;
    password: string;
    excelPath: string;
  }) => Promise<{ success: boolean; count?: number; error?: string }>;
  onStatus: (callback: (data: { type: string; message: string }) => void) => void;
  onProgress: (
    callback: (data: { current: number; total: number; rowData: any }) => void
  ) => void;
  onMRNStart: (
    callback: (data: { mrn: string; index: number; total: number }) => void
  ) => void;
  onMRNStep: (
    callback: (data: { step: MRNProcessingStep; message: string }) => void
  ) => void;
  onMRNComplete: (
    callback: (data: { mrn: string; success: boolean; error?: string }) => void
  ) => void;
  removeStatusListener: () => void;
  removeProgressListener: () => void;
  removeMRNStartListener: () => void;
  removeMRNStepListener: () => void;
  removeMRNCompleteListener: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
