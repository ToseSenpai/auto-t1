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

  // Listener per eventi dal main process
  onStatus: (callback: (data: { type: string; message: string }) => void) => {
    ipcRenderer.on("automation:status", (_, data) => callback(data));
  },

  onProgress: (
    callback: (data: { current: number; total: number; rowData: any }) => void
  ) => {
    ipcRenderer.on("automation:progress", (_, data) => callback(data));
  },

  // Rimuovi listener
  removeStatusListener: () => {
    ipcRenderer.removeAllListeners("automation:status");
  },

  removeProgressListener: () => {
    ipcRenderer.removeAllListeners("automation:progress");
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
  onStatus: (callback: (data: { type: string; message: string }) => void) => void;
  onProgress: (
    callback: (data: { current: number; total: number; rowData: any }) => void
  ) => void;
  removeStatusListener: () => void;
  removeProgressListener: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
