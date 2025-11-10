# Auto-T1 - Automazione Web con Electron + React

🚀 **Applicazione Desktop** moderna per automatizzare operazioni ripetitive su siti web, con interfaccia grafica e browser integrato.

## 🆕 Novità v1.1.0 (Parte 2 Completata)

- ✨ **MRN Search & Data Extraction**: Ricerca automatica MRN con estrazione risultati da tabella web
- ✨ **Settings Configuration**: Automazione configurazione filtri (Public Layout "STANDARD ST")
- ✨ **Date Range Automation**: Fill automatico range date (oggi - 1 mese → oggi)
- ✨ **Table Header Extraction**: Estrazione dinamica titoli colonne da vaadin-grid
- ✨ **Multi-MRN Loop Processing**: Loop automatico su tutti MRN con progress tracking [X/Y]
- ✨ **Excel Writing with Headers**: Scrittura Excel con header + dati multipli su righe consecutive
- ✨ **MRN Matching Filter**: Estrazione solo righe con MRN corrispondente (no dati errati)
- 🐛 **Fixed**: Estrazione multipla righe, MRN filtering, Shadow DOM date-time picker

## Caratteristiche

- 🖥️ **Electron App** - Applicazione desktop nativa (Windows/Mac/Linux)
- ⚛️ **React + TypeScript** - UI moderna e type-safe
- 🌐 **Browser integrato** - Vedi tutte le operazioni in tempo reale tramite BrowserView
- 📊 **Gestione Excel** con exceljs (async e performante)
- 🔐 **Login automatico** con form integrato
- 📈 **Progress bar** e statistiche real-time
- 📝 **Log viewer** con aggiornamenti live
- 🎨 **Tailwind CSS** - Design moderno e responsive
- 🎯 **Zustand** - State management leggero e veloce

## Architettura

```
┌────────────────────────────────────────┐
│  Auto-T1 Desktop App                   │
├─────────────┬──────────────────────────┤
│             │                          │
│  Sidebar    │  Browser View            │
│  (React)    │  (Chromium integrato)    │
│             │                          │
│  • Login    │  ┌────────────────────┐  │
│  • Controls │  │                    │  │
│  • Progress │  │   Vedi il sito     │  │
│  • Logs     │  │   in tempo reale   │  │
│             │  │                    │  │
│             │  └────────────────────┘  │
└─────────────┴──────────────────────────┘
```

## Prerequisiti

- **Node.js 18+** (consigliato 20 LTS)
- **npm** (gestore pacchetti)

## Installazione

### 1. Installa le dipendenze

```bash
npm install
```

Questo installerà:
- Electron
- React 18 + React DOM
- Playwright (automazione browser)
- exceljs (gestione Excel)
- Zustand (state management)
- Tailwind CSS (styling)
- Vite (build tool)
- TypeScript + tutti i type definitions

### 2. Installa i browser per Playwright

```bash
npx playwright install chromium
```

## Configurazione

### 1. Configura il sito web target

Modifica [src/config.ts](src/config.ts) con URL e selettori del tuo sito:

```typescript
static readonly BASE_URL = "https://app.customs.blujaysolutions.net";
static readonly LOGIN_URL = "https://app.customs.blujaysolutions.net";

static readonly SELECTORS = {
  login: {
    username_field: "#txtUsername",
    password_field: "#pwdPassword",
    submit_button: "#btnLogin",
  },
};
```

### 2. Personalizza la logica di automazione

Modifica la funzione `processRow()` in [electron/main.ts](electron/main.ts):

```typescript
async function processRow(
  web: WebAutomation,
  rowData: RowData
): Promise<RowData> {
  // La tua logica qui
  // await web.navigateTo("...");
  // await web.fillField("#input", String(rowData.A));
  // const result = await web.getText(".result");

  return { C: result }; // Scrivi nella colonna C
}
```

## Struttura del progetto

```
auto-t1/
├── electron/
│   ├── main.ts              # Processo principale Electron
│   └── preload.ts           # Bridge IPC sicuro
├── src/
│   ├── renderer/            # App React
│   │   ├── components/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   ├── Controls.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── LogViewer.tsx
│   │   ├── store/
│   │   │   └── useStore.ts  # Zustand store
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   ├── index.html
│   │   └── index.css
│   ├── config.ts            # Configurazioni
│   ├── excel-handler.ts     # Gestione Excel
│   └── web-automation.ts    # Automazione Playwright
├── data/
│   └── input.xlsx          # File Excel (creare)
├── logs/
│   └── screenshots/        # Screenshot errori
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── README-ELECTRON.md
```

## Utilizzo

### Modalità sviluppo

```bash
npm run electron:dev
```

Avvia:
- Server Vite su `http://localhost:5173` (hot reload React)
- Electron in modalità sviluppo
- DevTools aperto automaticamente

### Compilazione

```bash
npm run compile
```

Compila TypeScript → JavaScript

### Build produzione

```bash
npm run electron:build
```

Crea installer per il tuo sistema operativo:
- **Windows**: `.exe` (NSIS installer) in `out/`
- **Mac**: `.dmg` in `out/`
- **Linux**: `.AppImage` in `out/`

## Come funziona

### 1. Avvio App

- Apri l'app
- Vedrai la sidebar a sinistra e area browser a destra

### 2. Inserisci Credenziali

- **Username**: Le tue credenziali del sito
- **Password**: Password (nascosta)
- **File Excel**: Percorso del file (default: `data/input.xlsx`)

