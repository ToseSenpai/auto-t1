import { useEffect } from "react";
import { useStore } from "./store/useStore";
import Sidebar from "./components/Sidebar";
import WebView from "./components/WebView";

function App() {
  const addLog = useStore((state) => state.addLog);
  const setProgress = useStore((state) => state.setProgress);

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
    }

    return () => {
      // Cleanup listeners
      if (window.electronAPI) {
        window.electronAPI.removeStatusListener();
        window.electronAPI.removeProgressListener();
      }
    };
  }, [addLog, setProgress]);

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Sidebar - 350px fisso */}
      <Sidebar />

      {/* Browser View Area - ora gestita da webview tag */}
      <div className="flex-1 relative bg-gray-800">
        <WebView initialUrl="about:blank" />
      </div>
    </div>
  );
}

export default App;
