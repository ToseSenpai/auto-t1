import { useStore } from "../store/useStore";

function LoginForm() {
  const username = useStore((state) => state.username);
  const password = useStore((state) => state.password);
  const excelPath = useStore((state) => state.excelPath);
  const isRunning = useStore((state) => state.isRunning);
  const setUsername = useStore((state) => state.setUsername);
  const setPassword = useStore((state) => state.setPassword);
  const setExcelPath = useStore((state) => state.setExcelPath);

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-200 tracking-tight">
        Credenziali
      </h2>

      <div className="space-y-2">
        <label className="block text-caption-upper text-gray-400">
          Username
        </label>
        <div className="win11-input-wrapper">
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isRunning}
              className="win11-input pr-8 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Inserisci il tuo username"
            />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          </div>
          <div className="win11-input-accent-line"></div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-caption-upper text-gray-400">
          Password
        </label>
        <div className="win11-input-wrapper">
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isRunning}
              className="win11-input pr-8 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Inserisci la tua password"
            />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>
          <div className="win11-input-accent-line"></div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-caption-upper text-gray-400">
          File Excel
        </label>
        <div className="win11-input-wrapper">
          <div className="relative">
            <input
              type="text"
              value={excelPath}
              onChange={(e) => setExcelPath(e.target.value)}
              disabled={isRunning}
              className="win11-input pr-8 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="data/input.xlsx"
            />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-500"
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
            </div>
          </div>
          <div className="win11-input-accent-line"></div>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
