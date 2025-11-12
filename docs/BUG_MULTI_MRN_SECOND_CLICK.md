# 🐛 BUG: Click su NCTS fallisce al secondo MRN

**Data**: 2025-11-12
**Status**: 🔴 NON RISOLTO
**Priorità**: CRITICA

---

## 📋 Descrizione del Problema

Il programma esegue correttamente il **primo MRN** ma **fallisce al secondo MRN** quando tenta di cliccare su "NCTS Arrival Notification IT".

### Comportamento Osservato

```
✓ MRN #1: Login → Click NCTS → MX DHL → OK → Compila → Invia → SUCCESS
✓ Transizione: Click "Nuova dichiarazione" → SUCCESS
✗ MRN #2: Click NCTS → FAIL
```

**Errore:**
```
[2/2] Impossibile cliccare su 'NCTS Arrival Notification IT'
```

---

## 🎯 Elemento Target

```html
<vaadin-grid-cell-content slot="vaadin-grid-cell-content-10">
  NCTS Arrival Notification IT
</vaadin-grid-cell-content>
```

**Selettore utilizzato:**
```typescript
this.page.getByText("NCTS Arrival Notification IT", { exact: true })
```

---

## ✅ Cosa Funziona

1. **Primo MRN completo** - Tutto OK
2. **Click su "Nuova dichiarazione"** - Funziona
3. **Navigazione tra pagine** - Sembra OK
4. **Tutti gli altri selettori** - Funzionano

---

## ❌ Cosa NON Funziona

1. **Click su NCTS al secondo MRN** - Fallisce sempre
2. Il testo "NCTS Arrival Notification IT" sembra non essere trovato

---

## 🔍 Analisi del Flusso

### Flusso Completo Primo → Secondo MRN

```
[MRN #1 Completo]
  ↓
clickSendButton() → SUCCESS
  ↓
Delay 1000ms
  ↓
Delay 2000ms (attesa ritorno a /cm/declarations)
  ↓
clickNewDeclaration() → SUCCESS
  ├─ waitForLoadState("networkidle", 15s)
  ├─ Click bottone #btnNewDeclaration
  ├─ waitForLoadState("networkidle", 15s) ← DOPO click
  ├─ Attesa grid.waitFor("attached", 10s)
  └─ Delay 2000ms
  ↓
Delay 3000ms extra
  ↓
clickNCTS() → FAIL ✗
  ├─ Log URL corrente
  ├─ waitForLoadState("networkidle", 15s)
  ├─ Verifica grid.count() → ?
  ├─ Delay 3000ms
  ├─ Verifica textElement.count() → 0? ← PROBLEMA
  └─ FAIL
```

---

## 🤔 Ipotesi sul Problema

### Ipotesi #1: Grid non popolata (PIÙ PROBABILE)
La `vaadin-grid` è visibile ma **vuota** o in stato di **loading** quando `clickNCTS()` viene chiamato.

**Evidenze:**
- Funziona al primo giro (dopo login, pagina fresca)
- Fallisce al secondo giro (dopo submit + redirect)
- Stesso selettore, stesso codice

**Possibili cause:**
- Grid si carica in modo asincrono
- I 3 secondi di delay non bastano
- La grid è in loading state
- Componente Vaadin non ha finito di renderizzare

### Ipotesi #2: URL/Navigazione diversa
Dopo `clickNewDeclaration()` al secondo giro, la pagina potrebbe navigare a un URL diverso rispetto al primo giro.

**Da verificare:**
- URL dopo primo `clickNewDeclaration()` (dopo login)
- URL dopo secondo `clickNewDeclaration()` (dopo submit)

### Ipotesi #3: Stato Vaadin diverso
I componenti Vaadin potrebbero avere uno stato interno diverso al secondo giro (cache, eventi, ecc.).

### Ipotesi #4: Timing race condition
C'è una race condition tra:
- Navigazione completa
- Grid rendering
- Fetch dati per la grid
- Popolamento celle della grid

---

## 🛠️ Tentativi di Fix Effettuati

### ✅ Tentativo #1: Aumentato delay
- **Cosa:** Aumentato delay da 1.5s a 3s in `clickNCTS()`
- **Risultato:** Non ha risolto

### ✅ Tentativo #2: Wait dopo `clickNewDeclaration()`
- **Cosa:** Aggiunto `waitForLoadState("networkidle")` + wait grid + delay 2s
- **Risultato:** Non ha risolto

### ✅ Tentativo #3: Selettore diretto al testo
- **Cosa:** Cambiato da `locator().filter()` a `getByText()`
- **Risultato:** Non ha risolto

### ✅ Tentativo #4: Verifiche e logging
- **Cosa:** Aggiunto `gridCount`, `textCount`, screenshot debug
- **Risultato:** Non ha risolto (ma abbiamo più info per debug)

### ✅ Tentativo #5: Scroll e attached checks
- **Cosa:** Aggiunto `scrollIntoViewIfNeeded()`, `waitFor("attached")`
- **Risultato:** Non ha risolto

---

## 📊 Informazioni da Raccogliere (Debug)

