# Auto-T1 - Quick Reference

Guida rapida ai comandi più utilizzati per lavorare con Auto-T1 e Claude Code.

---

## 🚀 NPM Scripts Essenziali

### Development
```bash
npm run electron:dev    # Avvia Electron + Vite dev server (HOT RELOAD)
npm run dev             # Solo Vite dev server (per sviluppo renderer)
npm run watch           # TypeScript compiler in watch mode
```

### Build & Production
```bash
npm run build           # Build completo: tsc → Vite → Electron Builder
npm run electron:build  # Build Electron (senza TypeScript compilation)
npm run compile         # Solo TypeScript compilation (tsc)
```

### Code Quality
```bash
npm run lint            # ESLint check (src/**/*.{ts,tsx})
npm run format          # Prettier format (src/**/*.{ts,tsx})
npm run clean           # Rimuove dist/, dist-electron/, out/
```

### Quick Combos
```bash
# Pre-commit check completo
npm run lint && npm run format && npm run compile

# Full rebuild
npm run clean && npm run build
```

---

## 🎯 Slash Commands Claude Code

### Comandi Progetto (`/project:*`)

#### `/project:commit`
Crea commit con conventional commits + emoji
- Esegue git status e git diff
- Genera commit message intelligente
- Aggiunge co-author Claude
- Esegue commit

**Esempio**: `/project:commit`

---

#### `/project:update-docs`
Aggiorna automaticamente documentazione
- README.md (se necessario)
- docs/CURRENT_STATUS.md
- CHANGELOG.md
- Basato su modifiche recenti

**Esempio**: `/project:update-docs`

---

#### `/project:session-start [nome]`
Inizia nuova sessione di sviluppo
- Crea file in .claude/sessions/[nome]-[data].md
- Template strutturato con obiettivi
- Tracking automatico timestamp
- Aggiorna CURRENT_STATUS.md

**Esempio**: `/project:session-start feature-pause-resume`

---

#### `/project:session-update [note]`
Aggiorna sessione corrente con progresso
- Aggiunge timestamp + note
- Traccia decisioni prese
- Log issues riscontrati
- Update checklist obiettivi

**Esempio**: `/project:session-update "Implementato retry logic con backoff esponenziale"`

---

#### `/project:session-end`
Chiude sessione attiva
- Summary completato vs obiettivi
- Next steps identificati
- Aggiorna docs/CURRENT_STATUS.md
- Archivia sessione

**Esempio**: `/project:session-end`

---

#### `/project:review`
Code review automatico modifiche recenti
- Analizza git diff
- Controlla TypeScript strict compliance
- Verifica React best practices
- Controlla Electron security (context isolation)
- Suggerisce miglioramenti

**Esempio**: `/project:review`

---

#### `/project:test-and-commit`
Pipeline completo test → commit → docs
1. ESLint check
2. Prettier format
3. TypeScript compile
4. Build Electron (verifica no errors)
5. Se tutto OK: commit + update docs

**Esempio**: `/project:test-and-commit`

---

#### `/project:build-all`
Build completo tutti entry points Electron
- Build renderer (Vite)
- Build main process
- Build preload script
- Package con Electron Builder
- Report dimensioni bundle

**Esempio**: `/project:build-all`

---

#### `/project:check-security`
Verifica security issues Electron
- Context isolation abilitato
- nodeIntegration disabilitato
- Preload script secure (contextBridge)
- IPC handlers validazione input
- npm audit vulnerabilities

**Esempio**: `/project:check-security`

---

## 🔧 Claude Code Built-in Commands

### Gestione Conversazione
```bash
/help          # Mostra help Claude Code
/clear         # Pulisce conversazione corrente
/compact       # Compatta conversazione (riduci token usage)
/reset         # Reset completo stato Claude
```

### Memory & Context
```bash
/memory        # Gestione memory Claude (salva/recupera contesto)
/forget        # Dimentica contesto specifico
```

### File & Codebase
```bash
/read [path]   # Leggi file (alternativa a chiedere "leggi X")
/edit [path]   # Modifica file
/search [query] # Cerca nel codebase
```

---

## 📂 Struttura File Importanti

### Core Electron
```
electron/main.ts         # Main process (IPC handlers, window management)
electron/preload.ts      # Preload script (contextBridge)
```

### Core React
```
src/renderer/App.tsx              # App principale
src/renderer/store/useStore.ts    # Zustand state management
src/renderer/components/          # Componenti UI
```

### Core Automation
```
src/web-automation.ts    # Playwright automation wrapper
src/excel-handler.ts     # ExcelJS wrapper
src/config.ts            # Config centralizzato
```

### Documentation
```
CLAUDE.md                       # Claude Code guide (LEGGI SEMPRE!)
docs/PROJECT_CONTEXT.md         # Architettura sistema
docs/CURRENT_STATUS.md          # Stato implementazione
docs/ACTIVE_ROADMAP.md          # Roadmap features
docs/DECISIONS.md               # ADR log
docs/QUICK_REFERENCE.md         # Questo file
```

---

## 🐛 Troubleshooting Comuni

### Problema: Electron non si avvia
```bash
# Soluzione 1: Rebuild dipendenze
rm -rf node_modules && npm install

# Soluzione 2: Clear cache
npm run clean && npm run build
```

