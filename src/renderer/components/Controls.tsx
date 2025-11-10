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

  const handleCheckMRN = async () => {
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
      addLog("info", "Avvio check MRN posteriori...");

      // Avvia check MRN tramite IPC
      const result = await window.electronAPI.checkMrnRange({
        username,
        password,
        excelPath,
      });

      if (result.success) {
        addLog("success", `Check completato! Trovate ${result.count || 0} dichiarazioni`);
      } else {
        addLog("error", result.error || "Errore check MRN");
      }

      stopAutomation();
    } catch (error) {
      addLog("error", `Errore check MRN: ${error}`);
      stopAutomation();
    }
  };

  const getFileName = () => {
    if (!excelPath) return "Nessun file selezionato";
    const parts = excelPath.split(/[\\/]/);
    return parts[parts.length - 1];
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-gray-200 tracking-tight">
        Controlli
      </h2>

      {/* Selezione File Excel */}
      <div className="space-y-2">
        <button
          onClick={handleSelectFile}
          disabled={isRunning}
          className="group w-full px-3 py-2 bg-gradient-to-br from-accent-green to-green-700 hover:from-green-600 hover:to-green-800 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed rounded-lg text-xs font-medium shadow-soft hover:shadow-soft-lg active:scale-[0.98] flex items-center justify-center gap-2 transition-all"
        >
          <svg
            className="w-4 h-4 group-hover:scale-110 transition-transform"
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
        <div className="px-2 py-1.5 bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700/50">
          <p className="text-[10px] text-gray-300 text-center truncate">
            {getFileName()}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="group flex-1 px-3 py-2 bg-gradient-to-br from-accent-blue to-blue-700 hover:from-blue-600 hover:to-blue-800 rounded-lg text-xs font-medium shadow-soft hover:shadow-glow-blue active:scale-[0.98] flex items-center justify-center gap-1.5 transition-all"
          >
            <svg
              className="w-4 h-4 group-hover:scale-110 transition-transform"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
            Avvia
          </button>
        ) : (
          <>
            <button
              onClick={() => pauseAutomation()}
              className="group flex-1 px-3 py-2 bg-gradient-to-br from-yellow-500 to-yellow-700 hover:from-yellow-600 hover:to-yellow-800 rounded-lg text-xs font-medium shadow-soft hover:shadow-soft-lg active:scale-[0.98] flex items-center justify-center gap-1.5 transition-all"
            >
              {isPaused ? (
                <>
                  <svg
                    className="w-4 h-4 group-hover:scale-110 transition-transform"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                  Riprendi
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 group-hover:scale-110 transition-transform"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M5.5 3.5A1.5 1.5 0 017 5v10a1.5 1.5 0 01-3 0V5a1.5 1.5 0 011.5-1.5zM13 3.5A1.5 1.5 0 0114.5 5v10a1.5 1.5 0 01-3 0V5A1.5 1.5 0 0113 3.5z" />
                  </svg>
                  Pausa
                </>
              )}
            </button>
            <button
              onClick={handleStop}
              className="group flex-1 px-3 py-2 bg-gradient-to-br from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 rounded-lg text-xs font-medium shadow-soft hover:shadow-soft-lg active:scale-[0.98] flex items-center justify-center gap-1.5 transition-all"
            >
              <svg
                className="w-4 h-4 group-hover:scale-110 transition-transform"
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

      {/* Separator */}
      <div className="border-t border-gray-700/50 pt-4">
        <button
          onClick={handleCheckMRN}
          disabled={isRunning}
          className="group w-full px-3 py-2 bg-gradient-to-br from-accent-orange to-orange-700 hover:from-orange-600 hover:to-orange-800 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed rounded-lg text-xs font-medium shadow-soft hover:shadow-soft-lg active:scale-[0.98] flex items-center justify-center gap-2 transition-all"
        >
          <svg
            className="w-4 h-4 group-hover:scale-110 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          Check MRN Posteriori
        </button>
        <p className="text-[10px] text-gray-400 text-center mt-2">
          Cerca dichiarazioni negli ultimi 30 giorni
        </p>
      </div>
    </div>
  );
}

export default Controls;
