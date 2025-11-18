import { useEffect, useState } from "react";
import LoginForm from "./LoginForm";
import DateTimeConfigPanel from "./DateTimeConfigPanel";
import Controls from "./Controls";

interface SidebarProps {
  onOpenUpdateModal?: () => void;
}

function Sidebar({ onOpenUpdateModal }: SidebarProps) {
  const [appVersion, setAppVersion] = useState<string>("...");

  useEffect(() => {
    // Ottieni versione app
    if (window.electronAPI) {
      window.electronAPI.getAppVersion().then((version) => {
        setAppVersion(version);
      });
    }
  }, []);

  return (
    <div className="w-[380px] bg-gradient-to-br from-dark-900 via-dark-850 to-gray-900 border-r border-gray-700/50 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50 bg-gradient-to-br from-accent-blue/10 via-transparent to-accent-purple/5 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent-blue to-blue-700 flex items-center justify-center shadow-glow-blue">
            <svg
              className="w-5 h-5 text-white"
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
          <div className="flex-1">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-blue-300 to-purple-400 bg-clip-text text-transparent">
              Auto-T1
            </h1>
            <p className="text-caption-upper text-gray-400">Automazione Web</p>
            <p className="text-[10px] text-gray-500 font-mono">v{appVersion}</p>
          </div>
          {/* Update Button */}
          {onOpenUpdateModal && (
            <button
              onClick={onOpenUpdateModal}
              className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/70 border border-gray-700/50 transition-colors group"
              title="Controlla aggiornamenti"
            >
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-accent-blue transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
        {/* Login Form */}
        <div className="animate-fade-in">
          <LoginForm />
        </div>

        {/* Date/Time Configuration Panel */}
        <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <DateTimeConfigPanel />
        </div>

        {/* Controls */}
        <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <Controls />
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
