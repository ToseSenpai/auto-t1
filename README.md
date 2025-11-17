<div align="center">

# 🚀 Auto-T1

### Automazione Dichiarazioni Doganali NCTS

*Applicazione desktop Electron per processamento automatico multi-MRN con browser automation e gestione Excel*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-28-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Playwright](https://img.shields.io/badge/Playwright-1.41-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/)

[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=for-the-badge)](https://github.com/ToseSenpai/auto-t1)

[🎯 Features](#-features) •
[📦 Installazione](#-installazione) •
[🚀 Quick Start](#-quick-start) •
[📖 Documentazione](#-documentazione) •
[🐛 Bug & Fix](#-bug-fix-noti)

---

</div>

## 📋 Indice

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisiti](#-prerequisiti)
- [Installazione](#-installazione)
- [Quick Start](#-quick-start)
- [Architettura](#-architettura)
- [Comandi Disponibili](#-comandi-disponibili)
- [Configurazione](#-configurazione)
- [Bug & Fix Noti](#-bug--fix-noti)
- [Sviluppo](#-sviluppo)
- [Sicurezza](#-sicurezza)
- [Contributing](#-contributing)
- [Licenza](#-licenza)

---

## ✨ Features

### 🎯 Core Features

- **🔄 Multi-MRN Batch Processing** - Processa automaticamente N dichiarazioni in sequenza da file Excel
- **🌐 Browser Automation** - Playwright integrato per automazione web completa (headless/visible)
- **📊 Gestione Excel** - Lettura/scrittura async con ExcelJS 4.4+
- **🖥️ UI Moderna** - Interfaccia React 18 con design Windows 11 style
- **⚡ Real-time Progress** - Tracking live con formato `[X/Y]` e log dettagliati
- **📸 Screenshot Automatici** - Salvataggio screenshot in caso di errori o per debug
- **🔐 Login Sicuro** - Credenziali non salvate, input password mascherato

### 🔧 Features Tecniche

- **Shadow DOM Support** - Accesso completo ai componenti Vaadin (date-time-picker, combo-box, text-field)
- **Auto-retry Logic** - Gestione intelligente errori di rete e timeout
- **IPC Communication** - Comunicazione sicura Electron Main ↔ Renderer
- **Context Isolation** - Sandbox completo per sicurezza renderer process
- **TypeScript Strict Mode** - Type safety completo su tutto il codebase
- **Hot Reload** - Dev mode con aggiornamento automatico (Vite HMR)

### 📦 Flusso Automazione

```
1. Login automatico
   ↓
2. Naviga a Dichiarazioni
   ↓
3. Per ogni MRN nel file Excel:
   ├─ Click "Nuova dichiarazione"
   ├─ Click "NCTS Arrival Notification IT"
   ├─ Click "MX DHL - MXP GTW - DEST AUT"
   ├─ Conferma selezione (OK)
   ├─ Compila campo MRN
   ├─ Verifica Sede destinazione (IT279100)
   ├─ Compila Data/Ora arrivo (oggi 20:00)
   └─ Invia dichiarazione
   ↓
4. Salva risultati su Excel
```

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI Components con hooks
- **TypeScript 5.3** - Type safety strict mode
- **Tailwind CSS 3.4** - Utility-first styling
- **Zustand 4.5** - State management leggero

### Backend/Desktop
- **Electron 28** - Multi-processo (Main + Renderer)
- **Playwright 1.41** - Browser automation headless/visible
- **ExcelJS 4.4** - Gestione file Excel async
- **Node.js 18+** - Runtime JavaScript

### Build Tools
- **Vite 5** - Build tool ultra-veloce con HMR
- **electron-builder** - Packaging multi-platform
- **ESLint + Prettier** - Code quality & formatting

---

## ✅ Prerequisiti

- **Node.js 18+** (raccomandato: 20 LTS)
- **npm 9+** o **yarn 1.22+**
- **Windows 10/11**, **macOS 10.15+**, o **Linux**
- **4GB RAM** minimo (8GB raccomandato)
- **Connessione Internet** per installazione dipendenze

---

## 📦 Installazione

### 1️⃣ Clona il repository

```bash
git clone https://github.com/ToseSenpai/auto-t1.git
cd auto-t1
```

### 2️⃣ Installa le dipendenze

```bash
npm install
```

Questo installerà:
- Electron, React, TypeScript
- Playwright + browser Chromium
- ExcelJS, Zustand, Tailwind CSS
- Dev tools (Vite, ESLint, Prettier)

### 3️⃣ Installa i browser Playwright (se necessario)

```bash
npx playwright install chromium
```

---

## 🚀 Quick Start

### Avvio Applicazione (Sviluppo)

```bash
npm run electron:dev
```

Questo avvia:
- ✅ Vite dev server (hot reload renderer)
- ✅ Electron app con DevTools
- ✅ Watch mode su tutti i file

### Preparazione File Excel

1. Crea file `data/input.xlsx` con colonna MRN:

| MRN              |
|------------------|
| 25IT0000001234E0 |
| 25IT0000005678E0 |
| 25IT0000009012E0 |

2. L'app leggerà automaticamente tutti gli MRN e li processerà in sequenza

### Login

All'avvio, inserisci:
- **Username** - Il tuo username BlueJay Solutions
- **Password** - Password mascherata (non salvata)

---

## 🏗️ Architettura

### Struttura Directory

```
auto-t1/
├── electron/                # 🔧 Main Process Electron
│   ├── main.ts             # Entry point, IPC handlers, orchestrazione
│   └── preload.ts          # Context bridge (security)
├── src/
│   ├── config.ts           # ⚙️ Configurazione (selettori, timeout, URL)
│   ├── excel-handler.ts    # 📊 Gestione Excel (ExcelJS async)
│   ├── web-automation.ts   # 🌐 Automazione Playwright (browser control)
│   ├── main.ts             # 🖥️ Entry CLI (esecuzione terminal)
│   └── renderer/           # 🎨 React UI
│       ├── App.tsx         # App principale
│       ├── components/     # Componenti UI (Sidebar, Controls, LoginForm, LogViewer)
│       └── store/          # Zustand store (useStore.ts)
├── data/                   # 📁 File Excel input (.gitignore *.xlsx)
├── logs/                   # 📸 Screenshot e log (.gitignore *.log, *.png)
├── docs/                   # 📚 Documentazione progetto
│   ├── PROJECT_CONTEXT.md  # Architettura e tech stack
│   ├── CURRENT_STATUS.md   # Stato implementazione
│   ├── ACTIVE_ROADMAP.md   # Roadmap features
│   └── BUG_MULTI_MRN_SECOND_CLICK.md  # Bug fix log
└── .claude/                # 🤖 Claude Code settings & commands
```

### Multi-processo Electron

```
┌─────────────────────────────────────────────────┐
│  Main Process (Node.js)                         │
│  - electron/main.ts                             │
│  - IPC handlers                                 │
│  - Browser automation (Playwright)              │
│  - Excel operations (ExcelJS)                   │
└─────────────┬───────────────────────────────────┘
              │ IPC Communication
              │ (Context Isolation)
┌─────────────▼───────────────────────────────────┐
│  Renderer Process (Chromium)                    │
│  - React UI                                     │
│  - State management (Zustand)                   │
│  - User interactions                            │
└─────────────────────────────────────────────────┘
```

---

## 🎮 Comandi Disponibili

### Sviluppo

```bash
# Avvia app Electron in dev mode (HOT RELOAD)
npm run electron:dev

# Solo Vite dev server (renderer)
npm run dev

# Compila TypeScript in watch mode
npm run watch
```

### Build & Produzione

```bash
# Build completo: TypeScript → Vite → Electron Builder
npm run build

# Build Electron app (senza tsc)
npm run electron:build

# Avvia Electron da dist compilato
npm run electron:start
```

### Quality & Manutenzione

```bash
# ESLint su src/**/*.{ts,tsx}
npm run lint

# Prettier format src/**/*.{ts,tsx}
npm run format

# Compila TypeScript (type checking)
npm run compile

# Pulisci dist, dist-electron, out
npm run clean

# Preview build Vite
npm run preview
```

---

## ⚙️ Configurazione

### 1. Selettori e Timeout ([src/config.ts](src/config.ts))

```typescript
static readonly BASE_URL = "https://app.customs.blujaysolutions.net";

static readonly SELECTORS = {
  login: {
    username_field: "#txtUsername",
    password_field: "#pwdPassword",
    submit_button: "#btnLogin",
  },
  // ...
};

static readonly TIMEOUTS = {
  navigation: 30000,    // 30s
  element: 10000,       // 10s
  network: 15000,       // 15s
};
```

### 2. Browser Mode (Headless/Visible)

In `src/config.ts`:

```typescript
// Debug (browser visibile)
static readonly BROWSER_CONFIG = {
  headless: false,
  slowMo: 500,
};

// Produzione (headless, veloce)
static readonly BROWSER_CONFIG = {
  headless: true,
  slowMo: 0,
};
```

### 3. Orario di Arrivo

Modificare in `src/web-automation.ts` (riga ~998):

```typescript
const hours = "20";   // Ora fissa (es: 20:00)
const minutes = "00"; // Minuti fissi
```

---

## 🐛 Bug & Fix Noti

### ✅ [RISOLTO] Click NCTS fallisce al secondo MRN

**Data Fix**: 2025-11-13
**Commit**: [`8e2f928`](https://github.com/ToseSenpai/auto-t1/commit/8e2f928)

**Problema:** Al secondo MRN, `clickNCTS()` falliva perché la grid non era popolata.

**Causa:** `navigateToNewDeclaration()` navigava a `/cm/declarations` ma **non cliccava** il bottone "Nuova dichiarazione".

**Fix:** Aggiunto click esplicito su `#btnNewDeclaration` dopo `page.goto()` in `navigateToNewDeclaration()`.

**Documentazione completa:** [docs/BUG_MULTI_MRN_SECOND_CLICK.md](docs/BUG_MULTI_MRN_SECOND_CLICK.md)

---

## 👨‍💻 Sviluppo

### Workflow Consigliato

1. **Sviluppo attivo**: `npm run electron:dev` (hot reload completo)
2. **Lint/Format**: `npm run lint && npm run format` prima di commit
3. **Build produzione**: `npm run build` (genera installer Windows/Mac/Linux)

### Debugging

- **Renderer Process**: Electron DevTools (`Ctrl+Shift+I`)
- **Main Process**: VS Code debugger o `console.log`
- **Playwright**: Screenshot automatici in `logs/screenshots/` + `page.pause()` per debug

### Standard di Codifica

- **TypeScript Strict Mode** - Sempre abilitato
- **No `any` type** - Usare `unknown` o tipi specifici
- **Async/await** - Preferire a Promise chains
- **Error handling** - Sempre try/catch nei blocchi async
- **Functional components** - Solo function components + hooks in React

**Dettagli completi:** [CLAUDE.md](CLAUDE.md)

---

## 🔒 Sicurezza

### Electron Security Best Practices

- ✅ **Context Isolation** - Abilitato (preload script isolato)
- ✅ **nodeIntegration** - Disabilitato nel renderer
- ✅ **IPC Whitelist** - Solo API specifiche esposte
- ✅ **Input Validation** - Tutti gli input validati in main process
- ✅ **CSP Headers** - Content Security Policy configurati
- ✅ **webSecurity** - Abilitato

### Credenziali

- ❌ **MAI salvate** in file o localStorage
- ✅ Input password **mascherato** con asterischi
- ✅ Credenziali passate solo via IPC sicuro
- ✅ Nessun logging di credenziali

---

## 🤝 Contributing

Contributi benvenuti! Per favore:

1. Fork il repository
2. Crea un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. Commit le modifiche (`git commit -m 'feat: Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

### Conventional Commits

Usa [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: ✨ Nuova feature
fix: 🐛 Bug fix
docs: 📝 Documentazione
style: 💄 Formattazione
refactor: ♻️ Refactoring
test: ✅ Test
chore: 🔧 Manutenzione
```

---

## 📚 Documentazione

- [**PROJECT_CONTEXT.md**](docs/PROJECT_CONTEXT.md) - Architettura dettagliata
- [**CURRENT_STATUS.md**](docs/CURRENT_STATUS.md) - Stato implementazione
- [**ACTIVE_ROADMAP.md**](docs/ACTIVE_ROADMAP.md) - Roadmap features
- [**DECISIONS.md**](docs/DECISIONS.md) - Log decisioni architetturali
- [**CLAUDE.md**](CLAUDE.md) - Guida per Claude Code (AI assistant)

---

## 📄 Licenza

Questo progetto è distribuito sotto licenza **MIT**.

Vedi [LICENSE](LICENSE) per dettagli.

---

## 🙏 Credits

Sviluppato con ❤️ da [ToseSenpai](https://github.com/ToseSenpai)

Generato con assistenza di [Claude Code](https://claude.com/claude-code) by Anthropic

---

<div align="center">

### ⭐ Se questo progetto ti è utile, lascia una stella!

[![GitHub stars](https://img.shields.io/github/stars/ToseSenpai/auto-t1?style=social)](https://github.com/ToseSenpai/auto-t1/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/ToseSenpai/auto-t1?style=social)](https://github.com/ToseSenpai/auto-t1/network/members)
[![GitHub watchers](https://img.shields.io/github/watchers/ToseSenpai/auto-t1?style=social)](https://github.com/ToseSenpai/auto-t1/watchers)

**[⬆ Torna su](#-auto-t1)**

</div>
