# Auto-T1 - Contesto Progetto

## 🎯 Scopo del Progetto

**Auto-T1** è un'applicazione desktop cross-platform per automatizzare operazioni web complesse utilizzando browser automation (Playwright) integrato in un'interfaccia Electron. Il progetto permette di:

1. **Automatizzare workflow web** tramite script Playwright configurabili
2. **Gestire dati Excel** come input/output dell'automazione
3. **Monitorare in tempo reale** l'esecuzione con UI React responsive
4. **Salvare screenshot e log** per audit e debugging
5. **Eseguire automazioni sia headless che visibili** per development/production

### Casi d'Uso
- Automazione data entry ripetitivo
- Testing di workflow web complessi
- Scraping dati strutturati con interazione browser
- Popolamento database tramite interfacce web
- Batch processing di operazioni web

---

## 🏗️ Architettura High-Level

### Architettura Multi-Processo Electron

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AUTO-T1 ELECTRON APP                        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  MAIN PROCESS (Node.js Runtime)                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                       │
│  ┌────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │ BrowserWindow  │  │  WebAutomation   │  │  ExcelHandler    │   │
│  │                │  │  (Playwright)    │  │  (ExcelJS)       │   │
│  │ - React UI     │  │                  │  │                  │   │
│  │ - Sidebar      │  │ - Browser launch │  │ - Read Excel     │   │
│  │ - DevTools     │  │ - Page navigate  │  │ - Write results  │   │
│  └────────────────┘  │ - Element click  │  │ - Async I/O      │   │
│                      │ - Screenshot     │  └──────────────────┘   │
│  ┌────────────────┐  │ - Headless mode  │                         │
│  │ BrowserView    │  └──────────────────┘                         │
│  │ (Playwright    │                                                │
│  │  Browser UI)   │  ┌──────────────────────────────────────────┐ │
│  └────────────────┘  │  IPC Main Handlers (async)               │ │
│                      │  - automation:start                       │ │
│                      │  - automation:pause                       │ │
│                      │  - automation:resume                      │ │
│                      │  - automation:stop                        │ │
│                      │  - log:send                               │ │
│                      │  - progress:update                        │ │
│                      └──────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                    ↕
                          IPC Communication (secure)
                      contextBridge.exposeInMainWorld
                                    ↕
┌─────────────────────────────────────────────────────────────────────┐
│  PRELOAD SCRIPT (Sandboxed Bridge)                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  window.electronAPI (whitelisted methods)                     │  │
│  │  - startAutomation(username, password)                        │  │
│  │  - pauseAutomation()                                          │  │
│  │  - resumeAutomation()                                         │  │
│  │  - stopAutomation()                                           │  │
│  │  - onLog(callback)                                            │  │
│  │  - onProgress(callback)                                       │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    ↕
                         Renderer Context (isolated)
                                    ↕
