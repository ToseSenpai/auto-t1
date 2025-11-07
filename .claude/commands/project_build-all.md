---
description: Build completo tutti entry points Electron con report
---

Esegue build completo dell'applicazione Electron con tutti gli entry points e genera report dettagliato.

## Task da eseguire:

1. **Pre-build Cleanup**:
   - Esegui: `npm run clean`
   - Rimuove dist/, dist-electron/, out/
   - Conferma cleanup completato

2. **TypeScript Compilation**:
   - Esegui: `npm run compile`
   - Output: dist-electron/ (main.js, preload.js)
   - Mostra eventuali errori/warnings
   - Se errori: STOP

3. **Vite Build (Renderer)**:
   - Esegui: `npm run dev -- build` o parte di `npm run build`
   - Output: dist/ (renderer bundle)
   - Report bundle size
   - Verifica code splitting applicato

4. **Electron Builder Package**:
   - Esegui build finale: `npm run build`
   - Genera installer per piattaforma corrente
   - Output: out/ (installer .exe, .dmg, .AppImage)
   - Tempo stimato: 2-5 minuti

5. **Analisi Bundle Size**:
   - Renderer bundle: dist/assets/*.js
   - Main process: dist-electron/main.js
   - Preload script: dist-electron/preload.js
   - Totale applicazione packaged

6. **Verifica Output**:
   - Controlla file generati esistono:
     - `dist/index.html`
     - `dist/assets/*.js`
     - `dist/assets/*.css`
     - `dist-electron/main.js`
     - `dist-electron/preload.js`
     - `out/[app-name]-[version]-[platform].[ext]`

7. **Genera Build Report**:
   ```markdown
   # Build Report - [DATE] [TIME]

   ## Status: ✅ Success | ❌ Failed

   ## Build Times
   - TypeScript: Xs
   - Vite (Renderer): Xs
   - Electron Builder: Xs
   - Total: Xs

   ## Bundle Sizes
   - Renderer (dist/): X MB
   - Main (dist-electron/): X KB
   - Preload (dist-electron/): X KB
   - Packaged App (out/): X MB

   ## Output Files
   - Installer: out/[filename]
   - Platform: Windows | macOS | Linux

   ## Warnings
   - [List any warnings]

   ## Next Steps
   - Test installer: run out/[filename]
   - Verify app launches correctly
   - Test core functionality
   ```

8. **Suggerimenti Post-Build**:
   - Test installer manualmente
   - Verifica dimensioni bundle accettabili (<80 MB)
   - Se warnings: valuta se fixare
   - Se tutto OK: ready per release

**IMPORTANTE**:
- Build richiede tempo (2-5 min), informa utente
- Mostra progress durante build
- Se build fallisce: mostra error completo + suggested fix
- Report bundle size per monitorare crescita nel tempo
