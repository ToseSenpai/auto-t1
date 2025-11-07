---
description: Inizia nuova sessione di sviluppo con tracking
---

Inizia una nuova sessione di sviluppo strutturata. Accetta un parametro opzionale per il nome della sessione.

**Uso**: `/project:session-start [nome-sessione]`

**Esempio**: `/project:session-start feature-pause-resume`

## Task da eseguire:

1. **Genera nome sessione** (se non fornito):
   - Chiedi all'utente cosa sta per fare
   - Genera nome descrittivo (kebab-case)
   - Esempio: `feature-retry-logic`, `bugfix-log-viewer`, `refactor-ipc-handlers`

2. **Crea file sessione**:
   - Path: `.claude/sessions/[nome]-[YYYY-MM-DD].md`
   - Usa template da `.claude/sessions/TEMPLATE.md`
   - Sostituisci placeholder con:
     - Nome sessione
     - Data corrente (formato: 07 Novembre 2025)
     - Timestamp inizio

3. **Popola sezione obiettivi**:
   - Chiedi all'utente gli obiettivi specifici della sessione
   - Crea checklist con [ ] per tracking
   - Minimo 2-3 obiettivi, massimo 5-6
   - Obiettivi devono essere SMART (Specific, Measurable, Achievable)

4. **Registra contesto iniziale**:
   - Branch git corrente (`git branch --show-current`)
   - Ultimo commit (`git log -1 --oneline`)
   - File modificati correntemente (`git status --short`)
   - Eventuali note aggiuntive dall'utente

5. **Aggiorna CURRENT_STATUS.md**:
   - Sezione "Features in Progress"
   - Aggiungi entry con obiettivo principale sessione
   - Link al file sessione

6. **Conferma all'utente**:
   - Path file sessione creato
   - Obiettivi registrati
   - Prompt per iniziare sviluppo

## Template Sessione (se TEMPLATE.md non esiste):

```markdown
# Sessione: [NOME] - [DATA]

**Iniziata**: [TIMESTAMP]
**Branch**: [BRANCH_NAME]
**Ultimo commit**: [COMMIT_HASH]

## 🎯 Obiettivi

- [ ] Obiettivo 1
- [ ] Obiettivo 2
- [ ] Obiettivo 3

## 📝 Progresso

### [TIMESTAMP] - Iniziato
Sessione di sviluppo iniziata. Obiettivi definiti.

## 🔍 Decisioni

_Decisioni architetturali o tecniche importanti prese durante questa sessione_

## 🐛 Issues Riscontrati

_Problemi incontrati e come sono stati risolti_

## ✅ Completato

_Task completati durante la sessione_

## 🔜 Next Steps

_Prossimi passi dopo questa sessione_
```

**IMPORTANTE**:
- File sessione va in `.claude/sessions/` (NON committare in git)
- Usa formato markdown per buona leggibilità
- Timestamp sempre in formato ISO 8601 o leggibile
- Chiedi conferma obiettivi prima di procedere