┌─────────────────────────────────────────────────────────────────────┐
│  RENDERER PROCESS (Chromium Browser)                                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  React 18 Application                                        │   │
│  │                                                               │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │   │
│  │  │  App.tsx    │  │  Zustand     │  │  Components       │  │   │
│  │  │             │  │  Store       │  │                   │  │   │
│  │  │ - Layout    │  │              │  │ - Sidebar         │  │   │
│  │  │ - Routing   │  │ - logs[]     │  │ - LoginForm       │  │   │
│  │  └─────────────┘  │ - progress   │  │ - Controls        │  │   │
│  │                   │ - isPaused   │  │ - ProgressBar     │  │   │
│  │                   │ - stats      │  │ - LogViewer       │  │   │
│  │                   │              │  └───────────────────┘  │   │
│  │                   │ - addLog()   │                         │   │
│  │                   │ - setProgress│                         │   │
│  │                   └──────────────┘                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  Security: nodeIntegration: false, contextIsolation: true            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  FILE SYSTEM INTERACTION                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                       │
│  Input:  data/input.xlsx    ──→  ExcelHandler  ──→  Row data       │
│  Output: data/output.xlsx   ←──  ExcelHandler  ←──  Results        │
│  Logs:   logs/*.log         ←──  Logger        ←──  Events         │
│  Screen: logs/*.png         ←──  Playwright    ←──  Screenshots    │
└─────────────────────────────────────────────────────────────────────┘
```

### Flusso Dati End-to-End

```
1. USER INPUT (React UI)
   │
   ├─→ LoginForm: username, password
   │   └─→ Controls: Start button click
   │
2. IPC COMMUNICATION (Preload Bridge)
   │
   ├─→ window.electronAPI.startAutomation(username, password)
   │   └─→ ipcRenderer.invoke('automation:start', ...)
   │
3. MAIN PROCESS (Automation Logic)
   │
   ├─→ ExcelHandler.loadData('data/input.xlsx')
   │   └─→ Parse Excel rows → Array<ProcessData>
   │
   ├─→ WebAutomation.initialize(headless: false)
   │   ├─→ Launch Playwright Chromium browser
   │   └─→ Navigate to target URL
   │
   ├─→ WebAutomation.login(username, password)
   │   ├─→ Fill login form
   │   ├─→ Submit & wait for navigation
   │   └─→ Verify success
   │
   ├─→ For each row in Excel data:
   │   │
   │   ├─→ WebAutomation.processRow(rowData)
   │   │   ├─→ Navigate to form page
   │   │   ├─→ Fill form fields
   │   │   ├─→ Submit form
   │   │   ├─→ Take screenshot → logs/screenshot_*.png
   │   │   └─→ Return success/error
   │   │
   │   ├─→ IPC: Send progress update
   │   │   └─→ ipcMain → ipcRenderer.send('progress:update', ...)
   │   │
   │   └─→ IPC: Send log entry
   │       └─→ ipcMain → ipcRenderer.send('log:send', ...)
   │
   ├─→ ExcelHandler.saveResults('data/output.xlsx', results)
   │   └─→ Write results to new Excel file
   │
   └─→ WebAutomation.cleanup()
       └─→ Close browser, release resources
   │
4. RENDERER UPDATE (React State)
   │
   ├─→ window.electronAPI.onProgress((data) => ...)
   │   └─→ useStore.setState({ progress: data.current / data.total })
   │
   └─→ window.electronAPI.onLog((log) => ...)
       └─→ useStore.setState({ logs: [...logs, log] })
   │
5. UI UPDATE (React Components)
   │
   ├─→ ProgressBar: Re-render with new progress
   ├─→ LogViewer: Append new log entry
   └─→ Stats: Update success/error counts
```

---

## 🛠️ Tecnologie Chiave e Motivazioni

### 1. **Electron 28.2.0** - Desktop Framework
**Perché Electron?**
- Cross-platform (Windows, macOS, Linux) con singola codebase
- Integrazione nativa browser (Chromium) per UI moderna
- Accesso completo a Node.js APIs (file system, child processes)
- Ecosistema maturo con Electron Builder per packaging

**Alternative considerate**:
- ❌ **Tauri**: Più leggero ma meno maturo, ecosystem limitato
- ❌ **NW.js**: Meno supporto community, documentazione inferiore
- ❌ **Native desktop (C++/C#)**: Development lento, no cross-platform facile

### 2. **React 18.2.0** - UI Framework
**Perché React?**
- Component-based architecture scalabile
- Virtual DOM per performance ottimali
- Hooks per state management intuitivo
- Ecosistema vastissimo (Tailwind, Zustand, etc.)

**Alternative considerate**:
- ❌ **Vue.js**: Meno diffuso in enterprise, ecosystem più piccolo
- ❌ **Svelte**: Giovane, meno librerie disponibili
- ❌ **Vanilla JS**: Complessità ingestibile per UI complesse

### 3. **Playwright 1.41.0** - Browser Automation
**Perché Playwright?**
- Multi-browser (Chromium, Firefox, WebKit) con singola API
- Auto-wait intelligente (elimina sleep/timeout manuali)
- Screenshot e video recording integrati
- Headless E visible modes per debugging
- Network interception e mocking
- Migliore documentazione e support Microsoft

**Alternative considerate**:
- ❌ **Puppeteer**: Solo Chromium, meno features
- ❌ **Selenium**: Lento, API verbosa, setup complesso
- ❌ **Cypress**: Solo browser testing, no automazione desktop

### 4. **ExcelJS 4.4.0** - Excel Management
**Perché ExcelJS?**
- 100% JavaScript (no dipendenze native)
- Async/await API moderna
- Supporto completo formati Excel (.xlsx, .xls)
- Styling, formule, chart support
- Streaming per file grandi
- Active maintenance e community

**Alternative considerate**:
- ❌ **xlsx (SheetJS)**: API meno intuitiva, documentazione scarsa
- ❌ **node-xlsx**: Features limitate, no styling
- ❌ **exceljs fork**: Rischio abbandono progetti

### 5. **Zustand 4.5.0** - State Management
**Perché Zustand?**
- Minimale API (< 1KB gzipped)
- No boilerplate (vs Redux)
- TypeScript first-class support
- Devtools integration
- No context providers necessari
- Performance eccellenti (no re-renders inutili)

**Alternative considerate**:
- ❌ **Redux**: Troppo boilerplate, overkill per app piccole
- ❌ **MobX**: Magic behavior, debugging difficile
- ❌ **Context API**: Performance issues con nested updates
- ❌ **Recoil**: Giovane, API instabile

### 6. **Vite 5.0.12** - Build Tool
**Perché Vite?**
- Fastest HMR (Hot Module Replacement)
- ES modules native (no bundling in dev)
- Plugin ecosystem ricco (React, Electron, etc.)
- Build production con Rollup ottimizzato
- Out-of-the-box TypeScript support

**Alternative considerate**:
- ❌ **Webpack**: Lento, configurazione complessa
- ❌ **Parcel**: Meno controllo, plugin limitati
- ❌ **esbuild**: Giovane, ecosystem immaturo

### 7. **TypeScript 5.3.3** - Type System
**Perché TypeScript?**
- Type safety (catch errors prima del runtime)
- IntelliSense e autocomplete superiori
- Refactoring sicuro
- Documentazione implicita via types
- Industry standard per progetti enterprise

**Alternative considerate**:
- ❌ **JavaScript puro**: Error-prone, refactoring rischioso
- ❌ **Flow**: Abbandonato da Facebook, ecosystem morto
- ❌ **JSDoc**: Type checking debole, verbose

### 8. **Tailwind CSS 3.4.1** - Styling
**Perché Tailwind?**
- Utility-first → velocità sviluppo
- No CSS custom → manutenzione ridotta
- Purge CSS automatico → bundle size minimo
- Responsive e dark mode built-in
- Design system consistente

**Alternative considerate**:
- ❌ **CSS Modules**: Boilerplate, naming conflicts
- ❌ **Styled Components**: Runtime overhead, debugging difficile
- ❌ **Sass/Less**: Troppo custom, manutenzione costosa

---

## 📊 Diagramma Struttura Codebase

```
auto-t1/
│
├── 📦 ELECTRON LAYER (Main Process)
│   │
│   ├── electron/main.ts              [Entry point Electron]
│   │   ├─ createWindow()             → BrowserWindow + BrowserView
│   │   ├─ IPC handlers setup         → automation:*, log:*, progress:*
│   │   ├─ App lifecycle              → ready, quit, activate
│   │   └─ Menu creation              → App menu (dev/prod)
│   │
│   └── electron/preload.ts           [Security Bridge]
│       ├─ contextBridge.exposeInMainWorld('electronAPI', ...)
│       ├─ startAutomation()          → ipcRenderer.invoke('automation:start')
│       ├─ onLog()                    → ipcRenderer.on('log:send')
│       └─ onProgress()               → ipcRenderer.on('progress:update')
│
├── 🎨 REACT LAYER (Renderer Process)
│   │
│   ├── src/renderer/index.tsx        [React Entry]
│   │   └─ ReactDOM.createRoot()      → Render <App />
│   │
│   ├── src/renderer/App.tsx          [App Container]
│   │   ├─ Layout: Sidebar + BrowserView area
│   │   └─ Tailwind dark mode styles
│   │
│   ├── src/renderer/components/
│   │   ├─ Sidebar.tsx                → Container principale UI
│   │   ├─ LoginForm.tsx              → Form username/password
│   │   ├─ Controls.tsx               → Start/Pause/Resume/Stop buttons
│   │   ├─ ProgressBar.tsx            → Barra progresso animata
│   │   └─ LogViewer.tsx              → Lista log con auto-scroll
│   │
│   └── src/renderer/store/useStore.ts [Zustand State]
│       ├─ State: logs, progress, isPaused, stats
│       ├─ Actions: addLog, setProgress, togglePause
│       └─ Selectors: useStore((s) => s.logs)
│
├── 🤖 AUTOMATION LAYER (Core Logic)
│   │
│   ├── src/web-automation.ts         [Playwright Wrapper]
│   │   ├─ Class WebAutomation
│   │   ├─ initialize()               → Launch browser + context
│   │   ├─ login()                    → Login flow automation
│   │   ├─ processRow()               → Process single Excel row
│   │   ├─ takeScreenshot()           → Save PNG to logs/
│   │   └─ cleanup()                  → Close browser
│   │
│   ├── src/excel-handler.ts          [ExcelJS Wrapper]
│   │   ├─ Class ExcelHandler
│   │   ├─ loadData()                 → Read data/input.xlsx
│   │   ├─ saveResults()              → Write data/output.xlsx
│   │   └─ validateWorksheet()        → Check columns exist
│   │
│   └── src/config.ts                 [Config Singleton]
│       ├─ SELECTORS                  → CSS selectors for automation
│       ├─ TIMEOUTS                   → Navigation, wait timeouts
│       ├─ PATHS                      → File paths (data, logs)
│       └─ BROWSER_CONFIG             → Playwright launch options
│
├── 📄 CONFIGURATION FILES
│   ├── tsconfig.json                 → TS compiler config (strict mode)
│   ├── vite.config.ts                → Vite bundler (3 entries: main, preload, renderer)
│   ├── tailwind.config.js            → Tailwind customization (dark mode, colors)
│   ├── postcss.config.js             → PostCSS (Tailwind + Autoprefixer)
│   ├── package.json                  → Dependencies + scripts + Electron Builder
│   └── .gitignore                    → Exclude node_modules, dist, data, logs
│
├── 📚 DOCUMENTATION
│   ├── docs/PROJECT_CONTEXT.md       → This file
│   ├── docs/CURRENT_STATUS.md        → Implementation status
│   ├── docs/ACTIVE_ROADMAP.md        → Feature roadmap
│   ├── docs/DECISIONS.md             → ADR log
│   ├── docs/QUICK_REFERENCE.md       → Commands cheatsheet
│   ├── README.md                     → Main documentation (TypeScript/CLI)
│   ├── README-ELECTRON.md            → Electron app guide
│   └── CLAUDE.md                     → Claude Code integration guide
│
└── 📁 DATA & RUNTIME
    ├── data/                         → Excel input files (.gitignore)
    ├── logs/                         → Screenshots + log files (.gitignore)
    ├── dist/                         → Vite build output (renderer)
    ├── dist-electron/                → Electron build output (main + preload)
    └── out/                          → Electron Builder packaged app
```

---

## 🔐 Considerazioni di Sicurezza

### Electron Security Model
1. **Context Isolation**: Abilitato per prevenire prototype pollution
2. **nodeIntegration**: Disabilitato nel renderer (no accesso diretto Node.js)
3. **Sandbox**: Abilitato per processo renderer isolato
4. **Preload Script**: Unico bridge controllato tra Main e Renderer
5. **CSP Headers**: Content Security Policy per prevenire XSS
6. **webSecurity**: Abilitato (no bypass CORS/mixed content)

### Input Validation
- **User Input**: Validazione credenziali prima di passare a Main process
- **Excel Data**: Validazione schema e sanitizzazione valori
- **File Paths**: Whitelist directory permesse (data/, logs/)
- **IPC Messages**: Type checking con TypeScript su tutti i payload

### Credential Management
- **No Hardcoding**: Credenziali mai salvate in codice
- **Runtime Input**: Credenziali inserite dall'utente ad ogni sessione
- **No Persistence**: No salvataggio credenziali su disco
- **Memory Cleanup**: Clear credenziali dopo logout/error

---

## 🚀 Performance Considerations

### Electron
- **Lazy Loading**: Componenti React caricati on-demand
- **Memory Management**: Browser cleanup dopo automazione completata
- **Process Separation**: Main/Renderer separation per evitare UI freeze

### React
- **Virtualization**: LogViewer virtualizzato per liste lunghe (future)
- **Memoization**: React.memo per componenti heavy (ProgressBar, LogViewer)
- **Debouncing**: Input debouncing per evitare re-renders frequenti

### Playwright
- **Browser Reuse**: Riutilizzo browser context per righe multiple
- **Headless Mode**: Production usa headless per performance
- **Network Optimization**: Block images/fonts non necessari (future)

### Excel
- **Streaming**: ExcelJS streaming per file > 10MB (future)
- **Batch Processing**: Salvataggio risultati ogni N righe invece di alla fine

---

## 📦 Build e Deploy

### Development Build
```bash
npm run electron:dev
```
- Vite dev server (HMR per renderer)
- Electron in development mode
- DevTools abilitato
- Source maps completi

### Production Build
```bash
npm run build
```
1. TypeScript compilation (`tsc`)
2. Vite build (bundle renderer optimized)
3. Electron Builder packaging
4. Output: `.exe` (Windows), `.dmg` (macOS), `.AppImage` (Linux)

### Packaging Targets
- **Windows**: NSIS installer (.exe)
- **macOS**: DMG image (.dmg)
- **Linux**: AppImage (.AppImage)

---

## 🔄 Extensibility Points

### Aggiungere Nuove Automazioni
1. Estendere `src/config.ts` con nuovi selettori
2. Aggiungere metodi in `WebAutomation` class
3. Aggiungere IPC handler in `electron/main.ts`
4. Aggiornare UI React con nuovi controlli

### Aggiungere Nuove Sorgenti Dati
1. Creare nuovo handler (es. `csv-handler.ts`, `json-handler.ts`)
2. Implementare interfaccia comune `DataHandler`
3. Switch dinamico in main process basato su config

### Plugin System (Future)
- Caricamento dinamico plugin da `plugins/` directory
- Plugin API per estendere automazione
- Marketplace plugin community

---

**Versione**: 1.0.0
**Data Creazione**: 2025-11-07
**Autore**: Auto-T1 Team
**Licenza**: [Specificare licenza]
