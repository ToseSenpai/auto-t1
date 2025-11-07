---
description: Pipeline completo: lint → format → build → test → commit → docs
---

Esegue pipeline completo di quality checks, build, e commit automatico.

## Task da eseguire:

1. **Pre-flight Checks**:
   - Verifica modifiche presenti: `git status --short`
   - Se nessuna modifica: informa utente e termina
   - Conferma con utente prima di procedere

2. **ESLint Check**:
   - Esegui: `npm run lint`
   - Se errors: mostra e termina (utente deve fixare manualmente)
   - Se warnings only: chiedi conferma per procedere

3. **Prettier Format**:
   - Esegui: `npm run format`
   - Conferma file formattati
   - Se modifiche da formatting: stage automaticamente

4. **TypeScript Compilation**:
   - Esegui: `npm run compile`
   - Se errors: mostra e termina
   - Se success: continua

5. **Build Electron** (opzionale, se richiesto):
   - Chiedi se eseguire full build
   - Se sì: `npm run build`
   - Se errors: mostra e termina
   - Nota: Build può richiedere 2-5 min

6. **Test Suite** (se esiste):
   - Esegui: `npm test` (se script esiste)
   - Se fail: mostra e termina
   - Se success o no test: continua

7. **Code Review Automatico**:
   - Esegui `/project:review` internamente
   - Se critical issues: mostra e termina
   - Se warnings/suggestions: mostra ma continua

8. **Git Commit**:
   - Esegui `/project:commit` internamente
   - Usa conventional commits
   - Include Co-Authored-By Claude

9. **Update Documentation**:
   - Esegui `/project:update-docs` internamente
   - Aggiorna CURRENT_STATUS.md
   - Aggiorna CHANGELOG se necessario

10. **Final Report**:
    - Summary operazioni eseguite
    - Commit hash creato
    - File documentazione aggiornati
    - Next steps suggeriti

**Pipeline Flow**:
```
┌─────────────┐
│ Git Status  │ → Se nessuna modifica: STOP
└─────┬───────┘
      ↓
┌─────────────┐
│ ESLint      │ → Se errors: STOP
└─────┬───────┘
      ↓
┌─────────────┐
│ Prettier    │ → Auto-format
└─────┬───────┘
      ↓
┌─────────────┐
│ TypeScript  │ → Se errors: STOP
└─────┬───────┘
      ↓
┌─────────────┐
│ Build       │ → Opzionale, se errors: STOP
└─────┬───────┘
      ↓
┌─────────────┐
│ Tests       │ → Se fail: STOP
└─────┬───────┘
      ↓
┌─────────────┐
│ Code Review │ → Se critical: STOP
└─────┬───────┘
      ↓
┌─────────────┐
│ Git Commit  │ → Conventional commits
└─────┬───────┘
      ↓
┌─────────────┐
│ Update Docs │ → CURRENT_STATUS, CHANGELOG
└─────┬───────┘
      ↓
┌─────────────┐
│   Success   │ ✅
└─────────────┘
```

**IMPORTANTE**:
- Pipeline si ferma al primo errore
- Ogni step mostra output chiaro
- Conferma utente prima di commit
- Non pushare automaticamente (solo commit locale)
- Se qualsiasi step fallisce: mostra come fixare
