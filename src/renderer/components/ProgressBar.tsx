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
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
        Progresso
      </h2>

      <div>
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>
            {current}/{total} righe
          </span>
          <span>{percentage}%</span>
        </div>

        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-green-900/30 border border-green-700 rounded-md p-2">
          <div className="text-green-400 font-medium">{successCount}</div>
          <div className="text-gray-400 text-xs">Successi</div>
        </div>
        <div className="bg-red-900/30 border border-red-700 rounded-md p-2">
          <div className="text-red-400 font-medium">{errorCount}</div>
          <div className="text-gray-400 text-xs">Errori</div>
        </div>
      </div>
    </div>
  );
}

export default ProgressBar;
