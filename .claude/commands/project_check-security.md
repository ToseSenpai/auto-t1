---
description: Verifica security issues Electron e dipendenze
---

Esegue security audit completo dell'applicazione Electron e dipendenze.

## Task da eseguire:

1. **Electron Security Configuration**:
   - Leggi `electron/main.ts`
   - Verifica BrowserWindow config:
     - ✅ `contextIsolation: true`
     - ✅ `nodeIntegration: false`
     - ✅ `sandbox: true` (recommended)
     - ✅ `webSecurity: true`
     - ❌ `allowRunningInsecureContent: false`
     - ❌ `experimentalFeatures: false`

2. **Preload Script Security**:
   - Leggi `electron/preload.ts`
   - Verifica:
     - ✅ Usa `contextBridge.exposeInMainWorld`
     - ✅ Non espone `ipcRenderer` direttamente
     - ✅ API whitelisted (solo funzioni necessarie)
     - ✅ Input validation su parametri
     - ❌ No `eval()`, `new Function()`

3. **IPC Handlers Security**:
   - Leggi `electron/main.ts` IPC handlers
   - Verifica:
     - ✅ Usa `ipcMain.handle` (non `ipcMain.on` per responses)
     - ✅ Input validation su tutti i parametri da renderer
     - ✅ Type checking con TypeScript
     - ✅ Error handling robusto
     - ❌ No command execution non sanitizzato
     - ❌ No path traversal vulnerabilities

4. **Content Security Policy** (CSP):
   - Verifica se CSP headers configurati
   - Recommended CSP per Electron:
     ```
     default-src 'self';
     script-src 'self';
     style-src 'self' 'unsafe-inline';
     img-src 'self' data:;
     ```

5. **NPM Audit**:
   - Esegui: `npm audit`
   - Mostra vulnerabilities trovate
   - Se critical/high: suggerisci fix
   - Esegui: `npm audit fix` (se applicabile)

6. **Dependency Check**:
   - Verifica dipendenze obsolete: `npm outdated`
   - Identifica dipendenze con known vulnerabilities
   - Suggerisci update per security patches

7. **Code Scan**:
   - Cerca pattern insicuri nel codice:
     - `eval()`
     - `new Function()`
     - `child_process.exec()` con input non sanitizzato
     - `fs.writeFile()` con path non validato
     - Hardcoded credentials
     - API keys nel codice

8. **File System Access**:
   - Verifica path handling:
     - ✅ Usa `path.join()` invece di string concatenation
     - ✅ Whitelist directory permesse
     - ✅ Validation path traversal (no `../..`)
     - ✅ Check permessi file prima read/write

9. **Network Security**:
   - Verifica configurazione Playwright:
     - ✅ Browser lanciato con sandbox
     - ✅ No `--disable-web-security` flag
     - ✅ Timeout appropriati (previene hang)

10. **Genera Security Report**:
    ```markdown
    # Security Audit Report - [DATE]

    ## Overall Status: ✅ Secure | 🟡 Warnings | 🔴 Critical Issues

    ## Electron Configuration
    - Context Isolation: ✅ Enabled
    - Node Integration: ✅ Disabled
    - Sandbox: ✅ Enabled
    - Web Security: ✅ Enabled

    ## Preload Script
    - contextBridge: ✅ Used correctly
    - API Exposure: ✅ Whitelisted only
    - Input Validation: ✅ Present

    ## IPC Security
    - Handle pattern: ✅ Used
    - Input validation: ✅ Implemented
    - Error handling: ✅ Robust

    ## NPM Audit
    - Critical: X
    - High: Y
    - Moderate: Z
    - Low: W

    ## Vulnerabilities Found
    [List any security issues]

    ## Recommendations
    1. [Action item 1]
    2. [Action item 2]

    ## Next Steps
    - Fix critical issues immediately
    - Update vulnerable dependencies
    - Consider: [additional security measures]
    ```

**Security Checklist Summary**:
- [ ] Context isolation enabled
- [ ] Node integration disabled
- [ ] Preload uses contextBridge
- [ ] IPC handlers validate input
- [ ] No eval() or new Function()
- [ ] No hardcoded credentials
- [ ] NPM audit clean
- [ ] Path traversal protected
- [ ] CSP headers configured
- [ ] Browser security flags correct

**IMPORTANTE**:
- Critical issues blocca release
- High issues deve essere addressato prima produzione
- Moderate/Low issues tracciati per futuro fix
- Re-run audit regolarmente (pre-release)
