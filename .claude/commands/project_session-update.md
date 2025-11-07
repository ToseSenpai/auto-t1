---
description: Aggiorna sessione corrente con progresso
---

Aggiorna la sessione di sviluppo corrente con note e progresso.

**Uso**: `/project:session-update [note]`

**Esempio**: `/project:session-update "Implementato retry logic, ora testo con file Excel"`

## Task da eseguire:

1. **Trova sessione attiva**:
   - Cerca in `.claude/sessions/` file con data corrente
   - Se multiple sessioni oggi, usa la più recente
   - Se nessuna sessione attiva, suggerisci `/project:session-start`

2. **Aggiungi timestamp + note**:
   - Sezione "Progresso"
   - Formato: `### [HH:MM] - [note]`
   - Aggiungi note fornite dall'utente o chiedi dettagli

3. **Aggiorna checklist obiettivi** (se applicabile):
   - Controlla se obiettivi completati
   - Marca [x] obiettivi completati
   - Chiedi conferma prima di marcare

4. **Registra decisioni** (se presenti):
   - Chiedi se ci sono decisioni importanti da documentare
   - Aggiungi in sezione "Decisioni"
   - Formato: `- **[Decisione]**: Rationale`

5. **Traccia issues** (se presenti):
   - Chiedi se ci sono problemi incontrati
   - Aggiungi in sezione "Issues Riscontrati"
   - Include come sono stati risolti (o WIP)

6. **Salva file sessione**:
   - Aggiorna file con nuove informazioni
   - Conferma update all'utente

**IMPORTANTE**:
- Timestamp sempre in formato 24h (es. 14:30)
- Note concise ma descrittive
- Focus su cosa è stato fatto, non come
- Decisioni importanti vanno anche in docs/DECISIONS.md
