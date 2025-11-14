import { useStore } from "../store/useStore";

function Controls() {
  const isRunning = useStore((state) => state.isRunning);
  const isPaused = useStore((state) => state.isPaused);
  const username = useStore((state) => state.username);
  const password = useStore((state) => state.password);
  const excelPath = useStore((state) => state.excelPath);
  const dateTimeConfig = useStore((state) => state.dateTimeConfig);
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
        dateTimeConfig,
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

  const handlePart3Search = async () => {
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
      addLog("info", "Avvio test ricerca MRN (Parte 3)...");

      // Avvia test ricerca MRN tramite IPC
      const result = await window.electronAPI.startPart3SearchOnly({
        username,
        password,
        excelPath,
      });

      if (result.success) {
        addLog("success", `Test completato! ${result.count || 0} MRN cercati. Verifica manuale browser.`);
      } else {
        addLog("error", result.error || "Errore test ricerca MRN");
      }

      stopAutomation();
    } catch (error) {
      addLog("error", `Errore test ricerca: ${error}`);
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
      <h2 className="text-base font-semibold text-gray-200 tracking-tight">
        Controlli
      </h2>

      {/* Selezione File Excel */}
      <div className="space-y-2">
        <button
          onClick={handleSelectFile}
          disabled={isRunning}
          className="group w-full px-3 py-2.5 bg-accent-green/90 hover:bg-accent-green border border-accent-green/20 disabled:bg-gray-700/50 disabled:border-gray-700/20 disabled:cursor-not-allowed rounded-xl text-sm font-medium hover:shadow-elevation-2 active:scale-[0.97] flex items-center justify-center gap-2 transition-all"
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
        <div className="px-2 py-1.5 bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/30">
          <p className="text-caption text-gray-300 text-center truncate">
            {getFileName()}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="group flex-1 px-3 py-2.5 bg-accent-blue/90 hover:bg-accent-blue border border-accent-blue/20 rounded-xl text-sm font-medium hover:shadow-elevation-2 active:scale-[0.97] flex items-center justify-center gap-1.5 transition-all"
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
              className="group flex-1 px-3 py-2.5 bg-accent-cyan/90 hover:bg-accent-cyan border border-accent-cyan/20 rounded-xl text-sm font-medium hover:shadow-elevation-2 active:scale-[0.97] flex items-center justify-center gap-1.5 transition-all"
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
              className="group flex-1 px-3 py-2.5 bg-accent-purple/90 hover:bg-accent-purple border border-accent-purple/20 rounded-xl text-sm font-medium hover:shadow-elevation-2 active:scale-[0.97] flex items-center justify-center gap-1.5 transition-all"
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
          className="group w-full px-3 py-2.5 bg-accent-orange/90 hover:bg-accent-orange border border-accent-orange/20 disabled:bg-gray-700/50 disabled:border-gray-700/20 disabled:cursor-not-allowed rounded-xl text-sm font-medium hover:shadow-elevation-2 active:scale-[0.97] flex items-center justify-center gap-2 transition-all"
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
        <p className="text-caption text-gray-400 text-center mt-2">
          Cerca dichiarazioni negli ultimi 30 giorni
        </p>
      </div>

      {/* Test Ricerca MRN - Parte 3 */}
      <div className="border-t border-gray-700/50 pt-4">
        <button
          onClick={handlePart3Search}
          disabled={isRunning}
          className="group w-full px-3 py-2.5 bg-accent-purple/90 hover:bg-accent-purple border border-accent-purple/20 disabled:bg-gray-700/50 disabled:border-gray-700/20 disabled:cursor-not-allowed rounded-xl text-sm font-medium hover:shadow-elevation-2 active:scale-[0.97] flex items-center justify-center gap-2 transition-all"
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
          Test Ricerca MRN (Parte 3)
        </button>
        <p className="text-caption text-gray-400 text-center mt-2">
          Solo ricerca - browser aperto per verifica
        </p>
      </div>
    </div>
  );
}

export default Controls;
