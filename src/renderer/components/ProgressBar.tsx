import { useStore } from "../store/useStore";

function ProgressBar() {
  const current = useStore((state) => state.current);
  const total = useStore((state) => state.total);
  const percentage = useStore((state) => state.percentage);
  const successCount = useStore((state) => state.successCount);
  const errorCount = useStore((state) => state.errorCount);
  const isRunning = useStore((state) => state.isRunning);

  if (!isRunning && total === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-gray-200 tracking-tight">
        Progresso
      </h2>

      <div className="space-y-2">
        <div className="flex justify-between text-xs font-medium">
          <span className="text-gray-300">
            {current}/{total} MRN processati
          </span>
          <span className="text-accent-blue font-bold">{percentage}%</span>
        </div>

        <div className="relative w-full bg-gray-800/50 rounded-full h-2 overflow-hidden shadow-inner-soft border border-gray-700/30">
          <div
            className="h-full bg-gradient-to-r from-accent-blue via-blue-500 to-accent-purple transition-all duration-500 ease-out shadow-glow-blue relative overflow-hidden"
            style={{ width: `${percentage}%` }}
          >
            {/* Animated shimmer effect */}
            {isRunning && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-700/50 rounded-lg p-2 backdrop-blur-sm shadow-soft">
          <div className="flex items-center gap-1.5">
            <svg
              className="w-4 h-4 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <div className="text-green-400 font-bold text-base">{successCount}</div>
              <div className="text-gray-400 text-[10px] font-medium">Successi</div>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-900/30 to-red-800/20 border border-red-700/50 rounded-lg p-2 backdrop-blur-sm shadow-soft">
          <div className="flex items-center gap-1.5">
            <svg
              className="w-4 h-4 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <div className="text-red-400 font-bold text-base">{errorCount}</div>
              <div className="text-gray-400 text-[10px] font-medium">Errori</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProgressBar;
