/**
 * Configurazione centralizzata per l'automazione web
 */

export interface Selectors {
  login: {
    username_field: string;
    password_field: string;
    submit_button: string;
  };
  main_page: Record<string, string>;
}

export interface BrowserConfig {
  headless: boolean;
  slowMo: number;
  viewport: {
    width: number;
    height: number;
  };
}

export interface Timeouts {
  default: number;
  navigation: number;
  short: number;
}

export interface Paths {
  excelInput: string;
  logs: string;
  screenshots: string;
}

export interface ExcelConfig {
  sheetName: string;
  headerRow: number;
  dataStartRow: number;
  columns: {
    input: Record<string, string>;
    output: Record<string, string>;
  };
}

export class Config {
  // URL del sito web da automatizzare
  static readonly BASE_URL = "https://app.customs.blujaysolutions.net";
  static readonly LOGIN_URL = "https://app.customs.blujaysolutions.net";

  // Selettori CSS per il login (sito Vaadin con Shadow DOM)
  static readonly SELECTORS: Selectors = {
    login: {
      username_field: "#txtUsername",
      password_field: "#pwdPassword",
      submit_button: "#btnLogin",
    },
    main_page: {
      // Aggiungi qui altri selettori per le varie operazioni
      // Esempio: input_field: '#some-id',
    },
  };

  // Flag per indicare che il sito usa componenti Vaadin (Shadow DOM)
  static readonly USE_VAADIN = true;

  // Timeout e ritardi (in millisecondi)
  static readonly TIMEOUTS: Timeouts = {
    default: 30000, // 30 secondi
    navigation: 60000, // 60 secondi per navigazione
    short: 5000, // 5 secondi per azioni rapide
  };

  // Configurazione browser Playwright
  static readonly BROWSER_CONFIG: BrowserConfig = {
    headless: false, // false = browser visibile in finestra separata (per sviluppo)
    slowMo: 500, // 500ms di rallentamento per vedere le azioni in tempo reale
    viewport: {
      width: 1280,
      height: 720,
    },
  };

  // Percorsi file
  static readonly PATHS: Paths = {
    excelInput: "data/input.xlsx", // File Excel di input
    logs: "logs/",
    screenshots: "logs/screenshots/",
  };

  // Configurazione Excel
  static readonly EXCEL_CONFIG: ExcelConfig = {
    sheetName: "Sheet1", // Nome del foglio da leggere
    headerRow: 1, // Riga con intestazioni (1-based)
    dataStartRow: 2, // Prima riga con dati (1-based)
    columns: {
      input: {
        // Esempio: nome: 'A',
        // Esempio: cognome: 'B',
      },
      output: {
        // Esempio: risultato: 'C',
      },
    },
  };

  /**
   * Ottiene un selettore CSS dalla configurazione
   */
  static getSelector(category: keyof Selectors, key: string): string {
    const selectors = this.SELECTORS[category];
    if (typeof selectors === "object" && key in selectors) {
      return selectors[key as keyof typeof selectors];
    }
    return "";
  }

  /**
   * Ottiene un timeout dalla configurazione
   */
  static getTimeout(key: keyof Timeouts = "default"): number {
    return this.TIMEOUTS[key] ?? this.TIMEOUTS.default;
  }
}
