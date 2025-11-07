# Auto-T1 - Guida per Claude Code

## 📋 Overview
**Auto-T1** è un'applicazione desktop Electron per automazione web con browser automation (Playwright) e gestione dati Excel.

**Stack Tecnologico**:
- **Electron 28** (Main + Renderer multi-processo)
- **React 18** + **TypeScript 5.3** (strict mode)
- **Playwright 1.41** (browser automation)
- **ExcelJS 4.4** (gestione file Excel)
- **Zustand 4.5** (state management)
- **Vite 5** (build tool) + **Tailwind CSS 3.4**

**Architettura**: Multi-processo Electron con IPC communication, browser automation headless/visibile, UI React con sidebar, gestione Excel async.

---

## 🚀 Comandi Sviluppo

### Comandi Principali
```bash
npm run electron:dev     # Avvia app Electron in dev mode (Vite + Electron concurrente)
npm run dev              # Solo Vite dev server (renderer)
npm run build            # Build completo: TypeScript → Vite → Electron Builder
npm run electron:build   # Build Electron app (senza tsc)
npm run electron:start   # Avvia Electron da dist compilato
```

### Comandi Utility
```bash
npm run compile          # Compila TypeScript (tsc)
npm run watch            # Compila TS in watch mode
npm run lint             # ESLint su src/**/*.{ts,tsx}
npm run format           # Prettier format src/**/*.{ts,tsx}
npm run clean            # Rimuove dist, dist-electron, out
npm run preview          # Preview build Vite
```

### Workflow Consigliato
1. **Sviluppo**: `npm run electron:dev` (hot reload completo)
2. **Lint/Format**: `npm run lint && npm run format` prima di commit
3. **Build produzione**: `npm run build` (genera installer Windows/Mac/Linux)

---

## 📁 Struttura Directory

```
auto-t1/
├── electron/                # Main Process Electron
│   ├── main.ts             # Main process (BrowserWindow, IPC, automazione)
│   └── preload.ts          # Preload script (context isolation bridge)
├── src/
│   ├── config.ts           # Config centralizzato (selettori, timeout, path)
│   ├── excel-handler.ts    # Gestione Excel (ExcelJS async)
│   ├── web-automation.ts   # Automazione Playwright (browser headless/visible)
│   ├── main.ts             # Entry CLI (esecuzione terminal)
│   └── renderer/           # React UI
│       ├── App.tsx         # App principale
│       ├── index.tsx       # Entry point React
│       ├── components/     # Componenti UI (Sidebar, Controls, LoginForm, LogViewer)
│       └── store/          # Zustand store (useStore.ts)
├── data/                   # File Excel input (.gitignore *.xlsx)
├── logs/                   # Screenshot e log (.gitignore *.log, *.png)
├── dist/                   # Build output Vite (generato)
├── dist-electron/          # Build output Electron (generato)
├── docs/                   # Documentazione progetto
│   ├── PROJECT_CONTEXT.md  # Architettura e tech stack
│   ├── CURRENT_STATUS.md   # Stato implementazione
│   ├── ACTIVE_ROADMAP.md   # Roadmap features
│   ├── DECISIONS.md        # Log decisioni architetturali
│   └── QUICK_REFERENCE.md  # Quick reference comandi
└── .claude/
    ├── commands/           # Slash commands custom
    └── sessions/           # Tracking sessioni sviluppo
```

---

## 📝 Standard di Codifica

### TypeScript
- **Strict mode**: Sempre abilitato (tsconfig.json)
- **Type safety**: Definire interfacce per tutti i dati (LogEntry, ProcessResult, ElectronAPI)
- **No any**: Evitare `any`, usare `unknown` o type specifici
- **Async/await**: Preferire async/await a Promise chains
- **Error handling**: Sempre try/catch nei blocchi async

### React
- **Functional components**: Usare solo function components + hooks
- **TypeScript props**: Definire interfacce per props (es. `interface ControlsProps`)
- **Hooks**: useState, useEffect, custom hooks per logica riutilizzabile
- **Zustand store**: Accesso state via `useStore()` hook

### Electron
- **Context isolation**: SEMPRE abilitato (security)
- **nodeIntegration**: SEMPRE false nel renderer (security)
- **IPC Communication**: Usare `ipcMain.handle` (async) + `ipcRenderer.invoke`
- **Preload script**: Esporre solo API necessarie tramite `contextBridge.exposeInMainWorld`
- **Security**: Validare tutti gli input da renderer prima di usarli in main

### Playwright
- **Browser config**: Usare `config.ts` per selettori e timeout
- **Headless mode**: Supportare sia headless che visible (via config)
- **Screenshot**: Salvare screenshot in logs/ con timestamp
- **Error handling**: Gestire timeout, elementi non trovati, navigation errors
- **Cleanup**: Sempre chiudere browser e context dopo uso

### Excel
- **Async operations**: ExcelJS è async-first, usare sempre await
- **Worksheet validation**: Verificare esistenza colonne prima di leggere
- **Error handling**: Gestire file mancanti, permessi, formati invalidi
- **Backup**: Considerare backup prima di sovrascrivere file

