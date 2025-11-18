import { useEffect, useState } from "react";
import { useStore } from "./store/useStore";
import Sidebar from "./components/Sidebar";
import WebView from "./components/WebView";
import UpdateModal from "./components/UpdateModal";

function App() {
  const addLog = useStore((state) => state.addLog);
  const setProgress = useStore((state) => state.setProgress);
  const setCurrentPart = useStore((state) => state.setCurrentPart);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  useEffect(() => {
    // Setup IPC listeners
    if (window.electronAPI) {
      // Listen for status updates
      window.electronAPI.onStatus((data) => {
        const typeMap = {
          info: "info" as const,
          success: "success" as const,
          error: "error" as const,
          warning: "warning" as const,
        };
        addLog(typeMap[data.type as keyof typeof typeMap] || "info", data.message);
      });

      // Listen for progress updates
      window.electronAPI.onProgress((data) => {
        setProgress(data.current, data.total);
        addLog("info", `Processamento riga ${data.current}/${data.total}`);
      });

      // Listen for part changes
      window.electronAPI.onPartChanged((data) => {
        setCurrentPart(data.part);
      });

      // Auto-open update modal when update is available
      window.electronAPI.onUpdateAvailable(() => {
        setIsUpdateModalOpen(true);
      });
    }

    return () => {
      // Cleanup listeners
      if (window.electronAPI) {
        window.electronAPI.removeStatusListener();
        window.electronAPI.removeProgressListener();
        window.electronAPI.removePartChangedListener();
        window.electronAPI.removeUpdateListeners();
      }
    };
  }, [addLog, setProgress, setCurrentPart]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-dark-900 via-dark-850 to-gray-900 text-gray-100 overflow-hidden">
      {/* Sidebar - 380px fisso */}
      <Sidebar onOpenUpdateModal={() => setIsUpdateModalOpen(true)} />

      {/* Browser View Area - Unified gradient background */}
      <div className="flex-1 relative bg-gradient-to-br from-dark-900 via-dark-850 to-gray-900 shadow-inner">
        <WebView initialUrl="about:blank" />
      </div>

      {/* Update Modal */}
      <UpdateModal isOpen={isUpdateModalOpen} onClose={() => setIsUpdateModalOpen(false)} />
    </div>
  );
}

export default App;
