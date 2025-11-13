import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";

interface WebViewProps {
  initialUrl?: string;
}

export default function WebView(_props: WebViewProps) {
  const isRunning = useStore((state) => state.isRunning);
  const isPaused = useStore((state) => state.isPaused);
  const current = useStore((state) => state.current);
  const total = useStore((state) => state.total);
  const percentage = useStore((state) => state.percentage);
  const successCount = useStore((state) => state.successCount);
  const errorCount = useStore((state) => state.errorCount);
  const logs = useStore((state) => state.logs);

  // Track elapsed time
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (isRunning && !isPaused) {
      if (!startTime) {
        setStartTime(Date.now());
      }
      const interval = setInterval(() => {
        if (startTime) {
          setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
        }
      }, 1000);
      return () => clearInterval(interval);
    } else if (!isRunning) {
      setStartTime(null);
      setElapsedTime(0);
    }
    return undefined;
  }, [isRunning, isPaused, startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusText = () => {
    if (!isRunning) return "In attesa";
    if (isPaused) return "In pausa";
    return "In esecuzione";
  };

  const getStatusColor = () => {
    if (!isRunning) return "text-gray-400";
    if (isPaused) return "text-yellow-400";
    return "text-accent-blue";
  };

  const getStatusIcon = () => {
    if (!isRunning) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      );
    }
    if (isPaused) {
      return (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M5.5 3.5A1.5 1.5 0 017 5v10a1.5 1.5 0 01-3 0V5a1.5 1.5 0 011.5-1.5zM13 3.5A1.5 1.5 0 0114.5 5v10a1.5 1.5 0 01-3 0V5A1.5 1.5 0 0113 3.5z" />
        </svg>
      );
    }
    return (
      <svg className="w-6 h-6 animate-pulse-glow" fill="currentColor" viewBox="0 0 20 20">
        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
      </svg>
    );
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case "success": return "text-green-400";
      case "error": return "text-red-400";
      case "warning": return "text-yellow-400";
      default: return "text-gray-400";
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
    <div className="relative w-full h-full bg-transparent flex items-center justify-center p-8">
      <div className="max-w-4xl w-full space-y-8 animate-fade-in">
        {/* Header with Logo and Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-blue to-blue-700 flex items-center justify-center shadow-glow-blue">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-blue-300 to-purple-400 bg-clip-text text-transparent">
                Dashboard Live
              </h2>
              <p className="text-sm text-gray-400">Monitoraggio automazione in tempo reale</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`flex items-center gap-3 px-4 py-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl ${getStatusColor()}`}>
            {getStatusIcon()}
            <div>
              <p className="text-xs text-gray-400">Stato</p>
              <p className="text-sm font-semibold">{getStatusText()}</p>
            </div>
          </div>
        </div>

        {/* Main Progress Section */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-soft-lg">
          <div className="space-y-6">
            {/* Progress Stats */}
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-400 mb-1">Progresso MRN</p>
                <p className="text-4xl font-bold text-gray-100">
                  {current}<span className="text-2xl text-gray-400">/{total}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400 mb-1">Percentuale</p>
                <p className="text-4xl font-bold text-accent-blue">{percentage}%</p>
              </div>
            </div>

            {/* Large Progress Bar */}
            <div className="relative w-full bg-gray-800/50 rounded-full h-6 overflow-hidden shadow-inner-soft border border-gray-700/30">
              <div
                className="h-full bg-gradient-to-r from-accent-blue via-blue-500 to-accent-purple transition-all duration-500 ease-out shadow-glow-blue relative overflow-hidden"
                style={{ width: `${percentage}%` }}
              >
                {isRunning && !isPaused && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              {/* Success */}
              <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-700/50 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-2xl font-bold text-green-400">{successCount}</p>
                    <p className="text-xs text-gray-400">Successi</p>
                  </div>
                </div>
              </div>

              {/* Errors */}
              <div className="bg-gradient-to-br from-red-900/30 to-red-800/20 border border-red-700/50 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-2xl font-bold text-red-400">{errorCount}</p>
                    <p className="text-xs text-gray-400">Errori</p>
                  </div>
                </div>
              </div>

              {/* Elapsed Time */}
              <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-700/50 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-2xl font-bold text-blue-400 font-mono">{formatTime(elapsedTime)}</p>
                    <p className="text-xs text-gray-400">Tempo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 shadow-soft-lg">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="text-base font-semibold text-gray-200">Attività Recenti</h3>
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">Nessuna attività da visualizzare</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {logs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-700/30 border border-transparent hover:border-gray-700/50 transition-all"
                >
                  <div className={`${getLogColor(log.type)} flex-shrink-0 mt-0.5`}>
                    {getLogIcon(log.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`${getLogColor(log.type)} text-sm font-medium`}>
                      {log.message}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(log.timestamp).toLocaleTimeString("it-IT")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
