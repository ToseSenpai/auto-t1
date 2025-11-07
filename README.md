# Auto-T1 - Automazione Web con TypeScript

Applicazione TypeScript moderna per automatizzare operazioni ripetitive su siti web, con lettura e scrittura dati da/verso file Excel.

## Caratteristiche

- **TypeScript moderno** con strict mode e type safety completa
- **Automazione browser** con Playwright (modalità visibile per debug)
- **Gestione Excel** con exceljs (performante e async)
- **Login automatico** con credenziali fornite all'avvio
- **Estrazione dati** dal sito web e salvataggio su Excel
- **Screenshot automatici** in caso di errori
- **ESM modules** con import/export moderni

## Prerequisiti

- **Node.js 18+** (consigliato 20 LTS)
- **npm** o **yarn** (gestore pacchetti)

## Installazione

### 1. Installa le dipendenze

```bash
npm install
```

Questo installerà:
- TypeScript
- Playwright
- exceljs
- Tutti i dev tools (eslint, prettier, tsx)

### 2. Installa i browser per Playwright

```bash
npx playwright install chromium
```

## Configurazione

### 1. Configura il sito web target

Il file [src/config.ts](src/config.ts) è già configurato per il sito BlueJay Solutions:

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

### 2. Personalizza le operazioni web

Modifica la funzione `processRow()` in [src/main.ts](src/main.ts):

```typescript
async function processRow(
  web: WebAutomation,
  rowData: RowData
): Promise<RowData> {
  // Esempio: leggi valore dalla colonna A
  const nome = rowData.A;

  // Compila un campo sul sito
  await web.fillField("#nome-input", String(nome));

  // Clicca un pulsante
  await web.clickButton("#submit-btn");

  // Aspetta che appaia un risultato
  await web.waitForElement(".result", 10000);

  // Estrai il risultato
  const risultato = await web.getText(".result");

  // Ritorna i dati da scrivere su Excel
  return { C: risultato };
}
```

## Struttura del progetto

```
auto-t1/
├── src/
│   ├── config.ts              # Configurazioni con interfacce TypeScript
│   ├── excel-handler.ts       # Gestione Excel con exceljs
│   ├── web-automation.ts      # Automazione browser Playwright
│   └── main.ts               # Entry point
├── dist/                      # File JavaScript compilati (generato)
├── data/
│   └── input.xlsx            # File Excel
├── logs/
│   └── screenshots/          # Screenshot automatici
├── package.json              # Dipendenze e scripts
├── tsconfig.json             # Configurazione TypeScript
└── README-TS.md             # Questa guida
```

## Utilizzo

### Modalità sviluppo (con tsx - più veloce)

```bash
npm run dev
```

Usa `tsx` per eseguire TypeScript direttamente senza compilare.

### Modalità produzione (compilato)

```bash
npm run build  # Compila TypeScript → JavaScript
npm start      # Esegue il programma compilato
```

### Watch mode (ricompila automaticamente)

```bash
npm run watch
```

### Il programma:

1. Ti chiederà username e password (la password è nascosta con asterischi)
2. Caricherà il file Excel
3. Aprirà il browser in modalità visibile
4. Eseguirà il login
5. Processerà ogni riga di dati
6. Scriverà i risultati su Excel
7. Salverà e chiuderà tutto

## Operazioni disponibili

La classe `WebAutomation` offre questi metodi (tutti **async**):

```typescript
// Navigazione
await web.navigateTo("https://example.com");

// Compilare campi
await web.fillField("#campo", "valore");

// Compilare campi Vaadin (Shadow DOM)
await web.fillVaadinField("#vaadinField", "valore");

// Cliccare elementi
await web.clickButton("#bottone");

// Estrarre testo
const testo = await web.getText(".classe");

// Estrarre attributi
const link = await web.getAttribute("a", "href");

// Attendere elementi
await web.waitForElement(".loading", 5000);

// Screenshot
await web.takeScreenshot("nome_file");

// Azioni personalizzate
await web.executeCustomAction({
  type: "extract_text",
  selector: ".result"
});
```

