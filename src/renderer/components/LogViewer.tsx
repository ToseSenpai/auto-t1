import { useStore } from "../store/useStore";

function LogViewer() {
  const logs = useStore((state) => state.logs);
  const clearLogs = useStore((state) => state.clearLogs);

  const getLogColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-400";
      case "error":
        return "text-red-400";
      case "warning":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case "success":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "error":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "warning":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-200 tracking-tight">
          Log Attività
        </h2>
        {logs.length > 0 && (
          <button
            onClick={clearLogs}
            className="px-2 py-1 text-[10px] font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 rounded-lg transition-all"
          >
            Pulisci
          </button>
        )}
      </div>

      <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-lg h-[240px] overflow-hidden shadow-inner-soft">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg
              className="w-8 h-8 mb-2 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-xs font-medium">Nessun log disponibile</p>
            <p className="text-[10px] text-gray-600 mt-1">Le attività verranno visualizzate qui</p>
          </div>
        ) : (
          <div className="p-2 space-y-1.5 h-full overflow-y-auto">
            {logs.map((log, index) => (
              <div
                key={log.id}
                className="group text-[10px] p-2 rounded-lg hover:bg-gray-700/30 border border-transparent hover:border-gray-700/50 transition-all animate-slide-up"
                style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s` }}
              >
                <div className="flex items-start gap-2">
                  <div className={`${getLogColor(log.type)} flex-shrink-0 mt-0.5`}>
                    {getLogIcon(log.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`${getLogColor(log.type)} font-medium leading-relaxed`}>
                      {log.message}
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 text-[9px] mt-1">
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {new Date(log.timestamp).toLocaleTimeString("it-IT", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default LogViewer;
