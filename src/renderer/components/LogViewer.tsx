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
        return "✓";
      case "error":
        return "✗";
      case "warning":
        return "⚠";
      default:
        return "•";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Log
        </h2>
        {logs.length > 0 && (
          <button
            onClick={clearLogs}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Pulisci
          </button>
        )}
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-md h-[300px] overflow-y-auto">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            Nessun log disponibile
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="text-xs p-2 rounded hover:bg-gray-700/50 transition-colors animate-slide-in"
              >
                <div className="flex items-start gap-2">
                  <span className={`${getLogColor(log.type)} font-bold`}>
                    {getLogIcon(log.type)}
                  </span>
                  <div className="flex-1">
                    <div className={getLogColor(log.type)}>{log.message}</div>
                    <div className="text-gray-600 text-[10px] mt-0.5">
                      {new Date(log.timestamp).toLocaleTimeString("it-IT")}
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