### Convenzioni Naming
- **File**: kebab-case (`web-automation.ts`, `login-form.tsx`)
- **Componenti React**: PascalCase (`LoginForm`, `LogViewer`)
- **Funzioni/variabili**: camelCase (`startAutomation`, `userData`)
- **Costanti**: UPPER_SNAKE_CASE (`MAX_RETRIES`, `DEFAULT_TIMEOUT`)
- **Interfacce**: PascalCase con I prefix opzionale (`ProcessResult`, `IElectronAPI`)

---

## ⚠️ Regole Critiche

### 🚫 NON Fare
1. **NON** modificare `nodeIntegration: false` in BrowserWindow (security risk)
2. **NON** disabilitare `contextIsolation: true` (security risk)
3. **NON** esporre `ipcRenderer` direttamente nel renderer (usare preload)
4. **NON** eseguire comandi shell non validati (command injection risk)
5. **NON** hardcodare credenziali o API keys (usare env variables)
6. **NON** committare file Excel con dati sensibili in data/
7. **NON** committare screenshot in logs/
8. **NON** modificare `package.json` senza testare build
9. **NON** usare `any` type in TypeScript
10. **NON** bypassare ESLint warnings senza ragione valida

### ✅ Sempre Fare
1. **SEMPRE** usare try/catch in operazioni async (Playwright, Excel, IPC)
2. **SEMPRE** validare input utente prima di usarlo
3. **SEMPRE** chiudere risorse (browser, file handle)
4. **SEMPRE** loggare errori con timestamp e stack trace
5. **SEMPRE** testare build Electron dopo modifiche main/preload
6. **SEMPRE** eseguire `npm run lint && npm run format` prima di commit
7. **SEMPRE** aggiornare docs/ quando cambiano architettura o features
8. **SEMPRE** usare `config.ts` per configurazioni condivise
9. **SEMPRE** documentare decisioni importanti in docs/DECISIONS.md
10. **SEMPRE** verificare type safety (`npm run compile`) prima di build

---

## 🔒 Security Checklist

### Electron Security
- ✅ Context isolation abilitato
- ✅ nodeIntegration disabilitato
- ✅ Preload script con contextBridge
- ✅ IPC con whitelist API
- ✅ Validazione input da renderer
- ✅ CSP headers configurati
- ✅ webSecurity abilitato

### Playwright Security
- ✅ Browser lanciato con sandbox
- ✅ Credenziali mai hardcodate
- ✅ Timeout per prevenire hang
- ✅ Screenshot senza dati sensibili

---

## 🚫 File da NON Modificare

### Directory Generate (da build tools)
- `node_modules/` - Dipendenze npm
- `dist/` - Output Vite build
- `dist-electron/` - Output Electron build
- `out/` - Output Electron Builder
- `.vite/` - Cache Vite

### File Generate
- `package-lock.json` - Lock file npm (modificare solo via npm install)
- `.tsbuildinfo` - Cache TypeScript compiler

### Directory Dati
- `data/*.xlsx` - File Excel (esclusi da git, tranne .gitkeep)
- `logs/*.log` - Log files (esclusi da git, tranne .gitkeep)
- `logs/*.png` - Screenshot (esclusi da git)

### Config Delicati (modificare con cautela)
- `vite.config.ts` - Configurazione build (3 entry points: main, preload, renderer)
- `electron-builder` config in package.json - Packaging multi-platform

---

## 📚 Risorse

### Documentazione Ufficiale
- [Electron Docs](https://www.electronjs.org/docs/latest/)
- [Playwright Docs](https://playwright.dev/)
- [React 18 Docs](https://react.dev/)
- [Vite Docs](https://vitejs.dev/)
- [ExcelJS Docs](https://github.com/exceljs/exceljs)

### Documentazione Progetto
- `docs/PROJECT_CONTEXT.md` - Architettura dettagliata
- `docs/QUICK_REFERENCE.md` - Quick reference comandi
- `README.md` - Setup e guida TypeScript/CLI
- `README-ELECTRON.md` - Guida Electron app

### Slash Commands Custom
Usa `/project:*` per comandi custom (vedi `.claude/commands/`)

---

## 🎯 Best Practices

### Development Workflow
1. `npm run electron:dev` per sviluppo attivo
2. Hot reload automatico per renderer (Vite)
3. Restart manuale per main/preload dopo modifiche
4. Test frequenti in Electron window (non solo browser)

### Debugging
- **Renderer**: DevTools Electron (Ctrl+Shift+I)
- **Main process**: VS Code debugger o console.log
- **Playwright**: Screenshot + `page.pause()` per debugging
- **IPC**: Log messaggi in main e preload per tracciare comunicazione

### Performance
- **React**: Usare React.memo per componenti pesanti
- **Zustand**: Selettori granulari per evitare re-render inutili
- **Playwright**: Riutilizzare browser context quando possibile
- **Excel**: Batch operations invece di scritture multiple

---

**Versione**: 1.0.0
**Ultimo aggiornamento**: 2025-11-07
