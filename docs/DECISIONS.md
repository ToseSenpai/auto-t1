# Auto-T1 - Log Decisioni Architetturali (ADR)

**Architecture Decision Record**

Questo documento traccia tutte le decisioni architetturali importanti prese durante lo sviluppo del progetto Auto-T1, seguendo il formato ADR (Architecture Decision Record).

---

## Template ADR

```markdown
### ADR-XXX: [Titolo Decisione]
**Data**: YYYY-MM-DD
**Status**: Accepted | Rejected | Superseded | Deprecated
**Contesto**: [Descrizione problema/situazione]
**Decisione**: [Cosa abbiamo deciso]
**Conseguenze**: [Impatti positivi e negativi]
**Alternative Considerate**: [Altre opzioni valutate]
```

---

## ADR-001: Electron come Desktop Framework

**Data**: 2025-01-15 (stimata)
**Status**: ✅ Accepted

### Contesto
Necessità di creare un'applicazione desktop cross-platform che integri browser automation (Playwright) con UI moderna e accesso al file system per gestione Excel.

### Decisione
Utilizzare **Electron 28** come framework desktop principale.

### Conseguenze

**Positive**:
- ✅ Cross-platform (Windows, macOS, Linux) con singola codebase
- ✅ Integrazione nativa Chromium per UI React moderna
- ✅ Accesso completo a Node.js APIs (fs, child_process, etc.)
- ✅ Ecosystem maturo (Electron Builder, electron-store, etc.)
- ✅ Playwright runs natively in Electron context
- ✅ Community enorme e documentazione eccellente

**Negative**:
- ❌ Bundle size grande (~80 MB con runtime Electron)
- ❌ Memory footprint alto (~150 MB idle)
- ❌ Startup time non istantaneo (~2s cold start)
- ❌ Security concerns (richiede hardening: context isolation, etc.)

