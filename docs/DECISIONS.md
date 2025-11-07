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

### 2025-11-07
- ✅ Creato documento DECISIONS.md
- ✅ Documentati ADR-001 a ADR-013
- ✅ Definito decision process

---

**Note**: Questo documento è vivo e deve essere aggiornato ogni volta che una decisione architetturale importante viene presa.
