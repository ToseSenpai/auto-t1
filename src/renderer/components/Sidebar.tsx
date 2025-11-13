import LoginForm from "./LoginForm";
import Controls from "./Controls";

function Sidebar() {
  return (
    <div className="w-[380px] bg-gradient-to-b from-dark-900 via-gray-900 to-dark-850 border-r border-gray-700/50 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50 bg-gradient-to-br from-accent-blue/10 via-transparent to-accent-purple/5 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-blue-700 flex items-center justify-center shadow-glow-blue">
            <svg
              className="w-4 h-4 text-white"
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
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 via-blue-300 to-purple-400 bg-clip-text text-transparent">
              Auto-T1
            </h1>
            <p className="text-[10px] text-gray-400 font-medium">Automazione Web</p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
        {/* Login Form */}
        <div className="animate-fade-in">
          <LoginForm />
        </div>

        {/* Controls */}
        <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <Controls />
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
