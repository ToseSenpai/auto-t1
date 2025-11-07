---
description: Aggiorna automaticamente documentazione progetto
---

Aggiorna la documentazione del progetto basandoti sulle modifiche recenti:

1. **Analizza modifiche recenti**:
   - Esegui `git log --oneline -10` per vedere ultimi commit
   - Esegui `git diff HEAD~5..HEAD` per vedere modifiche ultime 5 commit
   - Identifica aree modificate (features, bug fix, refactoring)

2. **Aggiorna docs/CURRENT_STATUS.md**:
   - Sezione "Features Completate": Aggiungi nuove features implementate
   - Sezione "Features in Progress": Aggiorna progresso task correnti
   - Sezione "Known Issues": Rimuovi issues fixati, aggiungi nuovi se presenti
   - Sezione "Next Steps": Aggiorna priorità basate su lavoro corrente
   - Sezione "Changelog Recenti": Aggiungi entry con data corrente

3. **Verifica README.md** (aggiorna solo se necessario):
   - Controlla se nuove features richiedono aggiornamento sezioni
   - Verifica comandi in "Getting Started" ancora validi
   - Aggiungi esempi per nuove features significative
   - NON riscrivere tutto, solo parti modificate

4. **Aggiorna CHANGELOG.md** (se esiste, altrimenti crea):
   - Segui formato Keep a Changelog
   - Aggiungi sezione [Unreleased] con modifiche recenti
   - Categorizza: Added, Changed, Deprecated, Removed, Fixed, Security

5. **Verifica consistency**:
   - Versioni consistenti in package.json, README, CURRENT_STATUS
   - Link interni funzionanti
   - Esempi codice aggiornati se API cambiate

**Formato CHANGELOG.md**:
```markdown
# Changelog

## [Unreleased]

### Added
- Nuova feature X con supporto Y

### Changed
- Migliorato performance Z del 50%

### Fixed
- Bug fix per issue #123
```

**IMPORTANTE**:
- Mantieni stile consistente con docs esistenti
- Usa italiano per tutti i documenti
- Non duplicare informazioni tra file
- Concentrati su modifiche recenti, non riscrivere tutto
