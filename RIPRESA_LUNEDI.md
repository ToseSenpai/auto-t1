# 🚀 RIPRESA LAVORO LUNEDÌ - Auto-T1 Parte 3

**Data Fix**: 2025-11-14
**Stato**: Fix "Permesso di scarico" completato ✅ | Problema "Invia" aperto ⏳

---

## ✅ COMPLETATO OGGI

### Fix: Filtro "Permesso di scarico"
**Problema**: Doppio "NCTS Arrival Notification IT" con stati diversi (Rifiutato/Accettato)
**Soluzione**: Aggiunto filtro `statoOneriDoganali === "Permesso di scarico"`
**File**: `src/web-automation.ts:1880-1891` (metodo `doubleClickNCTSArrival`)
**Status**: ✅ RISOLTO E TESTATO

---

## ⏳ DA COMPLETARE LUNEDÌ

### Problema Critico: Click Pulsante "Invia" Non Affidabile

**Descrizione**:
- Pulsante `#send` trovato correttamente
- Wait loop verifica enabled state (max 5s)
- Click eseguito MA non sempre registrato dal browser
- Screenshot mostra pulsante visibile e enabled

**File Problematico**: `src/web-automation.ts:2147-2234` (metodo `clickInviaButton`)

**Tentativi Già Fatti (falliti)**:
1. ❌ `page.click('#send')` con selector
2. ❌ `page.evaluate()` con text-matching
3. ❌ `getElementById('send')` direct
4. ❌ Wait loop per enabled state (parziale)

---

## 🔧 SOLUZIONI DA PROVARE LUNEDÌ

### Approccio 1: Keyboard Enter ⭐ PROVA QUESTA PRIMA
```typescript
// Focus sul form e premi Enter
await this.page.focus('#send');
await this.page.keyboard.press('Enter');
```

### Approccio 2: JavaScript MouseEvent
```typescript
await this.page.evaluate(() => {
  const btn = document.getElementById('send');
  const event = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true,
    composed: true  // ← IMPORTANTE per Shadow DOM
  });
  btn.dispatchEvent(event);
});
```

### Approccio 3: Wait for Network Idle
```typescript
await this.page.waitForLoadState('networkidle');
await this.page.waitForTimeout(1000); // Extra safety
await this.page.click('#send');
```

### Approccio 4: Force Click
```typescript
await this.page.locator('#send').click({ force: true });
```

### Approccio 5: Form Submit
```typescript
const form = await this.page.evaluate(() => {
  const btn = document.getElementById('send');
  const form = btn.closest('form');
  if (form) {
    form.submit();
    return true;
  }
  return false;
});
```

### Approccio 6: Shadow DOM Investigation
```typescript
const buttonInfo = await this.page.evaluate(() => {
  const btn = document.getElementById('send') as any;
  return {
    hasShadowRoot: !!btn.shadowRoot,
    hasClickHandler: btn.onclick !== null,
    classList: Array.from(btn.classList),
    attributes: Array.from(btn.attributes).map(a => `${a.name}="${a.value}"`),
    isVaadinButton: btn.tagName === 'VAADIN-BUTTON'
  };
});
console.log('Button Debug:', buttonInfo);
```

---

## 📋 CHECKLIST LUNEDÌ

- [ ] Leggere questa nota + `.claude/sessions/2025-11-14_parte3_status_filter.md`
- [ ] Verificare che fix "Permesso di scarico" funziona ancora
- [ ] Provare Approccio 1 (Keyboard Enter)
- [ ] Se fallisce, provare Approccio 2 (MouseEvent con composed: true)
- [ ] Se fallisce, provare Approccio 3 (Network Idle)
- [ ] Se tutti falliscono, investigare con Approccio 6 (Debug info)
- [ ] Quando risolto: test end-to-end con file Excel completo
- [ ] Commit: `fix: 🐛 Risolto click pulsante Invia (Parte 3)`
- [ ] Aggiornare `docs/CURRENT_STATUS.md` (rimuovere da Known Issues)
- [ ] Celebrare Parte 3 completa! 🎉

---

## 📁 FILE CHIAVE

### Da Modificare
- `src/web-automation.ts:2147-2234` - Metodo `clickInviaButton()` (DA FIXARE)

### Da Leggere per Context
- `.claude/sessions/2025-11-14_parte3_status_filter.md` - Nota sessione completa
- `docs/CURRENT_STATUS.md` - Stato progetto aggiornato
- `docs/DECISIONS.md` - ADR-021 aggiunto

### Handler Main Process
- `electron/main.ts:830-1167` - Handler `automation:part3-search-only`

---

## 🎯 OBIETTIVO FINALE

**Parte 3 completamente funzionante**:
1. ✅ Login → Ricerca → Analisi → Decisione
2. ✅ Apertura dichiarazione (con filtro "Permesso di scarico")
3. ✅ Click sequence → Fill form
4. ⏳ Click "Invia" finale ← **QUESTO È IL BLOCCO**
5. ✅ Multi-MRN loop

**Quando "Invia" funziona → Parte 3 COMPLETATA!** 🚀

---

## 💡 NOTE TECNICHE

### Cosa Sappiamo del Pulsante
- **ID**: `send`
- **Tipo**: `vaadin-button` con classe `button-prominent`
- **Stato**: Diventa enabled dopo ~1-2 secondi dal fill campo
- **Comportamento**: Click programmatico non sempre triggera
- **Possibile Causa**: Event listener custom Vaadin o Shadow DOM issue

### Pattern Vaadin
Vaadin buttons spesso richiedono:
- `composed: true` negli eventi (per attraversare Shadow DOM)
- Dispatch event su shadowRoot interno, non solo sull'elemento esterno
- Focus esplicito prima del click

### Success Indicators
Quando click funziona:
- Redirect automatico a `/cm/declarations`
- Log "✓ MRN completato con successo!"
- No screenshot error

---

**Buon lavoro lunedì! 💪**

**Riferimenti Rapidi**:
- Sessione: `.claude/sessions/2025-11-14_parte3_status_filter.md`
- Status: `docs/CURRENT_STATUS.md`
- Decisioni: `docs/DECISIONS.md` (ADR-021)
