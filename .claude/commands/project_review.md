---
description: Code review automatico modifiche recenti
---

Esegui code review automatico delle modifiche recenti con focus su best practices specifiche per questo progetto.

## Task da eseguire:

1. **Analizza modifiche**:
   - `git diff --cached` (staged changes)
   - `git diff` (unstaged changes)
   - Se nessuna modifica locale: `git diff HEAD~1` (ultimo commit)

2. **Review TypeScript Strict Compliance**:
   - ✅ No `any` types (usa `unknown` o type specifico)
   - ✅ No `@ts-ignore` o `@ts-nocheck`
   - ✅ Tutte le funzioni hanno return type esplicito
   - ✅ Interfacce definite per oggetti complessi
   - ✅ Null checks appropriati (optional chaining, nullish coalescing)
   - ✅ No unused variables o imports

3. **Review React Best Practices**:
   - ✅ Componenti functional (no class components)
   - ✅ Props con interfacce TypeScript
   - ✅ Hooks usati correttamente (dependency arrays, cleanup)
   - ✅ React.memo dove appropriato (componenti pesanti)
   - ✅ Key props in liste
   - ✅ Event handlers con proper typing

4. **Review Electron Security**:
   - ✅ `contextIsolation: true` (se modificato BrowserWindow config)
   - ✅ `nodeIntegration: false` (mai abilitare)
   - ✅ Preload script usa `contextBridge.exposeInMainWorld`
   - ✅ IPC handlers validano input da renderer
   - ✅ No `eval()` o `new Function()`
   - ✅ No exec di comandi shell non sanitizzati

5. **Review Playwright Best Practices**:
   - ✅ Selettori robusti (preferire data-testid, role, text)
   - ✅ Auto-wait usato (no sleep/setTimeout manuali)
   - ✅ Try/catch attorno operazioni browser
   - ✅ Screenshot su errori
   - ✅ Browser/context cleanup in finally block
   - ✅ Timeout configurabili (no hardcoded)

6. **Review Code Quality**:
   - ✅ Nomi variabili descrittivi (no `temp`, `data`, `x`)
   - ✅ Funzioni < 50 righe (singola responsabilità)
   - ✅ Commenti solo per logica complessa (codice self-documenting)
   - ✅ Error handling robusto (try/catch, logging)
   - ✅ No codice duplicato (DRY principle)
   - ✅ Import organizzati (third-party, local, types)

7. **Review Performance**:
   - ✅ No re-renders inutili React (memo, useMemo, useCallback)
   - ✅ Zustand selectors granulari
   - ✅ No operazioni sincrone bloccanti in main process
   - ✅ Async/await per operazioni I/O
   - ✅ No memory leaks (event listeners cleanup)

8. **Genera report**:
   - Lista issues trovati per categoria
   - Severity: 🔴 Critical | 🟡 Warning | 🟢 Suggestion
   - Per ogni issue: location (file:line), description, suggested fix
   - Overall rating: Excellent | Good | Needs Work | Problematic

**Output Format**:
```markdown
# Code Review Report

## Summary
- Files reviewed: X
- Issues found: Y (Z critical, W warnings, V suggestions)
- Overall rating: [RATING]

## 🔴 Critical Issues
1. [file:line] - Description
   Fix: Suggested fix

## 🟡 Warnings
1. [file:line] - Description
   Fix: Suggested fix

## 🟢 Suggestions
1. [file:line] - Description
   Fix: Suggested fix

## ✅ Good Practices Observed
- List of good things found
```

**IMPORTANTE**:
- Focus su issues reali, non nitpicking
- Suggerimenti devono essere actionable
- Se zero issues: congratulazioni + reminder best practices
- Se critical issues: blocca commit fino a fix
