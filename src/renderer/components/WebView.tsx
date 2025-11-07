// WebView component displaying informational message about Playwright automation

interface WebViewProps {
  initialUrl?: string;
}

export default function WebView({ initialUrl = "about:blank" }: WebViewProps) {
  // NOTE: URL sync disabled because Playwright and webview have separate sessions
  // The webview cannot share cookies/authentication with Playwright browser
  // Users should watch the separate Playwright window for automation

  return (
    <div className="relative w-full h-full bg-gray-900 flex items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-6">
        {/* Icon */}
        <div className="text-6xl mb-4">🌐</div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-100">
          Browser Playwright Attivo
        </h2>

        {/* Description */}
        <div className="space-y-4 text-gray-400">
          <p className="text-base">
            L'automazione è in esecuzione in una finestra browser <span className="font-semibold text-gray-300">separata</span> gestita da Playwright.
          </p>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-sm text-left">
            <p className="font-semibold text-gray-300 mb-2">💡 Perché una finestra separata?</p>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>Playwright gestisce la propria sessione browser con cookie e autenticazione</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>Questa finestra integrata non può condividere la sessione di Playwright</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>Puoi vedere l'automazione in <strong>tempo reale</strong> nella finestra Playwright</span>
              </li>
            </ul>
          </div>

          <p className="text-sm text-gray-500 italic">
            Suggerimento: Posiziona la finestra Playwright accanto a questa app per monitorare entrambe
          </p>
        </div>

        {/* Optional: Show initial URL if not blank */}
        {initialUrl !== "about:blank" && (
          <div className="mt-6 text-xs text-gray-600 font-mono">
            <div className="bg-gray-800 px-3 py-2 rounded inline-block">
              URL iniziale: {initialUrl}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
