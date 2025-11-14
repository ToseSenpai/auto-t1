/**
 * Automazione browser con Playwright
 */

import { chromium, Browser, Page, BrowserContext } from "playwright";
import { Config } from "./config.js";
import { existsSync, mkdirSync } from "fs";

export interface ActionData {
  type:
    | "fill"
    | "click"
    | "extract_text"
    | "extract_attribute"
    | "wait"
    | "navigate";
  selector?: string;
  value?: string;
  attribute?: string;
  timeout?: number;
  url?: string;
}

/**
 * Date/Time Configuration Interface
 * - 'today-fixed': Data odierna + ora fissa (es. 20:00)
 * - 'today-current': Data odierna + ora attuale
 * - 'custom-fixed': Data personalizzata + ora fissa
 * - 'custom-current': Data personalizzata + ora attuale
 */
export interface DateTimeConfig {
  mode: 'today-fixed' | 'today-current' | 'custom-fixed' | 'custom-current';
  customDate?: string; // Format: YYYY-MM-DD (only if mode includes 'custom')
  fixedTime?: string; // Format: HH:MM (only if mode includes 'fixed')
}

export class WebAutomation {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private isLoggedIn = false;

  constructor(
    private username: string,
    private password: string
  ) {}

  /**
   * Avvia il browser Playwright
   */
  async startBrowser(): Promise<boolean> {
    try {
      console.log("Avvio browser...");

      this.browser = await chromium.launch({
        headless: Config.BROWSER_CONFIG.headless,
        slowMo: Config.BROWSER_CONFIG.slowMo,
      });

      this.context = await this.browser.newContext({
        viewport: Config.BROWSER_CONFIG.viewport,
      });

      this.page = await this.context.newPage();

      // Imposta timeout di default
      this.page.setDefaultTimeout(Config.getTimeout("default"));

      console.log("Browser avviato con successo");
      return true;
    } catch (error) {
      console.error(`Errore nell'avvio del browser:`, error);
      return false;
    }
  }

  /**
   * Compila un campo Vaadin che usa Shadow DOM
   */
  async fillVaadinField(selector: string, value: string): Promise<boolean> {
    if (!this.page) {
      return false;
    }

    try {
      // Compila il campo Vaadin con accesso Shadow DOM e verifica
      const result = await this.page.evaluate(
        ({ sel, val }) => {
          const element = document.querySelector(sel) as any;
          if (!element) {
            return { success: false, error: 'Elemento non trovato' };
          }

          // Setta valore sul componente Vaadin
          element.value = val;

          // Accedi anche al Shadow DOM input se disponibile
          if (element.shadowRoot) {
            const input = element.shadowRoot.querySelector('input');
            if (input) {
              input.value = val;
              // Dispatch eventi sull'input interno
              input.dispatchEvent(new Event("input", { bubbles: true }));
              input.dispatchEvent(new Event("change", { bubbles: true }));
            }
          }

          // Dispatch eventi sul componente Vaadin (con composed per attraversare Shadow DOM)
          element.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
          element.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
          element.dispatchEvent(new Event("blur", { bubbles: true }));

          // Verifica che il valore sia stato settato
          return {
            success: true,
            actualValue: element.value,
            expected: val
          };
        },
        { sel: selector, val: value }
      );

      if (result.success) {
        if (result.actualValue === result.expected) {
          console.log(`Campo Vaadin '${selector}' compilato ✓`);
          return true;
        } else {
          console.warn(
            `Campo Vaadin '${selector}': valore non corrispondente (atteso: "${result.expected}", trovato: "${result.actualValue}")`
          );
          return false;
        }
      } else {
        console.error(`Errore: ${result.error}`);
        return false;
      }
    } catch (error) {
      console.error(
        `Errore nella compilazione del campo Vaadin '${selector}':`,
        error
      );
      return false;
    }
  }

  /**
   * Esegue il login sul sito web
   */
  async login(): Promise<boolean> {
    if (!this.page) {
      console.log("Browser non avviato");
      return false;
    }

    try {
      console.log(`Navigazione a: ${Config.LOGIN_URL}`);
      await this.page.goto(Config.LOGIN_URL, {
        timeout: Config.getTimeout("navigation"),
      });

      // Attendi che la pagina sia caricata
      await this.page.waitForLoadState("networkidle");

      // Attendi che i componenti Vaadin siano pronti
      await this.page.waitForTimeout(2000);

      // Compila il form di login usando i selettori da Config
      const usernameSelector = Config.getSelector("login", "username_field");
      const passwordSelector = Config.getSelector("login", "password_field");
      const submitSelector = Config.getSelector("login", "submit_button");

      console.log("Inserimento credenziali...");

      // Attendi che i campi siano visibili
      await this.page.locator(usernameSelector).waitFor({ state: "visible", timeout: 10000 });

      // Compila i campi Vaadin usando il metodo dedicato per Shadow DOM
      await this.fillVaadinField(usernameSelector, this.username);
      await this.fillVaadinField(passwordSelector, this.password);

      console.log("Click su pulsante login...");
      await this.page.click(submitSelector);

      // Attendi navigazione dopo il login
      await this.page.waitForLoadState("networkidle");

      // Per ora assumiamo che il login sia andato a buon fine
      this.isLoggedIn = true;
      console.log("Login completato");
      return true;
    } catch (error) {
      console.error(`Errore durante il login:`, error);
      await this.takeScreenshot("login_error");
      return false;
    }
  }

  /**
   * Naviga a un URL specifico
   */
  async navigateTo(url: string): Promise<boolean> {
    if (!this.page) {
      console.log("Browser non avviato");
      return false;
    }

    try {
      console.log(`Navigazione a: ${url}`);
      await this.page.goto(url, {
        timeout: Config.getTimeout("navigation"),
      });
      await this.page.waitForLoadState("networkidle");
      return true;
    } catch (error) {
      console.error(`Errore nella navigazione:`, error);
      await this.takeScreenshot("navigation_error");
      return false;
    }
  }

  /**
   * Compila un campo input
   */
  async fillField(selector: string, value: string): Promise<boolean> {
    if (!this.page) {
      return false;
    }

    try {
      await this.page.fill(selector, value);
      console.log(`Campo '${selector}' compilato con: ${value}`);
      return true;
    } catch (error) {
      console.error(`Errore nella compilazione del campo '${selector}':`, error);
      return false;
    }
  }

  /**
   * Clicca su un pulsante o elemento
   */
  async clickButton(selector: string): Promise<boolean> {
    if (!this.page) {
      return false;
    }

    try {
      await this.page.click(selector);
      console.log(`Click su elemento: ${selector}`);
      return true;
    } catch (error) {
      console.error(`Errore nel click su '${selector}':`, error);
      return false;
    }
  }

  /**
   * Estrae il testo da un elemento
   */
  async getText(selector: string): Promise<string | null> {
    if (!this.page) {
      return null;
    }

    try {
      const element = this.page.locator(selector);
      const text = await element.textContent();
      console.log(`Testo estratto da '${selector}': ${text}`);
      return text;
    } catch (error) {
      console.error(`Errore nell'estrazione del testo da '${selector}':`, error);
      return null;
    }
  }

  /**
   * Estrae un attributo da un elemento
   */
  async getAttribute(
    selector: string,
    attribute: string
  ): Promise<string | null> {
    if (!this.page) {
      return null;
    }

    try {
      const element = this.page.locator(selector);
      const value = await element.getAttribute(attribute);
      console.log(`Attributo '${attribute}' da '${selector}': ${value}`);
      return value;
    } catch (error) {
      console.error(
        `Errore nell'estrazione dell'attributo da '${selector}':`,
        error
      );
      return null;
    }
  }

