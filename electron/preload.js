import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("electronAPI", {
    startAutomation: (data) => ipcRenderer.invoke("automation:start", data),
    processRows: () => ipcRenderer.invoke("automation:process-rows"),
    stopAutomation: () => ipcRenderer.invoke("automation:stop"),
    onStatus: (callback) => {
        ipcRenderer.on("automation:status", (_, data) => callback(data));
    },
    onProgress: (callback) => {
        ipcRenderer.on("automation:progress", (_, data) => callback(data));
    },
    removeStatusListener: () => {
        ipcRenderer.removeAllListeners("automation:status");
    },
    removeProgressListener: () => {
        ipcRenderer.removeAllListeners("automation:progress");
    },
});
//# sourceMappingURL=preload.js.map