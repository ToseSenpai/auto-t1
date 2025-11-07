---
description: Chiude sessione di sviluppo attiva con summary
---

Chiude la sessione di sviluppo corrente con summary completo.

**Uso**: `/project:session-end`

## Task da eseguire:

1. **Trova sessione attiva**:
   - Cerca in `.claude/sessions/` file con data corrente
   - Se nessuna sessione attiva, informa l'utente

2. **Genera summary completamento**:
   - Conta obiettivi completati vs totali
   - Elenca decisioni importanti prese
   - Riassumi issues riscontrati e risolti
   - Calcola durata sessione (inizio → fine)

3. **Aggiorna file sessione**:
   - Aggiungi sezione finale "## 📊 Summary"
   - Include:
     - Obiettivi completati: X/Y
     - Durata sessione: Xh Ym
     - Risultati principali (bullet list)
     - Issues risolti vs aperti
   - Aggiungi timestamp fine

4. **Identifica next steps**:
   - Chiedi all'utente next steps
   - Aggiungi in sezione "Next Steps"
   - Questi diventeranno obiettivi sessione futura

5. **Aggiorna docs/CURRENT_STATUS.md**:
   - Sposta da "Features in Progress" a "Completate" (se applicabile)
   - Aggiorna "Next Steps Immediate"
   - Aggiungi entry in "Changelog Recenti"

6. **Suggerisci azioni post-sessione**:
   - Se modifiche codice: suggerisci `/project:review`
   - Se tutto OK: suggerisci `/project:test-and-commit`
   - Se decisioni importanti: suggerisci aggiornare docs/DECISIONS.md

7. **Archivia sessione**:
   - Conferma chiusura sessione
   - File rimane in `.claude/sessions/` per storico

**Template Summary**:
```markdown
## 📊 Summary

**Completata**: [TIMESTAMP]
**Durata**: Xh Ym

### Risultati
- ✅ Obiettivo 1 completato
- ✅ Obiettivo 2 completato
- ⏳ Obiettivo 3 in progress

### Metriche
- Obiettivi completati: X/Y (Z%)
- Issues risolti: X
- Decisioni documentate: Y
- Commit creati: Z

### Prossimi Passi
1. Next step 1
2. Next step 2
```

**IMPORTANTE**:
- Summary deve essere conciso ma completo
- Evidenzia blockers non risolti
- Link a commit se presenti
- Next steps devono essere actionable