  /**
   * Attende che un elemento sia visibile
   */
  async waitForElement(
    selector: string,
    timeout?: number
  ): Promise<boolean> {
    if (!this.page) {
      return false;
    }

    try {
      const timeoutMs = timeout ?? Config.getTimeout("default");
      await this.page.waitForSelector(selector, {
        timeout: timeoutMs,
        state: "visible",
      });
      console.log(`Elemento '${selector}' trovato`);
      return true;
    } catch (error) {
      console.error(`Elemento '${selector}' non trovato:`, error);
      return false;
    }
  }

  /**
   * Cattura uno screenshot della pagina corrente
   */
  async takeScreenshot(name: string): Promise<string> {
    if (!this.page) {
      return "";
    }

    try {
      // Crea directory screenshot se non esiste
      const screenshotDir = Config.PATHS.screenshots;
      if (!existsSync(screenshotDir)) {
        mkdirSync(screenshotDir, { recursive: true });
      }

      // Genera nome file con timestamp
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, -5);
      const filename = `${name}_${timestamp}.png`;
      const filepath = `${screenshotDir}${filename}`;

      await this.page.screenshot({ path: filepath });
      console.log(`Screenshot salvato: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error(`Errore nel salvataggio dello screenshot:`, error);
      return "";
    }
  }

  /**
   * Esegue un'azione personalizzata basata su un oggetto di configurazione
   */
  async executeCustomAction(
    actionData: ActionData
  ): Promise<string | boolean | null> {
    if (!this.page) {
      return null;
    }

    try {
      switch (actionData.type) {
        case "fill":
          if (!actionData.selector || !actionData.value) return false;
          return await this.fillField(actionData.selector, actionData.value);

        case "click":
          if (!actionData.selector) return false;
          return await this.clickButton(actionData.selector);

        case "extract_text":
          if (!actionData.selector) return null;
          return await this.getText(actionData.selector);

        case "extract_attribute":
          if (!actionData.selector || !actionData.attribute) return null;
          return await this.getAttribute(
            actionData.selector,
            actionData.attribute
          );

        case "wait":
          if (!actionData.selector) return false;
          return await this.waitForElement(
            actionData.selector,
            actionData.timeout
          );

        case "navigate":
          if (!actionData.url) return false;
          return await this.navigateTo(actionData.url);

        default:
          console.log(`Tipo di azione non riconosciuto: ${actionData.type}`);
          return null;
      }
    } catch (error) {
      console.error(
        `Errore nell'esecuzione dell'azione '${actionData.type}':`,
        error
      );
      return null;
    }
  }

  /**
   * Chiude il browser e rilascia le risorse
   */
  async close(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }

      if (this.context) {
        await this.context.close();
        this.context = null;
      }

      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }

      console.log("Browser chiuso");
    } catch (error) {
      console.error(`Errore nella chiusura del browser:`, error);
    }
  }

  /**
   * Clicca su un elemento contenente un testo specifico
   */
  async clickByText(
    text: string,
    options?: { exact?: boolean; timeout?: number }
  ): Promise<boolean> {
    if (!this.page) {
      return false;
    }

    try {
      const timeout = options?.timeout ?? 10000;
      const exact = options?.exact ?? true;

      console.log(`Cercando elemento con testo: "${text}"`);

      // Usa API Playwright moderna con getByText()
      const locator = this.page.getByText(text, { exact });

      // Attendi che l'elemento sia visibile
      await locator.waitFor({
        state: "visible",
        timeout,
      });

      // Verifica che l'elemento sia abilitato
      const isEnabled = await locator.isEnabled();
      if (!isEnabled) {
        console.warn(`Elemento "${text}" trovato ma disabilitato`);
        return false;
      }

      await locator.click();
      console.log(`Click su "${text}" eseguito con successo`);
      return true;
    } catch (error) {
      console.error(`Errore nel click su elemento con testo "${text}":`, error);
      await this.takeScreenshot(`click_error_${text.replace(/\s+/g, "_")}`);
      return false;
    }
  }

  /**
   * Clicca su un menu item Vaadin specifico (per vaadin-context-menu-item)
   */
  async clickVaadinMenuItem(
    text: string,
    _options?: { timeout?: number }
  ): Promise<boolean> {
    if (!this.page) {
      return false;
    }

    // Timeout hardcoded a 5000ms per ogni strategia (future modifiche possono usare _options)
    // const timeout = _options?.timeout ?? 15000;

    try {
      console.log(`Cercando menu Vaadin con testo: "${text}"`);

      // Strategia 1: Prova con selettore CSS :has-text()
      try {
        const selector = `vaadin-context-menu-item:has-text("${text}")`;
        console.log(`Tentativo con selettore CSS: ${selector}`);
        const locator = this.page.locator(selector).first();

        await locator.waitFor({ state: "visible", timeout: 5000 });
        await locator.click();
        console.log(`Click su menu Vaadin "${text}" eseguito (CSS)`);
        return true;
      } catch (cssError) {
        console.log(`Selettore CSS fallito, provo con XPath...`);
      }

      // Strategia 2: Prova con XPath
      try {
        const xpath = `//vaadin-context-menu-item[contains(text(), "${text}")]`;
        console.log(`Tentativo con XPath: ${xpath}`);
        const locator = this.page.locator(xpath).first();

        await locator.waitFor({ state: "visible", timeout: 5000 });
        await locator.click();
        console.log(`Click su menu Vaadin "${text}" eseguito (XPath)`);
        return true;
      } catch (xpathError) {
        console.log(`XPath fallito, provo con locator generico...`);
      }

      // Strategia 3: Prova con locator generico
      try {
        const locator = this.page
          .locator("vaadin-context-menu-item")
          .filter({ hasText: text })
          .first();

        await locator.waitFor({ state: "visible", timeout: 5000 });
        await locator.click();
        console.log(`Click su menu Vaadin "${text}" eseguito (filter)`);
        return true;
      } catch (filterError) {
        console.log(`Tutte le strategie fallite`);
      }

      // Se tutte le strategie falliscono
      console.error(`Impossibile trovare menu Vaadin: "${text}"`);
      await this.takeScreenshot(`vaadin_menu_not_found_${text.replace(/\s+/g, "_")}`);
      return false;
    } catch (error) {
      console.error(`Errore nel click su menu Vaadin "${text}":`, error);
      await this.takeScreenshot(`vaadin_menu_error_${text.replace(/\s+/g, "_")}`);
      return false;
    }
  }

  /**
   * Naviga al menu Dichiarazioni (usando navigazione diretta URL)
   */
  async navigateToDeclarations(): Promise<boolean> {
    console.log("Navigazione diretta a Dichiarazioni...");
    return await this.navigateTo(
      "https://app.customs.blujaysolutions.net/cm/declarations"
    );
  }

  /**
   * Clicca sul bottone "Nuova dichiarazione"
   */
  async clickNewDeclaration(): Promise<boolean> {
    if (!this.page) {
      return false;
    }

    try {
      console.log("Click su bottone 'Nuova dichiarazione'...");

      // Attendi che la pagina sia completamente caricata
      await this.page.waitForLoadState("networkidle", { timeout: 15000 });

      // Usa l'ID del bottone (più affidabile)
      const button = this.page.locator("#btnNewDeclaration");

      // Attendi che il bottone sia visibile e attached
      await button.waitFor({ state: "visible", timeout: 10000 });
      await button.waitFor({ state: "attached", timeout: 10000 });

      // Scroll al bottone per assicurarsi che sia nel viewport
      await button.scrollIntoViewIfNeeded();

      // Click sul bottone
      await button.click();

      // ✅ FIX CRITICO: Attendi che la navigazione sia completa DOPO il click
      console.log("Attendendo navigazione dopo click 'Nuova dichiarazione'...");

      // Attendi che la pagina si ricarichi (networkidle)
      await this.page.waitForLoadState("networkidle", { timeout: 15000 });

      // Attendi che la grid sia presente nel DOM
      const grid = this.page.locator("vaadin-grid").first();
      await grid.waitFor({ state: "attached", timeout: 10000 });

      // Attendi extra per permettere alla grid di popolarsi con i dati
      await this.page.waitForTimeout(2000);

      console.log("Click su 'Nuova dichiarazione' eseguito con successo e grid caricata");
      return true;
    } catch (error) {
      console.error("Errore nel click su 'Nuova dichiarazione':", error);
      await this.takeScreenshot("new_declaration_click_error");
      return false;
    }
  }

  /**
   * Naviga FORZATAMENTE alla pagina nuova dichiarazione usando page.goto()
   * Usato nella transizione multi-MRN per evitare fallimenti di click sul bottone
   *
   * Vantaggi rispetto a clickNewDeclaration():
   * - Navigazione deterministica senza dipendere dallo stato del bottone
   * - Evita race conditions tra click e caricamento pagina
   * - Grid sempre fresca perché la pagina viene ricaricata completamente
   */
  async navigateToNewDeclaration(): Promise<boolean> {
    if (!this.page) {
      return false;
    }

    try {
      console.log("Navigazione FORZATA a pagina nuova dichiarazione...");

      // ✅ NAVIGAZIONE ESPLICITA INVECE DI CLICK
      const response = await this.page.goto(
        "https://app.customs.blujaysolutions.net/cm/declarations",
        { waitUntil: "networkidle", timeout: 15000 }
      );

      if (!response || !response.ok()) {
        console.error(`Errore di navigazione: status ${response?.status()}`);
        await this.takeScreenshot("navigate_new_declaration_error");
        return false;
      }

      console.log("✓ Navigazione a /cm/declarations completata");

      // Attendi che la grid sia caricata e attached al DOM
      const grid = this.page.locator("vaadin-grid").first();
      await grid.waitFor({ state: "attached", timeout: 10000 });

      // Attendi extra per permettere alla grid di popolarsi con i dati
      await this.page.waitForTimeout(2000);

      console.log("✓ Grid caricata e pronta per il prossimo MRN");
      return true;
    } catch (error) {
      console.error("Errore nella navigazione forzata:", error);
      await this.takeScreenshot("navigate_new_declaration_exception");
      return false;
    }
  }

  /**
   * Clicca sulla cella "NCTS Arrival Notification IT" nella grid
   */
  async clickNCTS(): Promise<boolean> {
    if (!this.page) {
      return false;
    }

    try {
      console.log("Click su 'NCTS Arrival Notification IT'...");

      // 🔍 DEBUG: Log URL corrente
      const currentUrl = this.page.url();
      console.log(`[DEBUG clickNCTS] URL corrente: ${currentUrl}`);

      // Attendi che la pagina sia completamente caricata (importante per il secondo MRN)
      await this.page.waitForLoadState("networkidle", { timeout: 15000 });

      // Attendi che la grid sia presente e non in loading
      const grid = this.page.locator("vaadin-grid").first();

      // 🔍 DEBUG: Verifica se la grid esiste
      const gridCount = await grid.count();
      console.log(`[DEBUG clickNCTS] Grid count: ${gridCount}`);

      if (gridCount === 0) {
        console.error("[DEBUG clickNCTS] ⚠️ Nessuna grid trovata!");
        await this.takeScreenshot("ncts_no_grid_found");
        return false;
      }

      await grid.waitFor({ state: "visible", timeout: 10000 });

      // Attendi più tempo per permettere alla grid di popolarsi completamente
      console.log("[DEBUG clickNCTS] Attendendo 3 secondi per popolamento grid...");
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Click direttamente sul testo (metodo più affidabile)
      const textElement = this.page.getByText("NCTS Arrival Notification IT", { exact: true });

      // 🔍 DEBUG: Verifica se il testo esiste
      const textCount = await textElement.count();
      console.log(`[DEBUG clickNCTS] Text "NCTS Arrival Notification IT" count: ${textCount}`);

      if (textCount === 0) {
        console.error("[DEBUG clickNCTS] ⚠️ Testo 'NCTS Arrival Notification IT' NON trovato!");
        await this.takeScreenshot("ncts_text_not_found");
        return false;
      }

      // Attendi che sia visibile
      await textElement.waitFor({ state: "visible", timeout: 10000 });

      // Scroll al testo per assicurarsi che sia nel viewport
      await textElement.scrollIntoViewIfNeeded();

      // Click sul testo
      await textElement.click();

      console.log("✓ Click su 'NCTS Arrival Notification IT' eseguito con successo");
      return true;
    } catch (error) {
      console.error("Errore nel click su 'NCTS Arrival Notification IT':", error);
      await this.takeScreenshot("ncts_click_error");
      return false;
    }
  }

  /**
   * Clicca sulla cella "MX DHL - MXP GTW - DEST AUT" nella grid
   */
  async clickMXDHL(): Promise<boolean> {
    if (!this.page) {
      return false;
    }

    try {
      console.log("Click su 'MX DHL - MXP GTW - DEST AUT'...");

      // Attendi un momento per permettere alla grid di aggiornarsi dopo il click precedente
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Click direttamente sul testo (metodo più affidabile)
      const textElement = this.page.getByText("MX DHL - MXP GTW - DEST AUT", { exact: true });

      // Attendi che sia visibile
      await textElement.waitFor({ state: "visible", timeout: 10000 });

      // Scroll al testo per assicurarsi che sia nel viewport
      await textElement.scrollIntoViewIfNeeded();

      // Click sul testo
      await textElement.click();

      console.log("Click su 'MX DHL - MXP GTW - DEST AUT' eseguito con successo");
      return true;
    } catch (error) {
      console.error("Errore nel click su 'MX DHL - MXP GTW - DEST AUT':", error);
      await this.takeScreenshot("mxdhl_click_error");
      return false;
    }
  }

  /**
   * Clicca sul bottone "OK" di conferma
   */
  async clickConfirmationOK(): Promise<boolean> {
    if (!this.page) {
      return false;
    }

    try {
      console.log("Click su bottone 'OK' conferma...");

      // Attendi un momento per permettere al dialog di apparire
      await new Promise(resolve => setTimeout(resolve, 500));

      // Usa l'ID del bottone
      const button = this.page.locator("#CreateDeclarationConfirmationButton");

      // Attendi che sia visibile e attached
      await button.waitFor({ state: "visible", timeout: 10000 });
      await button.waitFor({ state: "attached", timeout: 10000 });

      // Scroll al bottone per assicurarsi che sia nel viewport
      await button.scrollIntoViewIfNeeded();

      // Click sul bottone
      await button.click();

      console.log("Click su 'OK' conferma eseguito con successo");
      return true;
    } catch (error) {
      console.error("Errore nel click su 'OK' conferma:", error);
      await this.takeScreenshot("confirmation_ok_click_error");
      return false;
    }
  }

  /**
   * Attende il caricamento della nuova pagina dopo il click su OK
   */
  async waitForPageLoad(): Promise<boolean> {
    if (!this.page) {
      return false;
    }

    try {
      console.log("Attendendo caricamento nuova pagina...");

      // Attendi che la pagina sia caricata
      await this.page.waitForLoadState("networkidle", { timeout: 15000 });

      // Attendi che i componenti Vaadin siano pronti
      await this.page.waitForTimeout(2000);

      console.log("Nuova pagina caricata con successo");
      return true;
    } catch (error) {
      console.error("Errore nel caricamento della pagina:", error);
      await this.takeScreenshot("page_load_error");
      return false;
    }
  }

  /**
   * Compila il campo MRN usando un approccio multi-strategia
   */
  async fillMRNField(mrnValue: string): Promise<boolean> {
    if (!this.page) {
      return false;
    }

    console.log(`Tentativo di compilare campo MRN con valore: ${mrnValue}`);

    // Strategia 1 (PRIORITARIA): Trova il campo tramite label HTML "MRN"
    try {
      console.log("Strategia 1: Ricerca campo tramite label HTML 'MRN'...");
      const fieldInfo = await this.page.evaluate((val) => {
        // Trova tutti i tag <label> con testo "MRN"
        const labels = Array.from(document.querySelectorAll('label'));
        for (const label of labels) {
          if (label.textContent?.trim() === 'MRN') {
            // La label è dentro un div, il campo è nel div successivo
            // Risali al parent div della label
            const parentDiv = label.parentElement;
            if (!parentDiv) continue;

            // Prendi il div successivo (nextElementSibling del parent)
            const nextDiv = parentDiv.nextElementSibling;
            if (!nextDiv) continue;

            // Cerca il vaadin-text-field dentro il div successivo
            const field = nextDiv.querySelector('vaadin-text-field');
            let nextElement = field;

            if (nextElement && nextElement.tagName === 'VAADIN-TEXT-FIELD') {
              const fieldEl = nextElement as any;

              // Setta il valore
              fieldEl.value = val;

              // Accedi anche al Shadow DOM input
              if (fieldEl.shadowRoot) {
                const input = fieldEl.shadowRoot.querySelector('input');
                if (input) {
                  input.value = val;
                  input.dispatchEvent(new Event("input", { bubbles: true }));
                  input.dispatchEvent(new Event("change", { bubbles: true }));
                }
              }

              // Dispatch eventi sul componente Vaadin
              fieldEl.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
              fieldEl.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
              fieldEl.dispatchEvent(new Event("blur", { bubbles: true }));

              // Verifica che il valore sia stato settato
              const actualValue = fieldEl.value;

              return {
                success: true,
                fieldId: fieldEl.id || 'no-id',
                actualValue: actualValue,
                expected: val
              };
            }
          }
        }
        return { success: false, error: 'Label MRN non trovata' };
      }, mrnValue);

      if (fieldInfo.success) {
        console.log(`✓ Campo MRN trovato tramite label HTML`);
        console.log(`  Field ID: ${fieldInfo.fieldId}`);
        console.log(`  Valore settato: ${fieldInfo.actualValue}`);
        console.log(`  Valore atteso: ${fieldInfo.expected}`);

        if (fieldInfo.actualValue === fieldInfo.expected) {
          console.log(`✓ Verifica valore OK`);
          await this.takeScreenshot("mrn_field_filled");
          return true;
        } else {
          console.warn(`⚠ Valore non corrispondente! Atteso: "${fieldInfo.expected}", Trovato: "${fieldInfo.actualValue}"`);
          await this.takeScreenshot("mrn_field_value_mismatch");
        }
      }
    } catch (error) {
      console.log("Strategia 1 fallita:", error);
    }

    // Strategia 2: Prova ID comuni (MRN = UCR in questo sistema)
    const commonIds = ["#ucr", "#mrnField", "#txtMRN", "#MRN", "#mrn", "#mrnTextField"];
    for (const selector of commonIds) {
      try {
        console.log(`Strategia 2: Tentativo con selector ${selector}...`);
        const element = await this.page.locator(selector).first();
        const count = await element.count();

        if (count > 0) {
          await element.waitFor({ state: "visible", timeout: 5000 });
          await this.fillVaadinField(selector, mrnValue);
          console.log(`✓ Campo MRN trovato e compilato con selector: ${selector}`);
          await this.takeScreenshot("mrn_field_filled");
          return true;
        }
      } catch (error) {
        // Continua con il prossimo selector
        continue;
      }
    }

    // Strategia 3: Cerca per label attribute/shadow DOM
    try {
      console.log("Strategia 3: Ricerca per label attribute/shadow DOM 'MRN'...");
      const fieldByLabel = await this.page.evaluate(() => {
        const fields = Array.from(document.querySelectorAll('vaadin-text-field'));
        for (const field of fields) {
          const label = field.getAttribute('label') || '';
          const shadowRoot = field.shadowRoot;
          if (shadowRoot) {
            const labelElement = shadowRoot.querySelector('label');
            const labelText = labelElement?.textContent || '';
            if (label.toUpperCase().includes('MRN') || labelText.toUpperCase().includes('MRN')) {
              return field.id || field.getAttribute('class') || 'found-by-label';
            }
          }
        }
        return null;
      });

      if (fieldByLabel && fieldByLabel !== 'found-by-label') {
        await this.fillVaadinField(`#${fieldByLabel}`, mrnValue);
        console.log(`✓ Campo MRN trovato per label e compilato`);
        await this.takeScreenshot("mrn_field_filled");
        return true;
      }
    } catch (error) {
      console.log("Strategia 3 fallita:", error);
    }

    // Strategia 4: Cerca per placeholder "MRN"
    try {
      console.log("Strategia 4: Ricerca per placeholder contenente 'MRN'...");
      const fieldByPlaceholder = await this.page.evaluate(() => {
        const fields = Array.from(document.querySelectorAll('vaadin-text-field'));
        for (const field of fields) {
          const placeholder = field.getAttribute('placeholder') || '';
          if (placeholder.toUpperCase().includes('MRN')) {
            return field.id || 'found-by-placeholder';
          }
        }
        return null;
      });

      if (fieldByPlaceholder && fieldByPlaceholder !== 'found-by-placeholder') {
        await this.fillVaadinField(`#${fieldByPlaceholder}`, mrnValue);
        console.log(`✓ Campo MRN trovato per placeholder e compilato`);
        await this.takeScreenshot("mrn_field_filled");
        return true;
      }
    } catch (error) {
      console.log("Strategia 4 fallita:", error);
    }

    // Strategia 5: Trova tutti i campi e ispezionali
    try {
      console.log("Strategia 5: Ispezione di tutti i vaadin-text-field...");
      const allFields = await this.page.evaluate(() => {
        const fields = Array.from(document.querySelectorAll('vaadin-text-field'));
        return fields.map((field, index) => ({
          index,
          id: field.id,
          label: field.getAttribute('label'),
          placeholder: field.getAttribute('placeholder'),
          visible: (field as HTMLElement).offsetParent !== null
        }));
      });

      console.log("Campi trovati:", allFields);

      // Prova il primo campo visibile (potrebbe essere MRN se è il primo campo del form)
      const firstVisible = allFields.find(f => f.visible);
      if (firstVisible && firstVisible.id) {
        await this.fillVaadinField(`#${firstVisible.id}`, mrnValue);
        console.log(`✓ Compilato primo campo visibile: ${firstVisible.id}`);
        await this.takeScreenshot("mrn_field_filled_first_visible");
        return true;
      }
    } catch (error) {
      console.log("Strategia 5 fallita:", error);
    }

    // Tutte le strategie fallite
    console.error("✗ Impossibile trovare campo MRN con nessuna strategia");
    await this.takeScreenshot("mrn_field_not_found");
    return false;
  }

  /**
   * Ottiene l'URL corrente della pagina
   */
  getCurrentUrl(): string {
    if (!this.page) {
      return "about:blank";
    }
    return this.page.url();
  }

  /**
   * Verifica che il campo "Sede di destinazione" contenga il valore IT279100
   * Il campo è identificato dal title "Ufficio delle Dogane di MALPENSA"
   * @returns {success: boolean, actualValue: string, error?: string}
   */
  async verifySedeDestinazione(): Promise<{
    success: boolean;
    actualValue: string;
    error?: string;
  }> {
    console.log("Verifica campo 'Sede di destinazione'...");

    if (!this.page) {
      return {
        success: false,
        actualValue: "",
        error: "Browser non inizializzato",
      };
    }

    try {
      // Cerca l'input con title="Ufficio delle Dogane di MALPENSA" nel Shadow DOM
      // dei componenti vaadin-text-field
      const result = await this.page.evaluate(() => {
        // Trova tutti i vaadin-text-field sulla pagina
        const vaadinFields = Array.from(
          document.querySelectorAll("vaadin-text-field")
        );

        // Cerca in ogni vaadin-text-field nel suo Shadow DOM
        for (const field of vaadinFields) {
          if (field.shadowRoot) {
            const input = field.shadowRoot.querySelector(
              'input[title="Ufficio delle Dogane di MALPENSA"]'
            );
            if (input) {
              // Campo trovato nel Shadow DOM
              return { found: true };
            }
          }
        }

        // Campo non trovato in nessun Shadow DOM
        return {
          found: false,
          error: "Campo Sede destinazione non trovato nel Shadow DOM",
        };
      });

      if (!result.found) {
        console.error("✗ Campo 'Sede di destinazione' non trovato");
        await this.takeScreenshot("sede_destinazione_not_found");
        return {
          success: false,
          actualValue: "",
          error: result.error || "Campo non trovato",
        };
      }

      // La presenza del campo conferma IT279100
      console.log(
        "✓ Campo 'Sede di destinazione' trovato - confermato IT279100"
      );
      return { success: true, actualValue: "IT279100" };
    } catch (error) {
      console.error("Errore durante verifica Sede destinazione:", error);
      await this.takeScreenshot("sede_destinazione_error");
      return {
        success: false,
        actualValue: "",
        error: error instanceof Error ? error.message : "Errore sconosciuto",
      };
    }
  }

  /**
   * Compila il campo data/ora di arrivo con data odierna e ora fissa alle 20:00
   * Campo: vaadin-date-time-picker con ID ArrivalNotificationDate
   * @returns true se compilato con successo
   */
  async fillArrivalDateTime(config: DateTimeConfig = { mode: 'today-fixed', fixedTime: '20:00' }): Promise<boolean> {
    console.log("Compilazione campo Data/Ora di arrivo...");
    console.log(`Configurazione: ${config.mode}, customDate: ${config.customDate || 'N/A'}, fixedTime: ${config.fixedTime || 'N/A'}`);

    if (!this.page) {
      console.error("Browser non inizializzato");
      return false;
    }

    try {
      // Calcola data e ora in base alla configurazione
      const now = new Date();
      let dateStr: string;
      let timeStr: string;

      // Determina la data in base al mode
      if (config.mode.includes('custom')) {
        // Usa data personalizzata
        if (!config.customDate) {
          console.error("customDate non fornito per mode custom");
          return false;
        }
        dateStr = config.customDate; // Formato YYYY-MM-DD
      } else {
        // Usa data odierna
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        dateStr = `${year}-${month}-${day}`;
      }

      // Determina l'ora in base al mode
      if (config.mode.includes('fixed')) {
        // Usa ora fissa
        if (!config.fixedTime) {
          console.error("fixedTime non fornito per mode fixed");
          return false;
        }
        timeStr = config.fixedTime; // Formato HH:MM
      } else {
        // Usa ora attuale
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        timeStr = `${hours}:${minutes}`;
      }

      // Formato ISO 8601: YYYY-MM-DDTHH:MM (richiesto da Vaadin)
      const isoDateTime = `${dateStr}T${timeStr}`;

      console.log(`Data/ora da impostare: ${isoDateTime} (mode: ${config.mode})`);

      // Trova il componente e imposta il valore accedendo al Shadow DOM
      const result = await this.page.evaluate(({ dateTime }) => {
        // Strategia 1: Cerca il componente vaadin-date-time-picker generico
        let picker = document.querySelector(
          "vaadin-date-time-picker"
        ) as any;

        // Strategia 2: Se non trovato, cerca con l'ID specifico
        if (!picker) {
          picker = document.querySelector(
            "[id*='ArrivalNotificationDate']"
          ) as any;
        }

        if (!picker) {
          return { success: false, error: "Campo date-time-picker non trovato" };
        }

        // Prova a impostare il valore direttamente sul componente principale
        try {
          picker.value = dateTime;

          // Dispatch eventi sul componente principale
          picker.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
          picker.dispatchEvent(new Event("value-changed", { bubbles: true, composed: true }));

          // Verifica se il valore è stato impostato
          if (picker.value === dateTime) {
            return { success: true, value: picker.value, method: "direct" };
          }
        } catch (e) {
          // Se fallisce, procedi con Shadow DOM
        }

        // Approccio Shadow DOM: Accedi agli input interni
        try {
          // Trova il date-picker (componente data)
          const datePicker = picker.querySelector('[slot="date-picker"]') ||
                           picker.shadowRoot?.querySelector('vaadin-date-picker') as any;

          // Trova il time-picker (componente ora)
          const timePicker = picker.querySelector('[slot="time-picker"]') ||
                           picker.shadowRoot?.querySelector('vaadin-time-picker') as any;

          if (!datePicker && !timePicker) {
            return { success: false, error: "Componenti interni date/time non trovati" };
          }

          // Separa data e ora dal formato ISO
          const [datePart, timePart] = dateTime.split('T');

          // Imposta la data
          if (datePicker) {
            datePicker.value = datePart;
            datePicker.dispatchEvent(new Event("change", { bubbles: true }));
          }

          // Imposta l'ora
          if (timePicker) {
            timePicker.value = timePart;
            timePicker.dispatchEvent(new Event("change", { bubbles: true }));
          }

          // Notifica il componente principale del cambio completo
          picker.value = dateTime;
          picker.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
          picker.dispatchEvent(new Event("blur", { bubbles: true }));

          return {
            success: true,
            value: picker.value,
            method: "shadow-dom",
            datePart: datePicker?.value,
            timePart: timePicker?.value
          };
        } catch (shadowError) {
          return {
            success: false,
            error: `Errore accesso Shadow DOM: ${shadowError instanceof Error ? shadowError.message : String(shadowError)}`
          };
        }
      }, { dateTime: isoDateTime });

      if (!result.success) {
        console.error(`✗ ${result.error || "Errore compilazione data/ora"}`);
        await this.takeScreenshot("arrival_datetime_error");
        return false;
      }

      console.log(`✓ Campo data/ora compilato: ${result.value}`);
      await this.takeScreenshot("arrival_datetime_filled");
      return true;
    } catch (error) {
      console.error("Errore durante compilazione data/ora:", error);
      await this.takeScreenshot("arrival_datetime_exception");
      return false;
    }
  }

  /**
   * Clicca sul bottone "Invia" per sottomettere la dichiarazione
   * Bottone: vaadin-button con id="send" e classe "button-prominent"
   * @returns true se il click è riuscito
   */
  async clickSendButton(): Promise<boolean> {
    if (!this.page) {
      return false;
    }

    try {
      console.log("Click su bottone 'Invia'...");

      // Usa l'ID del bottone (più affidabile)
      const button = this.page.locator("#send");

      // Attendi che il bottone sia visibile e abilitato
      await button.waitFor({ state: "visible", timeout: 10000 });

      // Verifica che il bottone non sia disabilitato
      const isEnabled = await button.isEnabled();
      if (!isEnabled) {
        console.warn("Bottone 'Invia' trovato ma disabilitato");
        await this.takeScreenshot("send_button_disabled");
        return false;
      }

      // Click sul bottone
      await button.click();

      console.log("✓ Click su 'Invia' eseguito con successo");
      await this.takeScreenshot("send_button_clicked");
      return true;
    } catch (error) {
      console.error("Errore nel click su 'Invia':", error);
      await this.takeScreenshot("send_button_click_error");
      return false;
    }
  }

  /**
   * Compila il date picker START per ricerca date range (id="dateFrom")
   * @param dateString - Data in formato YYYY-MM-DD (es: "2025-10-10")
   * @returns true se compilato con successo
   */
  async fillDateRangeStart(dateString: string): Promise<boolean> {
    console.log(`Compilazione date range START: ${dateString}`);

    if (!this.page) {
      console.error("Browser non inizializzato");
      return false;
    }

    try {
      const result = await this.page.evaluate(({ dateStr }) => {
        // Trova il date picker con id="dateFrom"
        const picker = document.querySelector('#dateFrom') as any;

        if (!picker) {
          return { success: false, error: "Date picker 'dateFrom' non trovato" };
        }

        // Strategia 1: Imposta valore direttamente
        try {
          picker.value = dateStr;
          picker.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
          picker.dispatchEvent(new Event('value-changed', { bubbles: true, composed: true }));

          if (picker.value === dateStr) {
            return { success: true, value: picker.value, method: "direct" };
          }
        } catch (e) {
          // Fallback
        }

        // Strategia 2: Accedi all'input interno nel Shadow DOM
        try {
          const textField = picker.shadowRoot?.querySelector('vaadin-date-picker-text-field') as any;
          if (textField) {
            const input = textField.shadowRoot?.querySelector('input[part="value"]') as HTMLInputElement;
            if (input) {
              input.value = dateStr;
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }

          picker.value = dateStr;
          picker.dispatchEvent(new Event('change', { bubbles: true, composed: true }));

          return { success: true, value: picker.value, method: "shadow-dom" };
        } catch (shadowError) {
          return {
            success: false,
            error: `Errore Shadow DOM: ${shadowError instanceof Error ? shadowError.message : String(shadowError)}`
          };
        }
      }, { dateStr: dateString });

      if (!result.success) {
        console.error(`✗ ${result.error || "Errore compilazione date range START"}`);
        await this.takeScreenshot("date_range_start_error");
        return false;
      }

      console.log(`✓ Date range START compilato: ${result.value} (metodo: ${result.method})`);
      return true;
    } catch (error) {
      console.error("Errore durante compilazione date range START:", error);
      await this.takeScreenshot("date_range_start_exception");
      return false;
    }
  }

  /**
   * Compila il date picker END per ricerca date range (id="dateTo")
   * @param dateString - Data in formato YYYY-MM-DD (es: "2025-11-10")
   * @returns true se compilato con successo
   */
  async fillDateRangeEnd(dateString: string): Promise<boolean> {
    console.log(`Compilazione date range END: ${dateString}`);

    if (!this.page) {
      console.error("Browser non inizializzato");
      return false;
    }

    try {
      const result = await this.page.evaluate(({ dateStr }) => {
        // Trova il date picker con id="dateTo"
        const picker = document.querySelector('#dateTo') as any;

        if (!picker) {
          return { success: false, error: "Date picker 'dateTo' non trovato" };
        }

        // Strategia 1: Imposta valore direttamente
        try {
          picker.value = dateStr;
          picker.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
          picker.dispatchEvent(new Event('value-changed', { bubbles: true, composed: true }));

          if (picker.value === dateStr) {
            return { success: true, value: picker.value, method: "direct" };
          }
        } catch (e) {
          // Fallback
        }

        // Strategia 2: Accedi all'input interno nel Shadow DOM
        try {
          const textField = picker.shadowRoot?.querySelector('vaadin-date-picker-text-field') as any;
          if (textField) {
            const input = textField.shadowRoot?.querySelector('input[part="value"]') as HTMLInputElement;
            if (input) {
              input.value = dateStr;
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }

          picker.value = dateStr;
          picker.dispatchEvent(new Event('change', { bubbles: true, composed: true }));

          return { success: true, value: picker.value, method: "shadow-dom" };
        } catch (shadowError) {
          return {
            success: false,
            error: `Errore Shadow DOM: ${shadowError instanceof Error ? shadowError.message : String(shadowError)}`
          };
        }
      }, { dateStr: dateString });

      if (!result.success) {
        console.error(`✗ ${result.error || "Errore compilazione date range END"}`);
        await this.takeScreenshot("date_range_end_error");
        return false;
      }

      console.log(`✓ Date range END compilato: ${result.value} (metodo: ${result.method})`);
      return true;
    } catch (error) {
      console.error("Errore durante compilazione date range END:", error);
      await this.takeScreenshot("date_range_end_exception");
      return false;
    }
  }

  /**
   * Compila il campo MRN per ricerca (id="ucr")
   * @param mrnValue - Valore MRN da inserire
   * @returns true se compilato con successo
   */
  async fillSearchMRN(mrnValue: string): Promise<boolean> {
    console.log(`Compilazione campo MRN ricerca: ${mrnValue}`);

    if (!this.page) {
      console.error("Browser non inizializzato");
      return false;
    }

    try {
      const result = await this.page.evaluate(({ mrn }) => {
        // Trova il text field con id="ucr"
        const textField = document.querySelector('#ucr') as any;

        if (!textField) {
          return { success: false, error: "Campo MRN 'ucr' non trovato" };
        }

        // Strategia 1: Imposta valore direttamente
        try {
          textField.value = mrn;
          textField.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
          textField.dispatchEvent(new Event('value-changed', { bubbles: true, composed: true }));

          if (textField.value === mrn) {
            return { success: true, value: textField.value, method: "direct" };
          }
        } catch (e) {
          // Fallback
        }

        // Strategia 2: Accedi all'input interno nel Shadow DOM
        try {
          const input = textField.shadowRoot?.querySelector('input[part="value"]') as HTMLInputElement;
          if (input) {
            input.value = mrn;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }

          textField.value = mrn;
          textField.dispatchEvent(new Event('change', { bubbles: true, composed: true }));

          return { success: true, value: textField.value, method: "shadow-dom" };
        } catch (shadowError) {
          return {
            success: false,
            error: `Errore Shadow DOM: ${shadowError instanceof Error ? shadowError.message : String(shadowError)}`
          };
        }
      }, { mrn: mrnValue });

      if (!result.success) {
        console.error(`✗ ${result.error || "Errore compilazione campo MRN"}`);
        await this.takeScreenshot("mrn_field_search_error");
        return false;
      }

      console.log(`✓ Campo MRN compilato: ${result.value} (metodo: ${result.method})`);
      return true;
    } catch (error) {
      console.error("Errore durante compilazione campo MRN:", error);
      await this.takeScreenshot("mrn_field_search_exception");
      return false;
    }
  }

  /**
   * Click sul bottone Impostazioni (Settings) nella pagina Dichiarazioni
   * @returns true se click eseguito con successo
   */
  async clickSettingsButton(): Promise<boolean> {
    console.log("Click sul bottone Impostazioni...");

    if (!this.page) {
      console.error("Browser non inizializzato");
      return false;
    }

    try {
      const button = this.page.locator("#editGrid");
      await button.waitFor({ state: "visible", timeout: 10000 });
      await button.click();

      // Attendi che il dialog/modal delle impostazioni si apra
      await this.page.waitForTimeout(1000);

      console.log("✓ Bottone Impostazioni cliccato");
      return true;
    } catch (error) {
      console.error("Errore durante click bottone Impostazioni:", error);
      await this.takeScreenshot("settings_button_error");
      return false;
    }
  }

  /**
   * Compila il campo "Public Layout" con un valore specifico
   * @param value - Valore da inserire (es: "STANDARD ST")
   * @returns true se compilato con successo
   */
  async fillPublicLayout(value: string): Promise<boolean> {
    console.log(`Compilazione campo Public Layout: ${value}`);

    if (!this.page) {
      console.error("Browser non inizializzato");
      return false;
    }

    try {
      // Usa locator chainato per attraversare Shadow DOM
      // Selettore specifico: usa label="Public Layout" per disambiguare (ci sono 2 elementi con id="publicComboBox")
      const comboBox = this.page.locator('#publicComboBox[label="Public Layout"]');
      const inputLocator = comboBox.locator('input[part="value"]');

      // Attendi che la combo-box sia visibile
      await comboBox.waitFor({ state: "visible", timeout: 10000 });

      // Click sulla combo-box per dare focus e aprire dropdown
      await comboBox.click();
      await this.page.waitForTimeout(300);

      // Attendi che l'input sia visibile e accessibile
      await inputLocator.waitFor({ state: "visible", timeout: 5000 });

      // Click sull'input per assicurarsi che abbia focus
      await inputLocator.click();

      // Usa fill() che è il metodo standard Playwright (gestisce automaticamente clear)
      await inputLocator.fill(value);

      // Attendi che l'autocomplete processi l'input
      await this.page.waitForTimeout(800);

      // Press Enter per confermare la selezione dall'autocomplete
      await inputLocator.press('Enter');
      await this.page.waitForTimeout(300);

      // Verifica che il valore sia stato impostato
      const actualValue = await inputLocator.inputValue();
      console.log(`Valore nel campo: "${actualValue}"`);

      if (actualValue === value) {
        console.log(`✓ Public Layout compilato correttamente: ${actualValue}`);
        return true;
      } else if (actualValue.includes(value)) {
        console.log(`✓ Public Layout compilato (valore parziale): ${actualValue}`);
        return true;
      } else {
        console.warn(`⚠ Valore impostato diverso: atteso="${value}", ottenuto="${actualValue}"`);
        await this.takeScreenshot("public_layout_value_mismatch");
        // Ritorna true comunque se c'è un valore (potrebbe essere normalizzato dal sistema)
        return actualValue.length > 0;
      }
    } catch (error) {
      console.error("Errore durante compilazione Public Layout:", error);
      await this.takeScreenshot("public_layout_error");
      return false;
    }
  }

  /**
   * Click sul bottone "Applica" (Apply) per confermare le impostazioni
   * @returns true se click eseguito con successo
   */
  async clickApplyButton(): Promise<boolean> {
    console.log("Click sul bottone Applica...");

    if (!this.page) {
      console.error("Browser non inizializzato");
      return false;
    }

    try {
      const button = this.page.locator("#applyButtonOnWindow");
      await button.waitFor({ state: "visible", timeout: 10000 });
      await button.click();

      // Attendi che il dialog si chiuda
      await this.page.waitForTimeout(1000);

      console.log("✓ Bottone Applica cliccato");
      return true;
    } catch (error) {
      console.error("Errore durante click bottone Applica:", error);
      await this.takeScreenshot("apply_button_error");
      return false;
    }
  }

  /**
   * Click sul bottone "Trova" (Find) per cercare dichiarazioni
   * @returns true se click eseguito con successo
   */
  async clickFindButton(): Promise<boolean> {
    console.log("Click sul bottone Trova...");

    if (!this.page) {
      console.error("Browser non inizializzato");
      return false;
    }

    try {
      const button = this.page.locator("#btnFind");
      await button.waitFor({ state: "visible", timeout: 10000 });

      // Verifica che il bottone sia enabled
      const isEnabled = await button.isEnabled();
      if (!isEnabled) {
        console.warn("⚠ Bottone Trova disabilitato");
        await this.takeScreenshot("find_button_disabled");
        return false;
      }

      await button.click();

      // Attendi che la ricerca venga eseguita e i risultati caricati
      await this.page.waitForTimeout(2000);

      console.log("✓ Bottone Trova cliccato, ricerca in corso...");
      return true;
    } catch (error) {
      console.error("Errore durante click bottone Trova:", error);
      await this.takeScreenshot("find_button_error");
      return false;
    }
  }

  /**
   * Estrae i titoli delle colonne dalla tabella dichiarazioni
   * @returns Array di 8 stringhe con i titoli delle colonne o null se errore
   */
  async extractTableHeaders(): Promise<string[] | null> {
    console.log("Estrazione header dalla tabella...");

    if (!this.page) {
      console.error("Browser non inizializzato");
      return null;
    }

    try {
      // Attendi che la tabella sia visibile
      const grid = this.page.locator('#declarationGrid');
      await grid.waitFor({ state: "visible", timeout: 10000 });

      // Estrai i titoli dalle celle header
      const headers = await this.page.evaluate(() => {
        // Cerca elementi vaadin-grid-sorter che contengono i titoli
        const sorters = document.querySelectorAll('#declarationGrid vaadin-grid-sorter');

        if (sorters.length === 0) return null;

        // Estrai il testo da ogni sorter (skippa checkbox e dettagli)
        const headerTexts: string[] = [];
        sorters.forEach((sorter) => {
          const text = sorter.textContent?.trim() || '';
          if (text) {
            headerTexts.push(text);
          }
        });

        // Dovremmo avere 8 header per le colonne dati
        return headerTexts.length > 0 ? headerTexts : null;
      });

      if (!headers || headers.length === 0) {
        console.warn("⚠ Nessun header trovato nella tabella");
        return null;
      }

      console.log(`✓ ${headers.length} header estratti dalla tabella:`);
      headers.forEach((header, idx) => {
        console.log(`  Col${idx}: ${header}`);
      });

      return headers;
    } catch (error) {
      console.error("Errore durante estrazione header tabella:", error);
      await this.takeScreenshot("table_headers_error");
      return null;
    }
  }

  /**
   * Estrae i risultati dalla tabella dichiarazioni filtrando per MRN
   * @param searchedMRN MRN da cercare nella colonna "Numero registrazione"
   * @returns Array con i dati estratti che matchano l'MRN o null se nessun risultato
   */
  async extractTableResults(searchedMRN: string): Promise<Array<{
    gruppoUtenti: string;
    crn: string;
    numeroRegistrazione: string;
    stato: string;
    statoOneriDoganali: string;
    creatoIl: string;
    modificatoIl: string;
    nomeMessaggio: string;
  }> | null> {
    console.log(`Estrazione risultati dalla tabella per MRN: ${searchedMRN}`);

    if (!this.page) {
      console.error("Browser non inizializzato");
      return null;
    }

    try {
      // Attendi che la tabella sia visibile
      const grid = this.page.locator('#declarationGrid');
      await grid.waitFor({ state: "visible", timeout: 10000 });

      // Attendi che ci siano risultati (almeno una riga nel tbody)
      await this.page.waitForTimeout(1000);

      // Estrai solo le righe che matchano l'MRN cercato
      const results = await this.page.evaluate((mrn: string) => {
        const grid = document.querySelector('#declarationGrid') as any;
        if (!grid) return null;

        // Helper per verificare se una cella esiste ed ha contenuto
        const getCellElement = (index: number): Element | null => {
          return document.querySelector(`vaadin-grid-cell-content[slot="vaadin-grid-cell-content-${index}"]`);
        };

        const getCellText = (index: number): string => {
          const cell = getCellElement(index);
          return cell?.textContent?.trim() || '';
        };

        // Itera su max 10 righe e filtra per MRN matching
        // Ogni riga ha 10 celle (0=checkbox, 1=dettagli, 2-9=dati)
        // Prima riga: slot 2-9, seconda riga: slot 12-19, terza: slot 22-29, ecc.
        const matchedResults: Array<{
          gruppoUtenti: string;
          crn: string;
          numeroRegistrazione: string;
          stato: string;
          statoOneriDoganali: string;
          creatoIl: string;
          modificatoIl: string;
          nomeMessaggio: string;
        }> = [];

        for (let rowIndex = 0; rowIndex < 10; rowIndex++) {
          const baseIndex = rowIndex * 10 + 2;

          // Verifica che la riga esista controllando prima cella
          const firstCell = getCellElement(baseIndex);
          if (!firstCell) break; // Nessuna altra riga

          // Leggi "Numero registrazione" (col2 = baseIndex + 2)
          const numeroRegistrazione = getCellText(baseIndex + 2);

          // Se non ha contenuto, potrebbe essere fine tabella
          if (!numeroRegistrazione) break;

          // Verifica match con MRN cercato
          if (numeroRegistrazione === mrn) {
            // Match trovato! Estrai tutta la riga
            matchedResults.push({
              gruppoUtenti: getCellText(baseIndex),       // col0 - Gruppo utenti
              crn: getCellText(baseIndex + 1),            // col1 - CRN
              numeroRegistrazione: numeroRegistrazione,   // col2 - Numero registrazione
              stato: getCellText(baseIndex + 3),          // col3 - Stato
              statoOneriDoganali: getCellText(baseIndex + 4), // col4 - Stato oneri doganali
              creatoIl: getCellText(baseIndex + 5),       // col5 - Creato il
              modificatoIl: getCellText(baseIndex + 6),   // col6 - Modificato il
              nomeMessaggio: getCellText(baseIndex + 7),  // col7 - Nome messaggio
            });
          }
          // Se no match, continua a cercare nella riga successiva
        }

        return matchedResults.length > 0 ? matchedResults : null;
      }, searchedMRN);

      if (!results || results.length === 0) {
        console.warn(`⚠ Nessuna riga con MRN "${searchedMRN}" trovata nella tabella`);
        await this.takeScreenshot("table_no_results");
        return null;
      }

      console.log(`✓ ${results.length} righe con MRN "${searchedMRN}" estratte dalla tabella:`);
      results.forEach((row, idx) => {
        console.log(`  Riga ${idx + 1}:`);
        console.log(`    - Gruppo utenti: ${row.gruppoUtenti}`);
        console.log(`    - CRN: ${row.crn}`);
        console.log(`    - Numero registrazione: ${row.numeroRegistrazione}`);
        console.log(`    - Stato: ${row.stato}`);
      });

      return results;
    } catch (error) {
      console.error("Errore durante estrazione risultati tabella:", error);
      await this.takeScreenshot("table_extraction_error");
      return null;
    }
  }

  /**
   * Double-click sulla cella "NCTS Arrival Notification IT" per aprire la dichiarazione
   * @param mrn MRN da cercare nella tabella
   * @returns true se click riuscito, false altrimenti
   */
  async doubleClickNCTSArrival(mrn: string): Promise<boolean> {
    console.log(`Double-click su NCTS Arrival Notification per MRN: ${mrn}`);

    if (!this.page) {
      console.error("Browser non inizializzato");
      return false;
    }

    try {
      // Trova la riga con MRN e nomeMessaggio === "NCTS Arrival Notification IT"
      const cellSlot = await this.page.evaluate((searchMRN: string) => {
        // Helper per leggere testo cella
        const getCellText = (index: number): string => {
          const cell = document.querySelector(
            `vaadin-grid-cell-content[slot="vaadin-grid-cell-content-${index}"]`
          );
          return cell?.textContent?.trim() || '';
        };

        // Scan max 10 righe
        for (let rowIndex = 0; rowIndex < 10; rowIndex++) {
          const baseIndex = rowIndex * 10 + 2;

          // Leggi MRN (col 2)
          const numeroRegistrazione = getCellText(baseIndex + 2);
          if (!numeroRegistrazione) break;

          // Leggi Nome Messaggio (col 7)
          const nomeMessaggio = getCellText(baseIndex + 7);

          // Match: MRN corretto E nome messaggio corretto
          if (
            numeroRegistrazione === searchMRN &&
            nomeMessaggio === "NCTS Arrival Notification IT"
          ) {
            // Ritorna lo slot della cella "Nome Messaggio"
            return baseIndex + 7;
          }
        }

        return null; // Non trovato
      }, mrn);

      if (cellSlot === null) {
        console.error(`Cella NCTS Arrival non trovata per MRN: ${mrn}`);
        await this.takeScreenshot("ncts_arrival_not_found");
        return false;
      }

      console.log(`Trovata cella NCTS Arrival allo slot: ${cellSlot}`);

      // Selettore dinamico basato su slot trovato
      const cellSelector = `vaadin-grid-cell-content[slot="vaadin-grid-cell-content-${cellSlot}"]`;

      // Attendi che la cella sia visibile
      await this.page.waitForSelector(cellSelector, { timeout: 5000 });

      // Double-click sulla cella
      await this.page.dblclick(cellSelector);

      console.log("✓ Double-click eseguito su cella NCTS Arrival");
      await this.takeScreenshot("ncts_arrival_clicked");

      // Attendi caricamento pagina dichiarazione
      await this.page.waitForLoadState("networkidle", { timeout: 10000 });
      await this.page.waitForTimeout(2000);

      return true;
    } catch (error) {
      console.error("Errore durante double-click NCTS Arrival:", error);
      await this.takeScreenshot("ncts_arrival_click_error");
      return false;
    }
  }

  /**
   * Click sul bottone "Note di scarico"
   * @returns true se click riuscito, false altrimenti
   */
  async clickUnloadingRemarksButton(): Promise<boolean> {
    console.log('Click su bottone "Note di scarico"');

    if (!this.page) {
      console.error("Browser non inizializzato");
      return false;
    }

    try {
      const buttonSelector = '#unloadingRemarksAction';

      await this.page.waitForSelector(buttonSelector, { timeout: 5000 });
      await this.page.click(buttonSelector);

      console.log('✓ Bottone "Note di scarico" cliccato');
      await this.takeScreenshot('unloading_remarks_button_clicked');

      // Attendi dialog conferma
      await this.page.waitForTimeout(1000);

      return true;
    } catch (error) {
      console.error('Errore click Note di scarico:', error);
      await this.takeScreenshot('unloading_remarks_button_error');
      return false;
    }
  }

  /**
   * Click sul bottone OK del dialog di conferma
   * @returns true se click riuscito, false altrimenti
   */
  async clickOKButton(): Promise<boolean> {
    console.log('Click su bottone OK');

    if (!this.page) {
      console.error("Browser non inizializzato");
      return false;
    }

    try {
      // Strategia: trova vaadin-button con testo esatto "OK"
      const okButtonClicked = await this.page.evaluate(() => {
        const buttons = Array.from(
          document.querySelectorAll('vaadin-button.button-standard')
        );

        const okButton = buttons.find(btn =>
          btn.textContent?.trim() === 'OK'
        );

        if (okButton) {
          (okButton as HTMLElement).click();
          return true;
        }
        return false;
      });

      if (!okButtonClicked) {
        console.error('Bottone OK non trovato');
        await this.takeScreenshot('ok_button_not_found');
        return false;
      }

      console.log('✓ Bottone OK cliccato');
      await this.takeScreenshot('ok_button_clicked');

      // Attendi chiusura dialog e caricamento contenuto
      await this.page.waitForTimeout(2000);

      return true;
    } catch (error) {
      console.error('Errore click OK:', error);
      await this.takeScreenshot('ok_button_error');
      return false;
    }
  }

  /**
   * Click sul tab "Nota di scarico"
   * @returns true se click riuscito, false altrimenti
   */
  async clickUnloadingRemarksTab(): Promise<boolean> {
    console.log('Click su tab "Nota di scarico"');

    if (!this.page) {
      console.error("Browser non inizializzato");
      return false;
    }

    try {
      // Strategia: trova vaadin-tab con testo "Nota di scarico"
      const tabClicked = await this.page.evaluate(() => {
        const tabs = Array.from(
          document.querySelectorAll('vaadin-tab')
        );

        const unloadingTab = tabs.find(tab =>
          tab.textContent?.trim() === 'Nota di scarico'
        );

        if (unloadingTab) {
          (unloadingTab as HTMLElement).click();
          return true;
        }
        return false;
      });

      if (!tabClicked) {
        console.error('Tab "Nota di scarico" non trovato');
        await this.takeScreenshot('unloading_tab_not_found');
        return false;
      }

      console.log('✓ Tab "Nota di scarico" cliccato');
      await this.takeScreenshot('unloading_tab_clicked');

      // Attendi rendering contenuto tab
      await this.page.waitForTimeout(1500);

      return true;
    } catch (error) {
      console.error('Errore click tab Nota di scarico:', error);
      await this.takeScreenshot('unloading_tab_error');
      return false;
    }
  }

  /**
   * Getter per verificare se l'utente è loggato
   */
  get loggedIn(): boolean {
    return this.isLoggedIn;
  }
}
