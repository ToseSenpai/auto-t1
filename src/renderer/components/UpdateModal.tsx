import { useEffect, useState, useRef } from "react";

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type UpdateState =
  | "checking"
  | "available"
  | "not-available"
  | "downloading"
  | "downloaded"
  | "error"
  | "idle";

function UpdateModal({ isOpen, onClose }: UpdateModalProps) {
  const [updateState, setUpdateState] = useState<UpdateState>("idle");
  const [updateInfo, setUpdateInfo] = useState<{
    version?: string;
    releaseDate?: string;
    releaseNotes?: string;
  }>({});
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentVersion, setCurrentVersion] = useState("");
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Ottieni versione corrente
    window.electronAPI.getAppVersion().then((version) => {
      setCurrentVersion(version);
    });

    // Setup listeners
    window.electronAPI.onUpdateChecking(() => {
      setUpdateState("checking");
      setErrorMessage("");
    });

    window.electronAPI.onUpdateAvailable((info) => {
      setUpdateState("available");
      setUpdateInfo(info);
    });

    window.electronAPI.onUpdateNotAvailable(() => {
      setUpdateState("not-available");
    });

    window.electronAPI.onUpdateError((error) => {
      setUpdateState("error");
      setErrorMessage(error);
    });

    window.electronAPI.onUpdateDownloadProgress((percent) => {
      setUpdateState("downloading");
      setDownloadProgress(percent);
    });

    window.electronAPI.onUpdateDownloaded((info) => {
      setUpdateState("downloaded");
      setUpdateInfo((prev) => ({ ...prev, version: info.version }));
    });

    // Cleanup
    return () => {
      window.electronAPI.removeUpdateListeners();
    };
  }, []);

  // Pulisci timeout quando lo stato cambia da "checking"
  useEffect(() => {
    if (updateState !== "checking" && checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
      checkTimeoutRef.current = null;
    }
  }, [updateState]);

  const handleCheckForUpdates = async () => {
    setUpdateState("checking");
    setErrorMessage("");

    // Pulisci timeout precedente se esiste
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    try {
      const result = await window.electronAPI.checkForUpdates();

      // Se il check fallisce senza throw, gestisci l'errore
      if (!result.success && result.error) {
        setUpdateState("error");
        setErrorMessage(result.error);
        return;
      }

      // Timeout sicurezza: se dopo 10s lo stato è ancora "checking", mostra errore
      checkTimeoutRef.current = setTimeout(() => {
        setUpdateState("error");
        setErrorMessage("Timeout: nessuna risposta dal server aggiornamenti");
      }, 10000);

    } catch (error) {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
        checkTimeoutRef.current = null;
      }
      setUpdateState("error");
      setErrorMessage(error instanceof Error ? error.message : "Errore sconosciuto");
    }
  };

  const handleDownload = async () => {
    setUpdateState("downloading");
    setDownloadProgress(0);
    try {
      const result = await window.electronAPI.downloadUpdate();
      if (!result.success) {
        setUpdateState("error");
        setErrorMessage(result.error || "Errore durante il download");
      }
    } catch (error) {
      setUpdateState("error");
      setErrorMessage(error instanceof Error ? error.message : "Errore sconosciuto");
    }
  };

  const handleInstall = async () => {
    try {
      await window.electronAPI.installUpdate();
      // L'app si riavvierà automaticamente
    } catch (error) {
      setUpdateState("error");
      setErrorMessage(error instanceof Error ? error.message : "Errore sconosciuto");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-dark-800 to-dark-900 border border-gray-700/50 rounded-lg shadow-2xl p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-100">Aggiornamenti Auto-T1</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Versione corrente */}
          <div className="bg-dark-700/50 rounded-lg p-3 border border-gray-700/30">
            <div className="text-xs text-gray-400">Versione corrente</div>
            <div className="text-lg font-bold text-accent-blue">{currentVersion}</div>
          </div>

          {/* Idle State */}
          {updateState === "idle" && (
            <div className="text-center py-6">
              <p className="text-gray-300 mb-4">Controlla se ci sono aggiornamenti disponibili</p>
              <button
                onClick={handleCheckForUpdates}
                className="bg-gradient-to-r from-accent-blue to-accent-purple hover:from-blue-600 hover:to-purple-600 text-white font-medium px-6 py-2 rounded-lg transition-all duration-200 shadow-glow-blue"
              >
                Controlla Aggiornamenti
              </button>
            </div>
          )}

          {/* Checking State */}
          {updateState === "checking" && (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue mx-auto mb-4"></div>
              <p className="text-gray-300">Controllo aggiornamenti in corso...</p>
            </div>
          )}

          {/* Update Available */}
          {updateState === "available" && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-700/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-green-400 font-bold">Aggiornamento Disponibile!</span>
                </div>
                <div className="text-sm text-gray-300">
                  <div><strong>Versione:</strong> {updateInfo.version}</div>
                  {updateInfo.releaseDate && <div><strong>Data:</strong> {new Date(updateInfo.releaseDate).toLocaleDateString()}</div>}
                </div>
              </div>
              <button
                onClick={handleDownload}
                className="w-full bg-gradient-to-r from-accent-blue to-accent-purple hover:from-blue-600 hover:to-purple-600 text-white font-medium px-6 py-3 rounded-lg transition-all duration-200 shadow-glow-blue"
              >
                Scarica Aggiornamento
              </button>
            </div>
          )}

          {/* Not Available */}
          {updateState === "not-available" && (
            <div className="text-center py-6">
              <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-700/50 rounded-lg p-4">
                <div className="flex items-center gap-2 justify-center mb-2">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-blue-400 font-bold">Nessun Aggiornamento</span>
                </div>
                <p className="text-gray-300 text-sm">Stai già utilizzando l'ultima versione disponibile</p>
              </div>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Chiudi
              </button>
            </div>
          )}

          {/* Downloading */}
          {updateState === "downloading" && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-gray-300 mb-4">Download in corso...</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-gray-300">Progresso</span>
                  <span className="text-accent-blue font-bold">{downloadProgress}%</span>
                </div>
                <div className="relative w-full bg-gray-800/50 rounded-full h-2 overflow-hidden shadow-inner-soft border border-gray-700/30">
                  <div
                    className="h-full bg-gradient-to-r from-accent-blue via-blue-500 to-accent-purple transition-all duration-300 ease-out shadow-glow-blue"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Downloaded */}
          {updateState === "downloaded" && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-700/50 rounded-lg p-4 text-center">
                <div className="flex items-center gap-2 justify-center mb-2">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-green-400 font-bold">Download Completato!</span>
                </div>
                <p className="text-gray-300 text-sm">Pronto per l'installazione</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Più Tardi
                </button>
                <button
                  onClick={handleInstall}
                  className="flex-1 bg-gradient-to-r from-accent-blue to-accent-purple hover:from-blue-600 hover:to-purple-600 text-white font-medium px-6 py-3 rounded-lg transition-all duration-200 shadow-glow-blue"
                >
                  Installa e Riavvia
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {updateState === "error" && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-red-900/30 to-red-800/20 border border-red-700/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-400 font-bold">Errore</span>
                </div>
                <p className="text-gray-300 text-sm">{errorMessage}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Chiudi
                </button>
                <button
                  onClick={handleCheckForUpdates}
                  className="flex-1 bg-gradient-to-r from-accent-blue to-accent-purple hover:from-blue-600 hover:to-purple-600 text-white font-medium px-6 py-2 rounded-lg transition-all duration-200"
                >
                  Riprova
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UpdateModal;
