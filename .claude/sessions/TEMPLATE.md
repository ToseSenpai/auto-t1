# Sessione: [NOME_SESSIONE] - [DATA]

**Iniziata**: [TIMESTAMP_INIZIO]
**Branch**: [NOME_BRANCH]
**Ultimo commit**: [COMMIT_HASH]

---

## 🎯 Obiettivi

- [ ] Obiettivo 1
- [ ] Obiettivo 2
- [ ] Obiettivo 3

---

## 📝 Progresso

### [HH:MM] - Iniziato
Sessione di sviluppo iniziata. Obiettivi definiti.

---

## 🔍 Decisioni

_Decisioni architetturali o tecniche importanti prese durante questa sessione_

**Esempio**:
- **Decisione**: Usare Zustand invece di Context API per state management
- **Rationale**: Performance migliori, meno boilerplate, DevTools integration
- **Conseguenze**: Dipendenza aggiuntiva, ma benefici in sviluppo e debugging

---

## 🐛 Issues Riscontrati

_Problemi incontrati durante lo sviluppo e come sono stati risolti_

**Esempio**:
- **Issue**: TypeScript errore su type mismatch in IPC handler
- **Root Cause**: Interfaccia non aggiornata dopo modifica signature
- **Fix**: Aggiornato interface ElectronAPI in preload.ts
- **Status**: ✅ Risolto

---

## 💡 Apprendimenti

_Cose nuove imparate o best practices scoperte_

**Esempio**:
- Playwright auto-wait elimina necessità di sleep manuali
- React.memo previene re-renders inutili ma va usato con moderazione
- Electron preload script richiede rebuild completo app dopo modifiche

---

## ✅ Completato

_Task completati durante la sessione con timestamp_

**Esempio**:
- [14:30] Implementato retry logic con exponential backoff
- [15:15] Aggiunto unit test per ExcelHandler
- [16:00] Aggiornato documentazione in CURRENT_STATUS.md

---

## 🔜 Next Steps

_Prossimi passi per continuare il lavoro (diventeranno obiettivi prossima sessione)_

1. Next step 1
2. Next step 2
3. Next step 3

---

## 📊 Summary

_Questa sezione viene aggiunta automaticamente da `/project:session-end`_

**Completata**: [TIMESTAMP_FINE]
**Durata**: Xh Ym

### Risultati
- ✅ Obiettivo 1 completato
- ✅ Obiettivo 2 completato
- ⏳ Obiettivo 3 parzialmente completato

### Metriche
- Obiettivi completati: X/Y (Z%)
- Issues risolti: X
- Decisioni documentate: Y
- Commit creati: Z
- File modificati: W

### Prossimi Passi
1. [Next step identificato]
2. [Next step identificato]

---

## 📎 Link & Riferimenti

_Link utili, PR, issues GitHub, documentazione consultata_

- [Link 1](url)
- [Link 2](url)

---

**Note**:
- Questo template viene usato da `/project:session-start`
- Modificare template per personalizzare struttura sessioni
- Placeholder [CAPS] vengono sostituiti automaticamente