### Problema: Hot reload non funziona
```bash
# Verifica Vite dev server running
# Dovrebbe essere su http://localhost:5173

# Restart completo
Ctrl+C (kill electron:dev)
npm run electron:dev
```

### Problema: TypeScript errors
```bash
# Check errors
npm run compile

# Fix formatting
npm run format

# Fix linting
npm run lint --fix
```

### Problema: Build fallisce
```bash
# Clean everything
npm run clean

# Full rebuild
npm install
npm run build
```

### Problema: Playwright browser non si apre
```bash
# Reinstall Playwright browsers
npx playwright install chromium

# Check config headless mode
# src/config.ts → BROWSER_CONFIG.headless
```

### Problema: Excel file non leggibile
```bash
# Verifica path file
# Default: data/input.xlsx

# Check formato file
# Deve essere .xlsx (non .xls o .csv)

# Check permessi file
# Assicurati file non è aperto in Excel
```

### Problema: IPC non funziona
```bash
# Verifica preload script caricato
# electron/main.ts → webPreferences.preload

# Check contextBridge exposure
# electron/preload.ts → exposeInMainWorld

# Controlla DevTools console per errori
```

### Problema: Date-Time Picker non si compila
```bash
# Verifica Shadow DOM access
# Controlla logs per errore "date-time-picker non trovato"

# Screenshot diagnostico in logs/
# Cerca: arrival_datetime_error_*.png

# Verifica selettore in src/config.ts
# O aumenta timeout in src/web-automation.ts:fillArrivalDateTime()

# Fallback: verifica struttura DOM manuale
# DevTools → Inspect element → guarda Shadow DOM
```

### Problema: Multi-MRN loop si blocca
```bash
# Verifica numero MRN in Excel
# Prima colonna deve avere header "MRN" in A1

# Check logs per quale MRN fallisce
# Cerca "[X/Y]" nei log per ultimo MRN processato

# Verifica timeout reset (2s default)
# Se rete lenta, aumenta timeout in electron/main.ts:378

# Screenshot per ogni step in logs/
# Cerca pattern: send_button_clicked, mrn_field_filled, etc.
```

### Problema: Progress tracking non visibile
```bash
# Verifica IPC communication
# Check console per messaggi automation:status

# Restart Electron app
# npm run electron:dev

# Controlla LogViewer component
# src/renderer/components/LogViewer.tsx
```

---

## ⚡ Performance Tips

### Development
- Usa `npm run electron:dev` per hot reload
- Tieni DevTools chiuso se non necessario (risparmia RAM)
- Limita log entries (performance UI con >1000 log)

### Build
- `npm run build` compila tutto (lento ~2-5 min)
- `npm run compile` solo TypeScript (veloce ~30s)
- `npm run electron:build` skip TypeScript (medio ~1-2 min)

### Debugging
- Renderer: DevTools Electron (Ctrl+Shift+I)
- Main process: `console.log` + check terminal
- IPC: Log in preload.ts per tracciare messaggi

---

## 🔐 Security Checklist

Prima di commit/deploy, verifica:
- [ ] Context isolation = true
- [ ] nodeIntegration = false
- [ ] No credenziali hardcoded
- [ ] Preload script usa contextBridge
- [ ] IPC handlers validano input
- [ ] npm audit clean (no vulnerabilities)
- [ ] No file sensibili in git (data/*.xlsx, logs/)

---

## 📝 Workflow Consigliato

### Feature Development
```bash
1. /project:session-start feature-nome
2. Sviluppa feature...
3. npm run lint && npm run format
4. /project:review
5. Fix issues se presenti
6. /project:test-and-commit
7. /project:session-end
```

### Bug Fix
```bash
1. npm run electron:dev
2. Riproduci bug
3. Fix + test in dev mode
4. npm run compile (check TypeScript)
5. /project:commit
6. /project:update-docs (se necessario)
```

### Release
```bash
1. /project:check-security
2. npm run build
3. Test manuale build produzione
4. Update version in package.json
5. /project:update-docs
6. /project:commit (type: release)
7. git tag vX.Y.Z
8. git push origin main --tags
```

---

## 🎓 Learning Resources

### Electron
- [Electron Security Guide](https://www.electronjs.org/docs/latest/tutorial/security)
- [IPC Communication](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [Context Isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation)

### React
- [React Hooks](https://react.dev/reference/react)
- [React Performance](https://react.dev/learn/render-and-commit)

### Playwright
- [Auto-waiting](https://playwright.dev/docs/actionability)
- [Selectors Guide](https://playwright.dev/docs/selectors)

### TypeScript
- [Strict Mode](https://www.typescriptlang.org/tsconfig#strict)
- [Type Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)

---

## 🆘 Help

### Documentazione Locale
```bash
# README principale
cat README.md

# README Electron
cat README-ELECTRON.md

# Claude guide
cat CLAUDE.md
```

### Claude Code Help
```bash
/help                    # Help generale
/help slash-commands     # Lista slash commands
/help memory             # Help memory management
```

### GitHub Issues
Per bug reports o feature requests: [GitHub Issues](https://github.com/[username]/auto-t1/issues)

---

**Ultimo aggiornamento**: 2025-11-07
**Versione**: 1.0.0