## Metodi della classe ExcelHandler

Tutti i metodi sono **async**:

```typescript
// Leggere una riga
const rowData = excel.readRow(2);
// { A: 'valore1', B: 'valore2' }

// Leggere tutte le righe
const allRows = excel.readAllRows();

// Scrivere una cella
excel.writeCell(2, 'C', 'risultato');

// Scrivere una riga intera
excel.writeRow(2, { C: 'risultato1', D: 'risultato2' });

// Salvare (async!)
await excel.save();
```

## Scripts npm disponibili

```bash
npm run dev      # Esegue con tsx (dev mode, no build)
npm run build    # Compila TypeScript → JavaScript
npm start        # Esegue il programma compilato
npm run watch    # Watch mode per ricompilazione automatica
npm run clean    # Pulisce la cartella dist/
npm run lint     # Controlla il codice con ESLint
npm run format   # Formatta il codice con Prettier
```

## Modalità di esecuzione

### Modalità visibile (default - per debug)

Il browser si apre in una finestra visibile, rallentato di 500ms.

In [src/config.ts](src/config.ts):
```typescript
static readonly BROWSER_CONFIG = {
  headless: false,
  slowMo: 500,
  // ...
};
```

### Modalità headless (per produzione)

Il browser gira in background, più veloce.

```typescript
static readonly BROWSER_CONFIG = {
  headless: true,
  slowMo: 0,
  // ...
};
```

## Vantaggi di TypeScript vs Python

### Type Safety
```typescript
// TypeScript ti avvisa se sbagli tipo
const result: string | null = await web.getText(".selector");
if (result) {
  // TypeScript sa che qui result è string, non null
  console.log(result.toUpperCase());
}
```

### Autocompletion migliore
```typescript
// L'IDE ti suggerisce tutti i metodi disponibili
web.  // Ctrl+Space mostra: fillField, clickButton, getText, etc.
```

### Async/await nativo
```typescript
// Più naturale per operazioni I/O
const rows = excel.readAllRows();
for (const row of rows) {
  await processRow(web, row); // Async nativo
}
```

### Interfacce per configurazione
```typescript
// Config è type-safe
const timeout: number = Config.getTimeout("navigation");
// Se scrivi "navigaton" (typo), TypeScript ti avvisa!
```

## Troubleshooting

### Errore: "Cannot find module"
```bash
npm install
```

### Errore di compilazione TypeScript
```bash
npm run clean
npm run build
```

### Errore: "Browser non trovato"
```bash
npx playwright install chromium
```

### Il login non funziona
- Controlla i selettori in [src/config.ts](src/config.ts)
- Verifica gli screenshot in `logs/screenshots/`
- Aumenta il timeout in `Config.TIMEOUTS`

## Debugging

### Con VSCode

Crea `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Auto-T1",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

Poi premi F5 per debuggare!

### Con Chrome DevTools

```bash
node --inspect dist/main.js
```

Apri `chrome://inspect` nel browser.

## Differenze rispetto alla versione Python

| Feature | Python | TypeScript |
|---------|--------|------------|
| **Type safety** | Runtime (opzionale) | Compile-time (strict) |
| **Async** | asyncio sintassi più verbosa | async/await nativo |
| **Performance** | Buona | Migliore per I/O |
| **Excel** | openpyxl (sync) | exceljs (async) |
| **IDE support** | Buono | Eccellente |
| **Vaadin/DOM** | JavaScript via string | Nativo, type-safe |
| **Deployment** | Interprete Python | Node.js (più comune) |

## Prossimi passi

1. Installa dipendenze: `npm install`
2. Installa browser: `npx playwright install chromium`
3. Personalizza `processRow()` in [src/main.ts](src/main.ts)
4. Crea file Excel: `data/input.xlsx`
5. Esegui: `npm run dev`

## Sicurezza

- Le credenziali **NON vengono salvate** in nessun file
- Input password nascosto con asterischi
- Type safety previene molti errori comuni
- Strict mode TypeScript attivo

## Licenza

Progetto personale - uso libero
