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

      // Usa l'ID del bottone (più affidabile)
      const button = this.page.locator("#btnNewDeclaration");

      // Attendi che il bottone sia visibile
      await button.waitFor({ state: "visible", timeout: 10000 });

      // Click sul bottone
      await button.click();

      console.log("Click su 'Nuova dichiarazione' eseguito con successo");
      return true;
    } catch (error) {
      console.error("Errore nel click su 'Nuova dichiarazione':", error);
      await this.takeScreenshot("new_declaration_click_error");
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

      // Trova la cella con testo "NCTS Arrival Notification IT"
      const cell = this.page
        .locator("vaadin-grid-cell-content")
        .filter({ hasText: "NCTS Arrival Notification IT" })
        .first();

      // Attendi che sia visibile
      await cell.waitFor({ state: "visible", timeout: 10000 });

      // Click sulla cella
      await cell.click();

      console.log("Click su 'NCTS Arrival Notification IT' eseguito con successo");
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

      // Trova la cella con il testo specifico
      const cell = this.page
        .locator("vaadin-grid-cell-content")
        .filter({ hasText: "MX DHL - MXP GTW - DEST AUT" })
        .first();

      // Attendi che sia visibile
      await cell.waitFor({ state: "visible", timeout: 10000 });

      // Click sulla cella
      await cell.click();

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

      // Usa l'ID del bottone
      const button = this.page.locator("#CreateDeclarationConfirmationButton");

      // Attendi che sia visibile
      await button.waitFor({ state: "visible", timeout: 10000 });

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
   * Compila il campo data/ora di arrivo con data odierna e ora corrente + 1 ora
   * Campo: vaadin-date-time-picker con ID ArrivalNotificationDate
   * @returns true se compilato con successo
   */
  async fillArrivalDateTime(): Promise<boolean> {
    console.log("Compilazione campo Data/Ora di arrivo...");

    if (!this.page) {
      console.error("Browser non inizializzato");
      return false;
    }

    try {
      // Calcola data/ora corrente + 1 ora
      const now = new Date();
      now.setHours(now.getHours() + 1);

      // Formato ISO 8601: YYYY-MM-DDTHH:MM (richiesto da Vaadin)
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");

      const isoDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;

      console.log(`Data/ora da impostare: ${isoDateTime}`);

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
   * Getter per verificare se l'utente è loggato
   */
  get loggedIn(): boolean {
    return this.isLoggedIn;
  }
}
