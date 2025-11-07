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
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
        Credenziali
      </h2>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isRunning}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
          placeholder="Inserisci username"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isRunning}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
          placeholder="Inserisci password"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">File Excel</label>
        <input
          type="text"
          value={excelPath}
          onChange={(e) => setExcelPath(e.target.value)}
          disabled={isRunning}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
          placeholder="data/input.xlsx"
        />
      </div>
    </div>
  );
}

export default LoginForm;
