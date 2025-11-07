---
description: Crea commit con conventional commits + emoji
---

Esegui un commit intelligente seguendo queste linee guida:

1. **Analizza modifiche**:
   - Esegui `git status` per vedere file modificati
   - Esegui `git diff` per vedere le modifiche effettive
   - Esegui `git log --oneline -5` per vedere stile commit recenti

2. **Genera commit message**:
   - Usa conventional commits format: `<type>(<scope>): <emoji> <description>`
   - Types validi: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`
   - Emoji appropriati:
     - ✨ feat: Nuova feature
     - 🐛 fix: Bug fix
     - 📝 docs: Documentazione
     - 💄 style: Styling/formatting
     - ♻️ refactor: Refactoring
     - ⚡ perf: Performance
     - ✅ test: Tests
     - 🔧 chore: Manutenzione
     - 👷 ci: CI/CD
   - Scope: `automation`, `ui`, `electron`, `config`, `build`, ecc.
   - Description: Concisa (max 72 caratteri), focalizzata sul "cosa" e "perché"

3. **Aggiungi dettagli**:
   - Body del commit (se necessario) con dettagli implementazione
   - Footer sempre con:
     ```
     🤖 Generated with [Claude Code](https://claude.com/claude-code)

     Co-Authored-By: Claude <noreply@anthropic.com>
     ```

4. **Esegui commit**:
   - Stage tutti i file rilevanti con `git add`
   - Esegui commit con messaggio generato
   - Conferma successo con `git status`

**Esempio commit message**:
```
feat(automation): ✨ Aggiungi retry logic con backoff esponenziale

Implementato retry automatico per network failures con:
- Max 3 tentativi
- Backoff esponenziale (1s, 2s, 4s)
- Logging dettagliato errori

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**IMPORTANTE**:
- NON committare file sensibili (data/*.xlsx, logs/*.png, .env)
- NON committare node_modules, dist, build artifacts
- Verifica che lint e format siano stati eseguiti prima