### Alternative Considerate
1. **Tauri**: Più leggero, ma ecosystem immaturo e meno supporto per Playwright integration
2. **NW.js**: Simile a Electron ma meno community e documentation
3. **Native (C++/C#)**: Performance migliori ma development lento, no cross-platform facile
4. **Web App**: No accesso file system locale, deployment complesso per utenti finali

---

## ADR-002: React per UI Framework

**Data**: 2025-01-15 (stimata)
**Status**: ✅ Accepted

### Contesto
Necessità di costruire UI interattiva con state management complesso, real-time updates (log viewer, progress bar), e componenti riutilizzabili.

### Decisione
Utilizzare **React 18** come framework UI nel renderer process di Electron.

### Conseguenze

**Positive**:
- ✅ Component-based architecture scalabile
- ✅ Virtual DOM per performance UI ottimali
- ✅ Hooks API intuitiva per state management
- ✅ Ecosystem vastissimo (Tailwind, Zustand, react-window, etc.)
- ✅ TypeScript support first-class
- ✅ DevTools eccellenti per debugging

**Negative**:
- ❌ Bundle size aumentato (~500 KB React + ReactDOM)
- ❌ Learning curve per React patterns (hooks, memo, etc.)
- ❌ Re-render optimization necessaria per performance

### Alternative Considerate
1. **Vue.js**: API più semplice ma ecosystem più piccolo, meno diffuso in enterprise
2. **Svelte**: Compile-time framework performante ma giovane, poche librerie mature
3. **Vanilla JavaScript**: Nessuna dipendenza ma complessità ingestibile per UI complesse
4. **Angular**: Troppo heavy, overkill per desktop app

---

## ADR-003: Playwright per Browser Automation

**Data**: 2025-01-15 (stimata)
**Status**: ✅ Accepted

### Contesto
Necessità di automatizzare workflow web complessi con supporto headless/visible mode, screenshot, e gestione errori robusta.

### Decisione
Utilizzare **Playwright 1.41** come libreria per browser automation.

### Conseguenze

**Positive**:
- ✅ Multi-browser support (Chromium, Firefox, WebKit) con singola API
- ✅ Auto-wait intelligente (elimina race conditions e timeout manuali)
- ✅ Screenshot e video recording built-in
- ✅ Headless e visible modes per development/debugging
- ✅ Network interception e mocking
- ✅ Documentazione eccellente e supporto Microsoft attivo
- ✅ TypeScript types first-class

**Negative**:
- ❌ Browser binaries grandi (~300 MB Chromium)
- ❌ Memory usage alto durante automation (~200 MB per browser instance)
- ❌ Versioning browser può causare breaking changes

### Alternative Considerate
1. **Puppeteer**: Solo Chromium, meno features (no multi-browser, no auto-wait robusto)
2. **Selenium**: API verbosa, setup complesso, performance inferiori
3. **Cypress**: Solo browser testing UI, non adatto per automazione desktop
4. **Cheerio**: No browser real, solo HTML parsing (insufficiente per JS-heavy sites)

---

## ADR-004: ExcelJS per Gestione File Excel

**Data**: 2025-01-15 (stimata)
**Status**: ✅ Accepted

### Contesto
Necessità di leggere dati input da file Excel e scrivere risultati automazione in formato Excel, con supporto formati moderni (.xlsx) e operazioni async.

### Decisione
Utilizzare **ExcelJS 4.4** come libreria per lettura/scrittura Excel.

### Conseguenze

**Positive**:
- ✅ 100% JavaScript (no dipendenze native → cross-platform facile)
- ✅ Async/await API moderna (perfetto per Electron main process)
- ✅ Supporto completo .xlsx e .xls formati
- ✅ Styling, formule, chart support (per future features)
- ✅ Streaming per file Excel molto grandi
- ✅ Active maintenance e community responsive

**Negative**:
- ❌ Performance inferiori a librerie native (C++ binding) per file molto grandi
- ❌ Memory usage per file >100 MB può essere problematico
- ❌ API verbosa per operazioni complesse

### Alternative Considerate
1. **xlsx (SheetJS)**: Performance migliori ma API meno intuitiva, documentazione scarsa
2. **node-xlsx**: Troppo semplice, mancano features (styling, formule)
3. **fast-csv + custom Excel writer**: Complessità eccessiva, reinventare la ruota
4. **Google Sheets API**: Richiede internet, autenticazione complessa, latency alta

---

## ADR-005: Zustand per State Management

**Data**: 2025-01-15 (stimata)
**Status**: ✅ Accepted

### Contesto
Necessità di gestire state complesso nel renderer (logs array, progress, isPaused, stats) con aggiornamenti real-time da IPC e performance ottimali (no re-renders inutili).

### Decisione
Utilizzare **Zustand 4.5** come libreria per state management React.

### Conseguenze

**Positive**:
- ✅ API minimale (<1 KB gzipped) e intuitiva
- ✅ Zero boilerplate vs Redux (no actions, reducers, middleware)
- ✅ TypeScript support first-class con type inference
- ✅ Selectors granulari per ottimizzare re-renders
- ✅ DevTools integration per debugging
- ✅ No Context providers (performance migliori)
- ✅ Middleware support (persist, devtools, immer)

**Negative**:
- ❌ Ecosystem più piccolo vs Redux (meno middleware community)
- ❌ Meno diffuso in enterprise (può essere barrier per onboarding)
- ❌ Documentazione meno estesa vs Redux

### Alternative Considerate
1. **Redux Toolkit**: Troppo boilerplate anche con toolkit, overkill per app piccola
2. **MobX**: "Magic" behavior con decorators, debugging difficile, TypeScript integration complessa
3. **React Context API**: Performance issues con nested updates, provider hell
4. **Recoil**: Giovane, API ancora instabile, Facebook può abbandonare (vedi Flow)
5. **Jotai**: Simile a Zustand ma atom-based (più complesso per use case semplice)

---

## ADR-006: Vite come Build Tool

**Data**: 2025-01-15 (stimata)
**Status**: ✅ Accepted

### Contesto
Necessità di build tool moderno con Hot Module Replacement velocissimo per development, supporto TypeScript out-of-the-box, e bundle ottimizzato per production.

### Decisione
Utilizzare **Vite 5** come build tool principale per renderer process e compilation Electron.

### Conseguenze

**Positive**:
- ✅ HMR ultra-veloce (~200ms) vs Webpack (~5s)
- ✅ ES modules native in dev (no bundling → startup istantaneo)
- ✅ Plugin ecosystem ricco (vite-plugin-electron, react, etc.)
- ✅ Production build con Rollup ottimizzato (tree-shaking, code splitting)
- ✅ TypeScript support out-of-the-box (no config)
- ✅ CSS/PostCSS/Sass support integrato

**Negative**:
- ❌ Meno maturo di Webpack (possibili edge cases)
- ❌ Configurazione multi-entry (main, preload, renderer) richiede plugin custom
- ❌ Meno plugin disponibili vs Webpack ecosystem

### Alternative Considerate
1. **Webpack 5**: Maturo ma lento (HMR ~5s), configurazione verbosa
2. **Parcel 2**: Semplice ma meno controllo, plugin ecosystem limitato
3. **esbuild**: Velocissimo ma ecosystem immaturo, no HMR stabile
4. **Rollup**: Ottimo per production ma no dev server integrato

---

## ADR-007: TypeScript Strict Mode

**Data**: 2025-01-15 (stimata)
**Status**: ✅ Accepted

### Contesto
Necessità di type safety completo per prevenire runtime errors, migliorare refactoring safety, e fornire IntelliSense ottimale in IDE.

### Decisione
Abilitare **TypeScript strict mode** in tsconfig.json con tutte le opzioni strict attive.

### Conseguenze

**Positive**:
- ✅ Catch errori a compile-time (null checks, type mismatches, etc.)
- ✅ Refactoring sicuro con rename/find references
- ✅ IntelliSense e autocomplete superiori in VS Code
- ✅ Documentazione implicita via types (no need JSDoc)
- ✅ Enforcement best practices (no implicit any, unused locals, etc.)

**Negative**:
- ❌ Curva apprendimento più ripida per TypeScript beginners
- ❌ Development leggermente più lento (type checking overhead)
- ❌ Librerie third-party senza types richiedono @types/ o custom declarations

### Alternative Considerate
1. **TypeScript loose mode**: Meno safe, type errors passano inosservati
2. **JavaScript + JSDoc**: Type checking debole, verbose, no compile-time errors
3. **Flow**: Abbandonato da Facebook, ecosystem morto
4. **JavaScript puro**: No type safety, refactoring rischioso, errori solo a runtime

---

## ADR-008: Tailwind CSS per Styling

**Data**: 2025-01-20 (stimata)
**Status**: ✅ Accepted

### Contesto
Necessità di styling system veloce da implementare, consistente, responsive, con dark mode support e bundle size ottimizzato.

### Decisione
Utilizzare **Tailwind CSS 3.4** come framework CSS utility-first.

### Conseguenze

**Positive**:
- ✅ Velocità sviluppo (utility classes → no CSS custom)
- ✅ Design system consistente (spacing, colors, typography)
- ✅ PurgeCSS automatico → bundle CSS minimo (~10 KB)
- ✅ Responsive design built-in (sm:, md:, lg:)
- ✅ Dark mode support con `class` strategy
- ✅ No naming conflicts (no BEM, no CSS Modules verbosity)

**Negative**:
- ❌ HTML verboso con molte classi utility
- ❌ Curva apprendimento per chi non conosce utility-first
- ❌ Customization richiede tailwind.config.js

### Alternative Considerate
1. **CSS Modules**: Naming conflicts, boilerplate per ogni componente
2. **Styled Components**: Runtime CSS-in-JS overhead, debugging difficile
3. **Sass/Less**: Troppo custom, manutenzione costosa, no utility-first
4. **Bootstrap**: Opinionated design, customization difficile, bundle size grande
5. **Vanilla CSS**: No design system, manutenzione impossibile per app grandi

---

## ADR-009: Context Isolation in Electron

**Data**: 2025-01-15 (stimata)
**Status**: ✅ Accepted

### Contesto
Necessità di proteggere renderer process da prototype pollution attacks e garantire security best practices Electron.

### Decisione
Abilitare **contextIsolation: true** e **nodeIntegration: false** in BrowserWindow, con preload script come unico bridge tra Main e Renderer.

### Conseguenze

**Positive**:
- ✅ Security hardening (no accesso diretto a Node.js da renderer)
- ✅ Prevenzione prototype pollution attacks
- ✅ Whitelist esplicita API esposte (contextBridge.exposeInMainWorld)
- ✅ Compliance security best practices Electron
- ✅ Audit trail chiaro di cosa renderer può fare

**Negative**:
- ❌ Complessità aggiunta (preload script necessario)
- ❌ Debugging più difficile (no access a Node.js in DevTools)
- ❌ Breaking changes se disabilitato in futuro

### Alternative Considerate
1. **nodeIntegration: true**: Security risk enorme, deprecated da Electron
2. **No context isolation**: Vulnerabile a prototype pollution
3. **Remote module**: Deprecated e rimosso in Electron 14+

---

## ADR-010: IPC con handle/invoke Pattern

**Data**: 2025-01-15 (stimata)
**Status**: ✅ Accepted

### Contesto
Necessità di comunicazione asincrona bidirezionale tra Main e Renderer process con type safety e error handling.

### Decisione
Utilizzare pattern **ipcMain.handle + ipcRenderer.invoke** per Renderer→Main calls, e **ipcRenderer.on** per Main→Renderer events.

### Conseguenze

**Positive**:
- ✅ Async/await pattern nativo (no callbacks hell)
- ✅ Error propagation automatica (errors in main → rejected Promise in renderer)
- ✅ Type safety con TypeScript interfaces
- ✅ Unidirectional data flow chiaro
- ✅ No memory leaks (auto-cleanup listeners)

**Negative**:
- ❌ Non supporta streaming (solo request/response)
- ❌ Payload serialization overhead per oggetti grandi

### Alternative Considerate
1. **ipcMain.on + ipcRenderer.send**: Fire-and-forget, no error handling, callback hell
2. **Remote module**: Deprecated e rimosso
3. **WebSockets**: Overhead network stack, overkill per IPC locale
4. **MessagePort API**: Più complesso, no vantaggi per use case semplice

---

## ADR-011: Electron Builder per Packaging

**Data**: 2025-01-20 (stimata)
**Status**: ✅ Accepted

### Contesto
Necessità di packaging applicazione Electron per Windows, macOS, Linux con installer nativi e auto-update support.

### Decisione
Utilizzare **Electron Builder** come tool per build e packaging.

### Conseguenze

**Positive**:
- ✅ Multi-platform build da singola config
- ✅ Installer nativi (NSIS per Windows, DMG per macOS, AppImage per Linux)
- ✅ Code signing support
- ✅ Auto-update integration (electron-updater)
- ✅ Compression e ottimizzazione automatica
- ✅ ASAR packaging per protezione codice

**Negative**:
- ❌ Build lento (~2-5 min per platform)
- ❌ Configurazione complessa per code signing
- ❌ Debugging packaging issues difficile

### Alternative Considerate
1. **Electron Packager**: Più semplice ma meno features (no installer, no auto-update)
2. **Electron Forge**: Simile a Builder ma meno diffuso, documentazione inferiore
3. **Manual packaging**: Complessità ingestibile, reinventare la ruota

---

## ADR-012: Zustand DevTools Integration

**Data**: 2025-01-22 (stimata)
**Status**: ✅ Accepted

### Contesto
Necessità di debugging state changes in development per capire quando/perché state cambia.

### Decisione
Integrare **Zustand DevTools middleware** nel store per logging automatico state changes.

### Conseguenze

**Positive**:
- ✅ Time-travel debugging in Redux DevTools
- ✅ Action tracing (quale action causò quale state change)
- ✅ State diff visualization
- ✅ No overhead in production (disabled automaticamente)

**Negative**:
- ❌ Performance overhead in development (minimo)
- ❌ Redux DevTools extension richiesta

### Alternative Considerate
1. **Console.log manual**: Verbose, no state diff, no time-travel
2. **React DevTools**: No state history, solo current state snapshot
3. **Custom logger middleware**: Reinventare la ruota

---

## ADR-013: Git Conventional Commits

**Data**: 2025-11-07
**Status**: ✅ Accepted

### Contesto
Necessità di standardizzare commit messages per generazione automatica changelog e semantic versioning.

### Decisione
Adottare **Conventional Commits** spec con emoji per maggiore leggibilità.

### Conseguenze

**Positive**:
- ✅ Changelog generato automaticamente
- ✅ Semantic versioning automatico
- ✅ Commit history leggibile
- ✅ CI/CD può triggerare azioni basate su commit type

**Negative**:
- ❌ Enforcement richiede pre-commit hook
- ❌ Learning curve per team

### Alternative Considerate
1. **Free-form commits**: No standard, changelog manuale
2. **Custom format**: Reinventare la ruota, no tooling

**Formato**:
```
<type>(<scope>): <emoji> <subject>

feat(automation): ✨ Add pause/resume functionality
fix(ui): 🐛 Fix log viewer scroll issue
docs(readme): 📝 Update installation guide
```

---

## ADR-014: Shadow DOM Access Strategy for Vaadin Components

**Data**: 2025-11-10
**Status**: ✅ Accepted

### Contesto
I componenti Vaadin (date-time-picker, combo-box, text-field) utilizzano Shadow DOM per incapsulamento, rendendo impossibile l'accesso diretto agli input HTML interni tramite selettori CSS standard. Necessità di compilare il campo data/ora arrivo nel form dichiarazione.

### Decisione
Implementare **strategia multi-fallback** per accedere e compilare componenti Vaadin in Shadow DOM:

1. **Strategia diretta**: Tentare setter su componente principale (`picker.value = dateTime`)
2. **Strategia Shadow DOM**: Se fallisce, navigare nel Shadow DOM per accedere a input interni
   - Trovare `date-picker` e `time-picker` con `querySelector('[slot="date-picker"]')`
   - Accedere a `shadowRoot` di ogni componente
   - Impostare valori separatamente (data e ora)
   - Dispatchare eventi (`change`, `blur`) per validazione

### Conseguenze

**Positive**:
- ✅ Funziona con diversi versioni Vaadin (fallback garantisce compatibilità)
- ✅ Codice resilient a cambiamenti DOM structure
- ✅ Logging dettagliato per debugging
- ✅ Screenshot diagnostici per ogni tentativo

**Negative**:
- ❌ Codice più complesso rispetto a selettore semplice
- ❌ Dipendenza da struttura interna Shadow DOM (può cambiare con Vaadin updates)
- ❌ Performance leggermente inferiore (multiple tentativi)

### Alternative Considerate
1. **Solo strategia diretta**: Non funziona con tutti i componenti Vaadin
2. **Solo Shadow DOM**: Più complesso e potrebbe non servire per componenti futuri
3. **CDP (Chrome DevTools Protocol)**: Troppo complesso, overkill per questo caso

---

## ADR-015: Multi-MRN Loop Architecture

**Data**: 2025-11-10
**Status**: ✅ Accepted

### Contesto
Il sistema legge tutti gli MRN dal file Excel ma processava solo il primo (indice 0). Necessità di automatizzare il processamento di **tutti** gli MRN in batch per ridurre intervento manuale.

### Decisione
Implementare **loop sequenziale** in `electron/main.ts` handler `automation:start`:

```typescript
for (let mrnIndex = 0; mrnIndex < totalMRNs; mrnIndex++) {
  const currentMRN = mrnValues[mrnIndex];

  // 1. Processa dichiarazione per currentMRN
  // 2. Invia (clickSendButton)
  // 3. SE non ultimo: reset a "Nuova dichiarazione"
}
```

**Architettura**:
- **Common setup** (1 volta): Login → Navigate Dichiarazioni → Click "Nuova dichiarazione"
- **Loop body** (N volte): NCTS → MX DHL → OK → Fill MRN → Fill Date/Time → Send
- **Reset tra MRN**: Auto-redirect + wait 2s + clickNewDeclaration()

### Conseguenze

**Positive**:
- ✅ Zero intervento manuale per batch di N MRN
- ✅ Scalabile (funziona con 1, 10, 100+ MRN)
- ✅ Progress tracking visibile ([X/Y])
- ✅ Error handling per singolo MRN (può continuare)

**Negative**:
- ❌ Processing sequenziale (non parallelo) → più lento
- ❌ Se crash a metà, perde stato (no resume da MRN N)
- ❌ Memory leak potenziale se loop molto lungo (browser restart?)

### Alternative Considerate
1. **Processing parallelo**: Troppo complesso, race conditions, server potrebbe bloccare
2. **Batch manuale** (user clicca Start per ogni MRN): Tedioso, no automation value
3. **Queue system** con resume: Overengineering per v1.0

---

## ADR-016: Progress Tracking Format [X/Y]

**Data**: 2025-11-10
**Status**: ✅ Accepted

### Contesto
Con multi-MRN processing, l'utente perde visibilità su quale MRN è in elaborazione e quanti ne restano. Necessità di feedback real-time chiaro.

### Decisione
Adottare formato **[X/Y]** per progress tracking:

- **X**: Indice MRN corrente (1-based: `mrnIndex + 1`)
- **Y**: Totale MRN da processare (`totalMRNs`)
- **Formato**: `[2/5]` → "2° MRN su 5 totali"

**Implementazione**:
```typescript
const mrnProgress = `[${mrnIndex + 1}/${totalMRNs}]`;
// Ogni messaggio IPC include prefix: "[2/5] Click su NCTS..."
```

### Conseguenze

**Positive**:
- ✅ Immediatamente comprensibile (visual familiarity con pagination)
- ✅ Poco spazio UI (5-10 caratteri)
- ✅ Facile parsing per progress bar (X/Y * 100%)
- ✅ Universale (no i18n necessario, numeri sono universali)

**Negative**:
- ❌ Non mostra ETA (estimated time remaining)
- ❌ Non mostra velocità processing (MRN/min)

### Alternative Considerate
1. **Percentage** (`"40% completato"`): Meno preciso per capire "quanti restano"
2. **Verbose** (`"Processamento MRN 2 di 5"`): Occupa più spazio
3. **Progress bar only**: No feedback testuale, meno chiaro

---

## ADR-017: Reset Mechanism Between MRN Submissions

**Data**: 2025-11-10
**Status**: ✅ Accepted

### Contesto
Dopo `clickSendButton()`, il sistema deve tornare a "Nuova dichiarazione" per processare il prossimo MRN. Il sito reindirizza automaticamente a `/cm/declarations` dopo submit, ma serve click manuale su "Nuova dichiarazione".

### Decisione
Implementare **reset automatico** con:

1. **Auto-redirect handling**: Il sistema reindirizza automaticamente (no action needed)
2. **Wait stabilization**: `await new Promise(resolve => setTimeout(resolve, 2000))` per dare tempo al redirect
3. **Click "Nuova dichiarazione"**: Riutilizzare metodo `clickNewDeclaration()` esistente
4. **Conditional**: Solo se `mrnIndex < totalMRNs - 1` (skip per ultimo MRN)

```typescript
if (mrnIndex < totalMRNs - 1) {
  await new Promise(resolve => setTimeout(resolve, 2000));
  await webAutomation.clickNewDeclaration();
}
```

### Conseguenze

**Positive**:
- ✅ Zero intervento manuale tra MRN
- ✅ Riutilizza codice esistente (`clickNewDeclaration`)
- ✅ Timeout configurabile (può aumentare se server lento)
- ✅ Skip per ultimo MRN (risparmia tempo)

**Negative**:
- ❌ Fixed timeout 2s potrebbe essere insufficiente su reti lente
- ❌ Fixed timeout potrebbe essere eccessivo su reti veloci (spreca tempo)
- ❌ Se redirect fallisce silenziosamente, loop si blocca

### Alternative Considerate
1. **Wait for URL** (`page.waitForURL('/cm/declarations')`): Più affidabile ma complesso
2. **Polling visibility** bottone "Nuova dichiarazione": Overkill, il redirect è sempre consistente
3. **Manual reset** (user clicca "Next"): Annulla automation benefit

---

## ADR-018: MRN Filtering Strategy in Table Extraction

**Date**: 2025-11-10
**Status**: ✅ Accepted
**Context**: Parte 2 Implementation

### Problema

Estrazione risultati da tabella vaadin-grid deve filtrare SOLO le righe relative all'MRN cercato, evitando di estrarre dati non correlati o righe vuote.

### Decisione

**Implementare MRN matching strategy**:

1. **Parametrizzare `extractTableResults(searchedMRN: string)`**: Passare MRN da cercare come parametro
2. **Iterare su max 10 righe** della tabella (limite ragionevole)
3. **Per ogni riga**: Leggere campo "Numero registrazione" (col2, slot baseIndex + 2)
4. **Match esatto**: `numeroRegistrazione === searchedMRN`
5. **Se match**: Estrarre tutta la riga e aggiungerla ai risultati
6. **Se no match**: Skip riga e continua

```typescript
for (let rowIndex = 0; rowIndex < 10; rowIndex++) {
  const numeroRegistrazione = getCellText(baseIndex + 2);
  if (numeroRegistrazione === mrn) {
    matchedResults.push({ ...rowData });
  }
}
```

### Conseguenze

**Positive**:
- ✅ Filtra esattamente le righe con MRN corrispondente
- ✅ Ignora righe con altri MRN o dati non correlati
- ✅ Robusto: non dipende dalla posizione delle righe
- ✅ Scalabile: funziona anche se ci sono più risultati per lo stesso MRN
- ✅ Previene errori di estrazione dati errati

**Negative**:
- ❌ Richiede parametro aggiuntivo al metodo
- ❌ Limitato a max 10 righe (sufficiente per use case)

### Alternative Considerate
1. **Contare righe reali**: Troppo fragile, celle vuote possono avere spazi
2. **Estrarre tutte le righe**: Rischio di dati non correlati nel file Excel

---

## ADR-019: Excel Writing Pattern (Opzione A - Consecutive Rows)

**Date**: 2025-11-10
**Status**: ✅ Accepted
**Context**: Parte 2 Implementation

### Problema

Con multiple righe di risultati per ogni MRN, serve definire come scrivere i dati nell'Excel:
- Sovrascrivere MRN originali?
- Mantenere MRN originali e scrivere altrove?
- Come gestire spacing?

### Decisione

**Adottare Opzione A - Consecutive Rows Pattern**:

1. **Header in riga 1**: MRN + titoli colonne estratti da tabella
2. **Dati dalla riga 2**: Iniziare a scrivere dalla prima riga dati
3. **Per ogni MRN**:
   - Per ogni risultato estratto: scrivere MRN in col A + dati in col B-I
   - Incrementare `currentExcelRow++` dopo ogni scrittura
4. **Risultato**: Righe consecutive senza gap, MRN ripetuti per ogni risultato

**Esempio**:
```
Riga 1: MRN | Gruppo utenti | CRN | ...  (HEADER)
Riga 2: 25IT...0016323 | IT.ALL | ... | ...
Riga 3: 25IT...0016323 | IT.ALL | ... | ...  (stesso MRN, risultato diverso)
Riga 4: 25IT...0016324 | IT.ALL | ... | ...
```

### Conseguenze

**Positive**:
- ✅ Formato Excel chiaro e compatto
- ✅ Facile da processare (no gap, no logica complessa)
- ✅ MRN sempre in colonna A (facile da filtrare in Excel)
- ✅ Ogni riga è autocontenuta (MRN + dati completi)
- ✅ Scalabile: funziona con qualsiasi numero di risultati

**Negative**:
- ❌ MRN originali vengono sovrascritti (ma sono già nel file input)
- ❌ Ripetizione MRN in ogni riga (ma è intenzionale per chiarezza)

### Alternative Considerate
1. **Opzione B** (Mantieni MRN originali, risultati separati): Complesso, Excel più grande
2. **Opzione C** (Colonne aggiuntive): Limitato a numero fisso di risultati per MRN

---

## ADR-020: Table Header Extraction from Vaadin Grid

**Date**: 2025-11-10
**Status**: ✅ Accepted
**Context**: Parte 2 Implementation

### Problema

Excel output ha bisogno di header colonne per dare contesto ai dati estratti. Header devono corrispondere esattamente ai titoli della tabella web.

### Decisione

**Estrarre header dinamicamente da vaadin-grid elements**:

1. **Cercare `<vaadin-grid-sorter>` elements**: Contengono i titoli cliccabili delle colonne
2. **Estrarre textContent**: Testo visibile di ogni sorter
3. **Scrivere in riga 1 Excel**: A1="MRN", B1-I1=titoli estratti
4. **Fallback se estrazione fallisce**: Usare header predefiniti hardcoded

```typescript
const sorters = document.querySelectorAll('#declarationGrid vaadin-grid-sorter');
const headers = Array.from(sorters).map(s => s.textContent?.trim() || '');
```

### Conseguenze

**Positive**:
- ✅ Header sempre sincronizzati con tabella web
- ✅ Se tabella cambia, header si aggiornano automaticamente
- ✅ Formato Excel professionale con contesto chiaro
- ✅ Fallback garantisce sempre header (anche se estrazione fallisce)
- ✅ Facile da leggere per utenti finali

**Negative**:
- ❌ Dipendenza da struttura DOM Vaadin (se cambia, può rompersi)
- ❌ Extra step nel workflow (estrazione header prima del loop)

### Alternative Considerate
1. **Header hardcoded**: Semplice ma rischio disallineamento con tabella
2. **Nessun header**: Excel poco usabile, dati senza contesto
3. **Header da Excel input**: Non garantisce match con dati estratti

---

## 📝 Decision Process

### Come Aggiungiamo Nuove Decisioni

1. **Identificare decisione importante**: Cambio architetturale, nuova tecnologia, pattern significativo
2. **Discutere alternative**: Valutare pro/cons di almeno 2-3 opzioni
3. **Documentare decisione**: Creare nuovo ADR in questo file
4. **Review team**: Far approvare decisione da almeno 1 altro developer
5. **Implementare**: Procedere con implementazione
6. **Update se necessario**: Se decisione viene superata, marcare come Superseded

### Quando Creare un ADR

✅ **SI** - Creare ADR per:
- Scelta framework/libreria principale
- Pattern architetturali (state management, IPC, etc.)
- Security decisions (context isolation, etc.)
- Breaking changes significativi

❌ **NO** - Non serve ADR per:
- Bug fixes semplici
- Refactoring minori
- Aggiornamento versioni librerie (no breaking changes)
- Styling changes cosmetici

---

## 🔄 Changelog Decisioni

### 2025-11-10 (Parte 2)
- ✅ Aggiunti ADR-018: MRN Filtering Strategy in Table Extraction
- ✅ Aggiunti ADR-019: Excel Writing Pattern (Opzione A - Consecutive Rows)
- ✅ Aggiunti ADR-020: Table Header Extraction from Vaadin Grid

### 2025-11-10 (Parte 1)
- ✅ Aggiunti ADR-014: Shadow DOM Access Strategy
- ✅ Aggiunti ADR-015: Multi-MRN Loop Architecture
- ✅ Aggiunti ADR-016: Progress Tracking Format [X/Y]
- ✅ Aggiunti ADR-017: Reset Mechanism Between MRN Submissions

### 2025-11-07
- ✅ Creato documento DECISIONS.md
- ✅ Documentati ADR-001 a ADR-013
- ✅ Definito decision process

---

**Note**: Questo documento è vivo e deve essere aggiornato ogni volta che una decisione architetturale importante viene presa.