### Screenshot da controllare in `logs/`:
1. `ncts_no_grid_found_*.png` - Se grid non esiste
2. `ncts_text_not_found_*.png` - Se testo non trovato
3. `ncts_click_error_*.png` - Se altro errore

### Log da verificare nella console:
```
[DEBUG clickNCTS] URL corrente: <url>
[DEBUG clickNCTS] Grid count: <number>
[DEBUG clickNCTS] Text "NCTS Arrival Notification IT" count: <number>
```

### Domande da rispondere:
1. Qual è l'URL al momento del click fallito?
2. `gridCount` è 0 o 1?
3. `textCount` è 0?
4. La grid esiste ma è vuota?
5. C'è qualche loading spinner visibile?

---

## 🎯 Prossimi Passi per Domani

### PRIORITÀ 1: Raccogliere dati
1. ✅ Eseguire il programma e lasciarlo fallire al secondo MRN
2. ✅ Controllare screenshot in `logs/`
3. ✅ Leggere log console con i `[DEBUG]` message
4. ✅ Verificare URL corrente quando fallisce

### PRIORITÀ 2: Investigare stato grid
1. ❌ Aggiungere log del contenuto HTML della grid
2. ❌ Verificare se grid ha attributo `loading` o simile
3. ❌ Controllare se ci sono spinner o overlay
4. ❌ Ispezionare manualmente la pagina al momento del fallimento (mettere breakpoint)

### PRIORITÀ 3: Soluzioni alternative da provare

#### Soluzione A: Wait più intelligente
Invece di delay fissi, aspettare che la grid sia **effettivamente popolata**:

```typescript
// Attendi che la grid abbia almeno N righe
await this.page.waitForFunction(() => {
  const grid = document.querySelector('vaadin-grid');
  const cells = grid?.querySelectorAll('vaadin-grid-cell-content');
  return cells && cells.length > 0;
}, { timeout: 15000 });
```

#### Soluzione B: Retry logic
Se fallisce, riprova fino a 3 volte con delay crescente:

```typescript
for (let retry = 0; retry < 3; retry++) {
  try {
    await textElement.click();
    return true;
  } catch (e) {
    if (retry < 2) {
      console.log(`Retry ${retry + 1}/3...`);
      await new Promise(resolve => setTimeout(resolve, 2000 * (retry + 1)));
    }
  }
}
```

#### Soluzione C: Force click
Usare `force: true` per bypassare controlli di visibilità:

```typescript
await textElement.click({ force: true });
```

#### Soluzione D: JavaScript click diretto
Bypassare Playwright e cliccare via JavaScript:

```typescript
await this.page.evaluate(() => {
  const text = Array.from(document.querySelectorAll('*'))
    .find(el => el.textContent?.trim() === 'NCTS Arrival Notification IT');
  if (text) text.click();
});
```

#### Soluzione E: Aumentare delay drasticamente
Provare con 10 secondi fissi per vedere se è solo un problema di timing:

```typescript
await new Promise(resolve => setTimeout(resolve, 10000));
```

#### Soluzione F: Navigazione esplicita
Invece di cliccare "Nuova dichiarazione", navigare direttamente all'URL:

```typescript
await this.page.goto('https://ncts.dogana.it/cm/declarations/new');
```

---

## 📝 Note Tecniche

### Struttura Vaadin Grid
```
<vaadin-grid>
  └─ Shadow DOM
      └─ <table>
          └─ <tr>
              └─ <td>
                  └─ <vaadin-grid-cell-content>
                      NCTS Arrival Notification IT
```

### Timing Totali Attuali
- Delay dopo click "Invia": 1s
- Delay prima `clickNewDeclaration()`: 2s
- Wait in `clickNewDeclaration()`: networkidle (max 15s) + attached (max 10s) + 2s = ~17-27s
- Delay dopo `clickNewDeclaration()`: 3s
- Wait in `clickNCTS()`: networkidle (max 15s) + 3s = ~18s

**Totale: ~40-50 secondi tra MRN** (dovrebbe essere più che sufficiente!)

---

## 🔗 File Correlati

- [electron/main.ts](../electron/main.ts) - Righe 398-425 (loop multi-MRN)
- [src/web-automation.ts](../src/web-automation.ts):
  - Righe 553-596: `clickNewDeclaration()`
  - Righe 602-664: `clickNCTS()`
- [src/config.ts](../src/config.ts) - Selettori e timeout

---

## ⚡ Quick Commands per Debug

```bash
# Avvia app e osserva il fallimento
npm run electron:dev

# Controlla screenshot
ls logs/ncts_*.png

# Controlla log completo
# (output nella console Electron)
```

---

## 💡 Insight Importante

**Il fatto che funzioni al PRIMO giro ma NON al SECONDO indica:**
- ✅ Il selettore è corretto
- ✅ Il codice è corretto
- ✅ L'approccio è corretto
- ❌ Lo STATO della pagina è diverso
- ❌ C'è un problema di TIMING o ASYNC LOADING

**Non è un problema di selettore, è un problema di sincronizzazione!**

---

**Ultimo aggiornamento:** 2025-11-12
**Prossima sessione:** Debug con screenshot + log dettagliati