### 3. Start Automazione

- Click su pulsante **Start ▶**
- L'app:
  1. Carica il file Excel
  2. Avvia browser (visibile nel BrowserView)
  3. Esegue login automatico
  4. Processa ogni riga Excel
  5. Mostra progress bar e log real-time
  6. Salva risultati nell'Excel

### 4. Monitoraggio

- **Browser View**: Vedi tutte le operazioni live
- **Progress Bar**: Percentuale completamento
- **Stats**: Successi ed errori
- **Log Viewer**: Tutti i messaggi in tempo reale

### 5. Controlli

- **Pause ⏸**: Metti in pausa
- **Resume ▶**: Riprendi
- **Stop ⏹**: Ferma completamente

## Scripts npm disponibili

```bash
npm run dev              # Solo Vite (React dev server)
npm run electron:dev     # Electron + Vite in dev mode
npm run electron:start   # Avvia Electron (dopo compile)
npm run compile          # Compila TypeScript
npm run build            # Build completo
npm run electron:build   # Build + crea installer
npm run clean            # Pulisce dist/
npm run lint             # Linting TypeScript/React
npm run format           # Formatta codice con Prettier
```

## Comunicazione IPC

L'app usa Electron IPC per comunicazione sicura tra processi:

### Dal Renderer (React) → Main (Electron)

```typescript
// Avvia automazione
const result = await window.electronAPI.startAutomation({
  username,
  password,
  excelPath,
});

// Processa righe
const processResult = await window.electronAPI.processRows();

// Stop
await window.electronAPI.stopAutomation();
```

### Dal Main → Renderer (eventi)

```typescript
// Status updates
window.electronAPI.onStatus((data) => {
  console.log(data.type, data.message);
});

// Progress updates
window.electronAPI.onProgress((data) => {
  console.log(`${data.current}/${data.total}`);
});
```

## BrowserView

Electron `BrowserView` mostra il browser Chromium integrato:

- **Posizionato** automaticamente accanto alla sidebar
- **Ridimensionato** automaticamente con la finestra
- **Sincronizzato** con Playwright (stessa sessione)
- **Visibile** in tempo reale

## Personalizzazione

### Cambia colori

Modifica [tailwind.config.js](tailwind.config.js):

```js
theme: {
  extend: {
    colors: {
      primary: {
        500: "#your-color",
        // ...
      },
    },
  },
}
```

### Aggiungi nuove azioni

Modifica [electron/main.ts](electron/main.ts) per aggiungere handler IPC:

```typescript
ipcMain.handle("automation:custom-action", async (_, data) => {
  // La tua logica
  return { success: true };
});
```

E in [electron/preload.ts](electron/preload.ts):

```typescript
customAction: (data) => ipcRenderer.invoke("automation:custom-action", data),
```

## Troubleshooting

### Errore: "Cannot find module"

```bash
npm install
npx playwright install chromium
```

### Errore di compilazione

```bash
npm run clean
npm run compile
```

### Browser non appare nel BrowserView

- Verifica che Playwright sia installato: `npx playwright install chromium`
- Controlla i log nella console DevTools

### L'app non si avvia

```bash
# Pulisci e reinstalla
npm run clean
rm -rf node_modules
npm install
```

## Debugging

### DevTools

In modalità dev (`npm run electron:dev`):
- DevTools React: Aperto automaticamente
- DevTools Main Process: Apri manualmente

### Logs

- Main process: Vedi console del terminale
- Renderer process: Vedi DevTools
- Automazione: Vedi Log Viewer nell'app

### Screenshots

Gli screenshot degli errori vengono salvati in:
```
logs/screenshots/error_row_X_TIMESTAMP.png
```

## Deploy

### Windows

```bash
npm run electron:build
```

Crea: `out/Auto-T1 Setup 1.0.0.exe`

### Mac

```bash
npm run electron:build
```

Crea: `out/Auto-T1-1.0.0.dmg`

### Linux

```bash
npm run electron:build
```

Crea: `out/Auto-T1-1.0.0.AppImage`

## Sicurezza

- ✅ Credenziali **NON salvate** (solo in memoria durante l'esecuzione)
- ✅ Context Isolation abilitato (Electron security)
- ✅ Node Integration disabilitato nel renderer
- ✅ Preload script con API esposte in modo sicuro
- ✅ TypeScript strict mode per type safety

## Tech Stack

| Tecnologia | Versione | Scopo |
|------------|----------|-------|
| **Electron** | 28.x | Desktop app framework |
| **React** | 18.x | UI library |
| **TypeScript** | 5.x | Type safety |
| **Playwright** | 1.41.x | Browser automation |
| **exceljs** | 4.x | Excel handling |
| **Zustand** | 4.x | State management |
| **Tailwind CSS** | 3.x | Styling |
| **Vite** | 5.x | Build tool |

## Prossimi passi

1. ✅ `npm install` - Installa dipendenze
2. ✅ `npx playwright install chromium` - Installa browser
3. ✅ Personalizza `processRow()` in [electron/main.ts](electron/main.ts)
4. ✅ Crea `data/input.xlsx` con i tuoi dati
5. ✅ `npm run electron:dev` - Avvia in modalità sviluppo
6. ✅ Testa l'automazione
7. ✅ `npm run electron:build` - Build per produzione

## Licenza

Progetto personale - uso libero
