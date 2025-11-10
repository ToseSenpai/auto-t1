import { useStore } from "../store/useStore";

function Controls() {
  const isRunning = useStore((state) => state.isRunning);
  const isPaused = useStore((state) => state.isPaused);
  const username = useStore((state) => state.username);
  const password = useStore((state) => state.password);
  const excelPath = useStore((state) => state.excelPath);
  const setExcelPath = useStore((state) => state.setExcelPath);
  const startAutomation = useStore((state) => state.startAutomation);
  const stopAutomation = useStore((state) => state.stopAutomation);
  const pauseAutomation = useStore((state) => state.pauseAutomation);
  const addLog = useStore((state) => state.addLog);

  const handleSelectFile = async () => {
    try {
      const result = await window.electronAPI.selectExcelFile();
      if (result.success && result.filePath) {
        setExcelPath(result.filePath);
        addLog("success", `File Excel selezionato: ${result.fileName}`);
      } else if (result.cancelled) {
        addLog("info", "Selezione file annullata");
      }
    } catch (error) {
      addLog("error", `Errore selezione file: ${error}`);
    }
  };

  const handleStart = async () => {
    if (!username || !password) {
      addLog("error", "Inserisci username e password");
      return;
    }

    if (!excelPath) {
      addLog("error", "Seleziona un file Excel");
      return;
    }

    try {
      startAutomation();

      // Avvia automazione tramite IPC
      const result = await window.electronAPI.startAutomation({
        username,
        password,
        excelPath,
      });

      if (result.success) {
        addLog("success", "Automazione completata con successo!");
      } else {
        addLog("error", result.error || "Errore avvio automazione");
      }

      stopAutomation();
    } catch (error) {
      addLog("error", `Errore: ${error}`);
      stopAutomation();
    }
  };

  const handleStop = async () => {
    try {
      await window.electronAPI.stopAutomation();
      stopAutomation();
    } catch (error) {
      addLog("error", `Errore stop: ${error}`);
    }
  };

  const getFileName = () => {
    if (!excelPath) return "Nessun file selezionato";
    const parts = excelPath.split(/[\\/]/);
    return parts[parts.length - 1];
  };

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
        Controlli
      </h2>

      {/* Selezione File Excel */}
      <div className="space-y-2">
        <button
          onClick={handleSelectFile}
          disabled={isRunning}
          className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Seleziona File Excel
        </button>
        <p className="text-xs text-gray-400 text-center truncate">
          {getFileName()}
        </p>
      </div>

      <div className="flex gap-2">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
            Start
          </button>
        ) : (
          <>
            <button
              onClick={() => pauseAutomation()}
              className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isPaused ? (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                  Resume
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M5.5 3.5A1.5 1.5 0 017 5v10a1.5 1.5 0 01-3 0V5a1.5 1.5 0 011.5-1.5zM13 3.5A1.5 1.5 0 0114.5 5v10a1.5 1.5 0 01-3 0V5A1.5 1.5 0 0113 3.5z" />
                  </svg>
                  Pause
                </>
              )}
            </button>
            <button
              onClick={handleStop}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M5.5 3A2.5 2.5 0 003 5.5v9A2.5 2.5 0 005.5 17h9a2.5 2.5 0 002.5-2.5v-9A2.5 2.5 0 0014.5 3h-9z" />
              </svg>
              Stop
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Controls;
