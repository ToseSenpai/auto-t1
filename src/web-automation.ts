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
      // Passa direttamente il valore senza escape (page.evaluate gestisce serializzazione)
      await this.page.evaluate(
        ({ sel, val }) => {
          const element = document.querySelector(sel) as any;
          if (element) {
            element.value = val;
            element.dispatchEvent(new Event("input", { bubbles: true }));
            element.dispatchEvent(new Event("change", { bubbles: true }));
          }
        },
        { sel: selector, val: value }
      );

      console.log(`Campo Vaadin '${selector}' compilato`);
      return true;
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

      // Se il sito usa Vaadin, usa il metodo specifico
      if (Config.USE_VAADIN) {
        await this.fillVaadinField(usernameSelector, this.username);
        await this.fillVaadinField(passwordSelector, this.password);
      } else {
        await this.page.fill(usernameSelector, this.username);
        await this.page.fill(passwordSelector, this.password);
      }

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
   * Ottiene l'URL corrente della pagina
   */
  getCurrentUrl(): string {
    if (!this.page) {
      return "about:blank";
    }
    return this.page.url();
  }

  /**
   * Getter per verificare se l'utente è loggato
   */
  get loggedIn(): boolean {
    return this.isLoggedIn;
  }
}
