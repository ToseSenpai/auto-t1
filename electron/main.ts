/**
 * Electron Main Process
 * Processo principale che gestisce finestra, browser view e comunicazione IPC
 */

const { app, BrowserWindow, ipcMain, dialog, Menu } = require("electron");
const { join, basename } = require("path");
const { autoUpdater } = require("electron-updater");

import { WebAutomation } from "../src/web-automation";
import { ExcelHandler } from "../src/excel-handler";
import type { RowData } from "../src/excel-handler";
import type { BrowserWindow as BrowserWindowType } from "electron";
import type { DateTimeConfig } from "./preload";

let mainWindow: BrowserWindowType | null = null;
let splashWindow: BrowserWindowType | null = null;
let webAutomation: WebAutomation | null = null;
let excelHandler: ExcelHandler | null = null;

const isDev = process.env.NODE_ENV === "development";

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 500,
    height: 320, // Increased from 200 to fit all content (logo + bar + text)
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    center: true,
    backgroundColor: "#0a0c0f", // Dark-950 matching splash screen gradient
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  splashWindow!.loadFile(join(__dirname, "../splash.html"));

  // Previeni che la splash rimanga aperta se qualcosa va storto
  splashWindow!.on("closed", () => {
    splashWindow = null;
  });
}

function createWindow() {
  // Crea la finestra principale (nascosta inizialmente)
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false, // Non mostrare finché non è pronta
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true, // Abilita <webview> tag in React
    },
    title: "Auto-T1 - Automazione Web",
    backgroundColor: "#1f2937",
    icon: join(__dirname, "../resources/icon.ico"),
  });

  // Rimuovi la barra del menu (File, Edit, View, Window, Help)
  Menu.setApplicationMenu(null);

  // Carica l'app React
  if (isDev) {
    mainWindow!.loadURL("http://localhost:5173");
  } else {
    mainWindow!.loadFile(join(__dirname, "../dist/index.html"));
  }

  // Pattern robusto per splash screen (da ControlloStatoNSIS)
  let windowShown = false;

  mainWindow!.once("ready-to-show", () => {
    console.log("[MAIN] Main window ready-to-show event fired");
    windowShown = true;

    // Splash minima 5 secondi garantiti per UX fluida
    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
        splashWindow = null;
      }
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.focus();

        // DevTools disabilitati per UI pulita - usa Ctrl+Shift+I se necessario
        // if (isDev) {
        //   mainWindow.webContents.openDevTools();
        // }
      }
    }, 5000); // 5 secondi minimi splash
  });

  // FALLBACK: forza visualizzazione dopo 10 secondi se ready-to-show non fire
  setTimeout(() => {
    if (!windowShown && mainWindow && !mainWindow.isDestroyed()) {
      console.warn(
        "[MAIN] WARNING: ready-to-show timeout - forcing window show"
      );
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
        splashWindow = null;
      }
      mainWindow.show();
      mainWindow.focus();

      // DevTools disabilitati per UI pulita - usa Ctrl+Shift+I se necessario
      // if (isDev) {
      //   mainWindow.webContents.openDevTools();
      // }
    }
  }, 10000); // 10 secondi fallback

  mainWindow!.on("closed", () => {
    mainWindow = null;
  });
}

// Handler IPC per comunicazione con React
function setupIPCHandlers() {
  ipcMain.handle("automation:start", async (_: any, data: any) => {
  try {
    const { username, password, excelPath, dateTimeConfig } = data;

    // Emit part-changed event - Parte 1 in esecuzione
    mainWindow?.webContents.send("automation:part-changed", { part: 1 });

    // Inizializza automazione
    webAutomation = new WebAutomation(username, password);
    excelHandler = new ExcelHandler(excelPath);

    // Carica Excel
    const excelLoaded = await excelHandler.load(false);
    if (!excelLoaded) {
      return { success: false, error: "File Excel non trovato o non caricabile" };
    }

    // Leggi valori MRN dalla colonna A
    let mrnValues: string[] = [];
    try {
      mrnValues = excelHandler.readMRNColumn();
      if (mrnValues.length === 0) {
        return {
          success: false,
          error: "Nessun valore MRN trovato nella colonna A del file Excel",
        };
      }
      console.log(`Trovati ${mrnValues.length} valori MRN da processare`);
    } catch (error) {
      return {
        success: false,
        error: `Errore lettura colonna MRN: ${
          error instanceof Error ? error.message : "Errore sconosciuto"
        }`,
      };
    }

    // Avvia browser
    const browserStarted = await webAutomation.startBrowser();
    if (!browserStarted) {
      return { success: false, error: "Errore avvio browser" };
    }

    // Nota: Playwright è in modalità headless
    // Il webview in React mostrerà about:blank fino a quando l'automazione carica una pagina

    // Emit initializing step
    mainWindow?.webContents.send("automation:mrn-step", {
      step: "initializing",
      message: "Inizializzazione automazione...",
    });

    // Emit logging-in step
    mainWindow?.webContents.send("automation:mrn-step", {
      step: "logging-in",
      message: "Login in corso...",
    });

    // Login
    const loginSuccess = await webAutomation.login();
    if (!loginSuccess) {
      return { success: false, error: "Errore login" };
    }

    // Invia evento di successo
    mainWindow?.webContents.send("automation:status", {
      type: "info",
      message: "Login completato con successo",
    });

    // Emit navigating step
    mainWindow?.webContents.send("automation:mrn-step", {
      step: "navigating",
      message: "Navigazione a Dichiarazioni...",
    });

    // Naviga a Dichiarazioni dopo il login
    mainWindow?.webContents.send("automation:status", {
      type: "info",
      message: "Navigazione a Dichiarazioni...",
    });

    const navSuccess = await webAutomation.navigateToDeclarations();
    if (!navSuccess) {
      return { success: false, error: "Impossibile navigare a Dichiarazioni" };
    }

    mainWindow?.webContents.send("automation:status", {
      type: "success",
      message: "Navigato a Dichiarazioni con successo",
    });

    // Emit creating-declaration step
    mainWindow?.webContents.send("automation:mrn-step", {
      step: "creating-declaration",
      message: "Click su 'Nuova dichiarazione'...",
    });

    // Click su "Nuova dichiarazione"
    mainWindow?.webContents.send("automation:status", {
      type: "info",
      message: "Click su 'Nuova dichiarazione'...",
    });

    const clickSuccess = await webAutomation.clickNewDeclaration();
    if (!clickSuccess) {
      return {
        success: false,
        error: "Impossibile cliccare su 'Nuova dichiarazione'",
      };
    }

    mainWindow?.webContents.send("automation:status", {
      type: "success",
      message: "Click su 'Nuova dichiarazione' completato",
    });

    // INIZIO LOOP: Processa ogni MRN dal file Excel
    const totalMRNs = mrnValues.length;
    mainWindow?.webContents.send("automation:status", {
      type: "info",
      message: `Trovati ${totalMRNs} MRN da processare`,
    });

    for (let mrnIndex = 0; mrnIndex < totalMRNs; mrnIndex++) {
      const currentMRN = mrnValues[mrnIndex];
      const mrnProgress = `[${mrnIndex + 1}/${totalMRNs}]`;

      // Emit MRN start event
      mainWindow?.webContents.send("automation:mrn-start", {
        mrn: currentMRN,
        index: mrnIndex + 1,
        total: totalMRNs,
      });

      mainWindow?.webContents.send("automation:status", {
        type: "info",
        message: `${mrnProgress} Inizio elaborazione MRN: ${currentMRN}`,
      });

      // Emit selecting-ncts step
      mainWindow?.webContents.send("automation:mrn-step", {
        step: "selecting-ncts",
        message: "Selezione NCTS...",
      });

      // Click su NCTS Arrival Notification IT (step 1)
      mainWindow?.webContents.send("automation:status", {
        type: "info",
        message: `${mrnProgress} Click su 'NCTS Arrival Notification IT'...`,
      });

      const nctsSuccess = await webAutomation.clickNCTS();
      if (!nctsSuccess) {
        return { success: false, error: `${mrnProgress} Impossibile cliccare su 'NCTS Arrival Notification IT'` };
      }

      mainWindow?.webContents.send("automation:status", {
        type: "success",
        message: `${mrnProgress} Click su 'NCTS Arrival Notification IT' completato`,
      });

      // Delay per rallentare la macro
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Emit selecting-mxdhl step
      mainWindow?.webContents.send("automation:mrn-step", {
        step: "selecting-mxdhl",
        message: "Selezione MX DHL...",
      });

      // Click su MX DHL (step 2)
      mainWindow?.webContents.send("automation:status", {
        type: "info",
        message: `${mrnProgress} Click su 'MX DHL - MXP GTW - DEST AUT'...`,
      });

      const mxdhlSuccess = await webAutomation.clickMXDHL();
      if (!mxdhlSuccess) {
        return {
          success: false,
          error: `${mrnProgress} Impossibile cliccare su 'MX DHL - MXP GTW - DEST AUT'`,
        };
      }

      mainWindow?.webContents.send("automation:status", {
        type: "success",
        message: `${mrnProgress} Click su 'MX DHL - MXP GTW - DEST AUT' completato`,
      });

      // Delay per rallentare la macro
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Emit confirming step
      mainWindow?.webContents.send("automation:mrn-step", {
        step: "confirming",
        message: "Conferma selezione...",
      });

      // Click su OK conferma (step 3)
      mainWindow?.webContents.send("automation:status", {
        type: "info",
        message: `${mrnProgress} Click su 'OK' conferma...`,
      });

      const okSuccess = await webAutomation.clickConfirmationOK();
      if (!okSuccess) {
        return { success: false, error: `${mrnProgress} Impossibile cliccare su 'OK' conferma` };
      }

      mainWindow?.webContents.send("automation:status", {
        type: "success",
        message: `${mrnProgress} Click su 'OK' conferma completato`,
      });

      // Delay per rallentare la macro
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Emit loading-page step
      mainWindow?.webContents.send("automation:mrn-step", {
        step: "loading-page",
        message: "Caricamento pagina...",
      });

      // Attendi caricamento nuova pagina (step 4)
      mainWindow?.webContents.send("automation:status", {
        type: "info",
        message: `${mrnProgress} Attendendo caricamento nuova pagina...`,
      });

      const pageLoaded = await webAutomation.waitForPageLoad();
      if (!pageLoaded) {
        return {
          success: false,
          error: `${mrnProgress} Timeout caricamento pagina dichiarazione`,
        };
      }

      mainWindow?.webContents.send("automation:status", {
        type: "success",
        message: `${mrnProgress} Nuova pagina caricata con successo`,
      });

      // Delay per rallentare la macro
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Emit filling-mrn step
      mainWindow?.webContents.send("automation:mrn-step", {
        step: "filling-mrn",
        message: "Compilazione MRN...",
      });

      // Compila campo MRN (step 5)
      mainWindow?.webContents.send("automation:status", {
        type: "info",
        message: `${mrnProgress} Compilazione campo MRN: ${currentMRN}`,
      });

      const mrnSuccess = await webAutomation.fillMRNField(currentMRN);
      if (!mrnSuccess) {
        return {
          success: false,
          error: `${mrnProgress} Impossibile compilare campo MRN: ${currentMRN}`,
        };
      }

      mainWindow?.webContents.send("automation:status", {
        type: "success",
        message: `${mrnProgress} Campo MRN compilato: ${currentMRN}`,
      });

      // Delay per rallentare la macro
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Emit verifying-sede step
      mainWindow?.webContents.send("automation:mrn-step", {
        step: "verifying-sede",
        message: "Verifica sede destinazione...",
      });

      // Verifica campo Sede di destinazione (step 6)
      mainWindow?.webContents.send("automation:status", {
        type: "info",
        message: `${mrnProgress} Verifica campo Sede di destinazione...`,
      });

      const sedeVerification = await webAutomation.verifySedeDestinazione();
      if (!sedeVerification.success) {
        return {
          success: false,
          error: `${mrnProgress} Attenzione: Sede di destinazione diversa da IT279100. ${sedeVerification.error || "Trovato: " + sedeVerification.actualValue}`,
        };
      }

      mainWindow?.webContents.send("automation:status", {
        type: "success",
        message: `${mrnProgress} Sede di destinazione verificata: ${sedeVerification.actualValue}`,
      });

      // Delay per rallentare la macro
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Emit filling-datetime step
      mainWindow?.webContents.send("automation:mrn-step", {
        step: "filling-datetime",
        message: "Compilazione data/ora...",
      });

      // Compila campo Data/Ora di arrivo (step 7)
      mainWindow?.webContents.send("automation:status", {
        type: "info",
        message: `${mrnProgress} Compilazione campo Data/Ora di arrivo...`,
      });

      const dateTimeSuccess = await webAutomation.fillArrivalDateTime(dateTimeConfig);
      if (!dateTimeSuccess) {
        return {
          success: false,
          error: `${mrnProgress} Impossibile compilare campo Data/Ora di arrivo`,
        };
      }

      mainWindow?.webContents.send("automation:status", {
        type: "success",
        message: `${mrnProgress} Campo Data/Ora di arrivo compilato`,
      });

      // Delay per rallentare la macro
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Emit sending step
      mainWindow?.webContents.send("automation:mrn-step", {
        step: "sending",
        message: "Invio dichiarazione...",
      });

      // Clicca su bottone "Invia" (step 8)
      mainWindow?.webContents.send("automation:status", {
        type: "info",
        message: `${mrnProgress} Click su bottone 'Invia'...`,
      });

      const sendSuccess = await webAutomation.clickSendButton();
      if (!sendSuccess) {
        return {
          success: false,
          error: `${mrnProgress} Impossibile cliccare su bottone 'Invia'`,
        };
      }

      mainWindow?.webContents.send("automation:status", {
        type: "success",
        message: `${mrnProgress} Dichiarazione inviata con successo per MRN: ${currentMRN}`,
      });

      // Emit MRN complete event
      mainWindow?.webContents.send("automation:mrn-complete", {
        mrn: currentMRN,
        success: true,
      });

      // Delay per rallentare la macro
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Se non è l'ultimo MRN, torna a "Nuova dichiarazione" per il prossimo
      if (mrnIndex < totalMRNs - 1) {
        mainWindow?.webContents.send("automation:status", {
          type: "info",
          message: `${mrnProgress} Preparazione per prossimo MRN...`,
        });

        // Attendi che la pagina torni a /cm/declarations dopo l'invio
        await new Promise(resolve => setTimeout(resolve, 2000));

        // ✅ FIX BUG: Navigazione forzata invece di click bottone
        // Usa page.goto() per evitare race conditions e garantire grid popolata
        const newDeclSuccess = await webAutomation.navigateToNewDeclaration();
        if (!newDeclSuccess) {
          return {
            success: false,
            error: `${mrnProgress} Impossibile navigare a pagina nuova dichiarazione per MRN successivo`,
          };
        }

        // Attendi extra dopo navigazione (che già attende internamente)
        // Prima che il loop ricominci con clickNCTSArrival()
        await new Promise(resolve => setTimeout(resolve, 3000));

        mainWindow?.webContents.send("automation:status", {
          type: "success",
          message: `${mrnProgress} Pronto per MRN successivo`,
        });
      }
    }
    // FINE LOOP

    mainWindow?.webContents.send("automation:status", {
      type: "success",
      message: `Automazione completata! Processati ${totalMRNs} MRN con successo. Browser rimane aperto per verifica.`,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Errore sconosciuto",
    };
  }
});

// Handler per check MRN posteriori (Parte 2)
ipcMain.handle("automation:check-mrn-range", async (_: any, data: any) => {
  try {
    const { username, password, excelPath } = data;

    // Emit part-changed event - Parte 2 in esecuzione
    mainWindow?.webContents.send("automation:part-changed", { part: 2 });

    mainWindow?.webContents.send("automation:status", {
      type: "info",
      message: "Avvio check MRN posteriori...",
    });

    // Inizializza WebAutomation e ExcelHandler
    webAutomation = new WebAutomation(username, password);
    excelHandler = new ExcelHandler(excelPath);

    // Carica Excel
    const excelLoaded = await excelHandler.load(false);
    if (!excelLoaded) {
      return { success: false, error: "File Excel non trovato o non caricabile" };
    }

    // Avvia browser
    const browserStarted = await webAutomation.startBrowser();
    if (!browserStarted) {
      return { success: false, error: "Impossibile avviare il browser" };
    }

    // Login
    mainWindow?.webContents.send("automation:status", {
      type: "info",
      message: "Login in corso...",
    });

    const loginSuccess = await webAutomation.login();
    if (!loginSuccess) {
      return { success: false, error: "Login fallito" };
    }

    mainWindow?.webContents.send("automation:status", {
      type: "success",
      message: "Login completato",
    });

    // Naviga a pagina Dichiarazioni
    mainWindow?.webContents.send("automation:status", {
      type: "info",
      message: "Navigazione a pagina Dichiarazioni...",
    });

    const navSuccess = await webAutomation.navigateToDeclarations();
    if (!navSuccess) {
      return { success: false, error: "Impossibile navigare a Dichiarazioni" };
    }

    // Configurazione filtri visualizzazione (una tantum)
    mainWindow?.webContents.send("automation:status", {
      type: "info",
      message: "Configurazione filtri visualizzazione...",
    });

    // 1. Click bottone Impostazioni
    const settingsClicked = await webAutomation.clickSettingsButton();
    if (!settingsClicked) {
      return { success: false, error: "Impossibile aprire impostazioni" };
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    // 2. Compila campo "Public Layout" con "STANDARD ST"
    const layoutFilled = await webAutomation.fillPublicLayout("STANDARD ST");
    if (!layoutFilled) {
      return { success: false, error: "Impossibile compilare Public Layout" };
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    // 3. Click bottone Applica
    const applyClicked = await webAutomation.clickApplyButton();
    if (!applyClicked) {
      return { success: false, error: "Impossibile confermare impostazioni" };
    }

    mainWindow?.webContents.send("automation:status", {
      type: "success",
      message: "Filtri configurati correttamente",
    });

    // Attendi che il dialog si chiuda e la pagina si aggiorni
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Calcola date range: oggi - 1 mese → oggi
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    // Formato YYYY-MM-DD per Vaadin date-picker
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);

    mainWindow?.webContents.send("automation:status", {
      type: "info",
      message: `Compilazione date range: ${startDateStr} → ${endDateStr}`,
    });

    // Compila date picker START
    const startFilled = await webAutomation.fillDateRangeStart(startDateStr);
    if (!startFilled) {
      return {
        success: false,
        error: "Impossibile compilare data inizio",
      };
    }

    // Attendi 500ms tra i due date picker
    await new Promise(resolve => setTimeout(resolve, 500));

    // Compila date picker END
    const endFilled = await webAutomation.fillDateRangeEnd(endDateStr);
    if (!endFilled) {
      return {
        success: false,
        error: "Impossibile compilare data fine",
      };
    }

    mainWindow?.webContents.send("automation:status", {
      type: "success",
      message: "Date range compilato con successo",
    });

    // Estrai header dalla tabella e scrivi nella riga 1 dell'Excel
    mainWindow?.webContents.send("automation:status", {
      type: "info",
      message: "Estrazione header tabella...",
    });

    const tableHeaders = await webAutomation.extractTableHeaders();
    if (tableHeaders && tableHeaders.length > 0) {
      // Scrivi "MRN" in A1
      excelHandler.writeCell(1, "A", "MRN");

      // Scrivi i titoli estratti nelle colonne B-I (max 8 colonne)
      const columns = ["B", "C", "D", "E", "F", "G", "H", "I"];
      for (let i = 0; i < Math.min(tableHeaders.length, 8); i++) {
        excelHandler.writeCell(1, columns[i], tableHeaders[i]);
      }

      mainWindow?.webContents.send("automation:status", {
        type: "success",
        message: `✓ Header tabella scritti in Excel (${tableHeaders.length} colonne)`,
      });
    } else {
      // Se non riesce a estrarre header, scrivi header di fallback
      excelHandler.writeCell(1, "A", "MRN");
      excelHandler.writeCell(1, "B", "Gruppo utenti");
      excelHandler.writeCell(1, "C", "CRN");
      excelHandler.writeCell(1, "D", "Numero registrazione");
      excelHandler.writeCell(1, "E", "Stato");
      excelHandler.writeCell(1, "F", "Stato oneri doganali");
      excelHandler.writeCell(1, "G", "Creato il");
      excelHandler.writeCell(1, "H", "Modificato il");
      excelHandler.writeCell(1, "I", "Nome messaggio");

      mainWindow?.webContents.send("automation:status", {
        type: "warning",
        message: "⚠ Impossibile estrarre header, usati header predefiniti",
      });
    }

    // Leggi tutti gli MRN dalla colonna A del file Excel
    let mrnValues: string[];
    try {
      mrnValues = excelHandler.readMRNColumn();
      if (mrnValues.length === 0) {
        return {
          success: false,
          error: "Nessun valore MRN trovato nella colonna A del file Excel",
        };
      }
      console.log(`Trovati ${mrnValues.length} MRN da processare`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Errore lettura MRN da Excel",
      };
    }

    // Inizializza tracking riga Excel e contatori
    let currentExcelRow = 2; // Prima riga dati (row 1 = header)
    let totalResultsWritten = 0;
    const totalMRNs = mrnValues.length;

    mainWindow?.webContents.send("automation:status", {
      type: "info",
      message: `Inizio processing di ${totalMRNs} MRN...`,
    });

    // Loop su tutti gli MRN
    for (let i = 0; i < mrnValues.length; i++) {
      const currentMRN = mrnValues[i];
      const mrnProgress = `[${i + 1}/${totalMRNs}]`;

      mainWindow?.webContents.send("automation:status", {
        type: "info",
        message: `${mrnProgress} Processando MRN: ${currentMRN}`,
      });

      // Compila campo MRN ricerca
      const mrnFilled = await webAutomation.fillSearchMRN(currentMRN);
      if (!mrnFilled) {
        mainWindow?.webContents.send("automation:status", {
          type: "warning",
          message: `${mrnProgress} Impossibile compilare campo MRN, skip...`,
        });
        continue; // Passa al prossimo MRN
      }

      // Click bottone "Trova" per cercare
      const findClicked = await webAutomation.clickFindButton();
      if (!findClicked) {
        mainWindow?.webContents.send("automation:status", {
          type: "warning",
          message: `${mrnProgress} Impossibile cliccare bottone Trova, skip...`,
        });
        continue;
      }

      // Estrai risultati dalla tabella filtrando per MRN
      const tableData = await webAutomation.extractTableResults(currentMRN);

      if (!tableData || tableData.length === 0) {
        mainWindow?.webContents.send("automation:status", {
          type: "warning",
          message: `${mrnProgress} Nessun risultato per MRN ${currentMRN}`,
        });
        // Continua al prossimo MRN
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }

      // Scrivi i dati estratti nelle righe successive
      mainWindow?.webContents.send("automation:status", {
        type: "info",
        message: `${mrnProgress} Scrittura ${tableData.length} risultati per MRN ${currentMRN}...`,
      });

      for (const rowData of tableData) {
        // Scrivi MRN in colonna A
        excelHandler.writeCell(currentExcelRow, "A", currentMRN);

        // Scrivi dati tabella in colonne B-I
        excelHandler.writeRowData(currentExcelRow, rowData);

        currentExcelRow++;
        totalResultsWritten++;
      }

      mainWindow?.webContents.send("automation:status", {
        type: "success",
        message: `${mrnProgress} ✓ ${tableData.length} risultati scritti per MRN ${currentMRN}`,
      });

      // Pausa tra MRN per non sovraccaricare il sistema
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Salva il file Excel UNA VOLTA alla fine
    mainWindow?.webContents.send("automation:status", {
      type: "info",
      message: "Salvataggio file Excel...",
    });

    const saved = await excelHandler.save();
    if (!saved) {
      return {
        success: false,
        error: "Impossibile salvare file Excel con risultati",
      };
    }

    mainWindow?.webContents.send("automation:status", {
      type: "success",
      message: `✓ Completato! ${totalResultsWritten} risultati totali salvati in Excel (${totalMRNs} MRN processati)`,
    });

    return { success: true, count: totalResultsWritten };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Errore sconosciuto",
    };
  }
});

// Handler per Parte 3: Test ricerca MRN (solo ricerca, nessuna estrazione)
ipcMain.handle("automation:part3-search-only", async (_: any, data: any) => {
  try {
    const { username, password, excelPath } = data;

    // Emit part-changed event - Parte 3 in esecuzione
    mainWindow?.webContents.send("automation:part-changed", { part: 3 });

    mainWindow?.webContents.send("automation:status", {
      type: "info",
      message: "Avvio test ricerca MRN (Parte 3)...",
    });

    // Inizializza WebAutomation e ExcelHandler
    webAutomation = new WebAutomation(username, password);
    excelHandler = new ExcelHandler(excelPath);

    // Carica Excel
    const excelLoaded = await excelHandler.load(false);
    if (!excelLoaded) {
      return { success: false, error: "File Excel non trovato o non caricabile" };
    }

    // Leggi colonna MRN
    const mrnValues = excelHandler.readMRNColumn();
    if (mrnValues.length === 0) {
      return { success: false, error: "Nessun MRN trovato nel file Excel (colonna A)" };
    }

    const totalMRNs = mrnValues.length;
    mainWindow?.webContents.send("automation:status", {
      type: "info",
      message: `Trovati ${totalMRNs} MRN da cercare`,
    });

    // Avvia browser
    const browserStarted = await webAutomation.startBrowser();
    if (!browserStarted) {
      return { success: false, error: "Impossibile avviare il browser" };
    }

    // Login
    mainWindow?.webContents.send("automation:status", {
      type: "info",
      message: "Login in corso...",
    });

    const loginSuccess = await webAutomation.login();
    if (!loginSuccess) {
      return { success: false, error: "Login fallito" };
    }

    mainWindow?.webContents.send("automation:status", {
      type: "success",
      message: "Login completato",
    });

    // Naviga a pagina Dichiarazioni
    mainWindow?.webContents.send("automation:status", {
      type: "info",
      message: "Navigazione a pagina Dichiarazioni...",
    });

    const navSuccess = await webAutomation.navigateToDeclarations();
    if (!navSuccess) {
      return { success: false, error: "Impossibile navigare a Dichiarazioni" };
    }

    // Configurazione filtri visualizzazione
    mainWindow?.webContents.send("automation:status", {
      type: "info",
      message: "Configurazione filtri visualizzazione...",
    });

    // 1. Click bottone Impostazioni
    const settingsClicked = await webAutomation.clickSettingsButton();
    if (!settingsClicked) {
      return { success: false, error: "Impossibile aprire impostazioni" };
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    // 2. Compila campo "Public Layout" con "STANDARD ST"
    const layoutFilled = await webAutomation.fillPublicLayout("STANDARD ST");
    if (!layoutFilled) {
      return { success: false, error: "Impossibile compilare Public Layout" };
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    // 3. Click bottone Applica
    const applyClicked = await webAutomation.clickApplyButton();
    if (!applyClicked) {
      return { success: false, error: "Impossibile confermare impostazioni" };
    }

    mainWindow?.webContents.send("automation:status", {
      type: "success",
      message: "Filtri configurati correttamente",
    });

    await new Promise(resolve => setTimeout(resolve, 1500));

    // Calcola date range: oggi - 1 mese → oggi
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);

    mainWindow?.webContents.send("automation:status", {
      type: "info",
      message: `Impostazione range date: ${startDateStr} - ${endDateStr}`,
    });

    // Compila date range
    const dateStartFilled = await webAutomation.fillDateRangeStart(startDateStr);
    if (!dateStartFilled) {
      return { success: false, error: "Impossibile compilare data inizio" };
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    const dateEndFilled = await webAutomation.fillDateRangeEnd(endDateStr);
    if (!dateEndFilled) {
      return { success: false, error: "Impossibile compilare data fine" };
    }

    mainWindow?.webContents.send("automation:status", {
      type: "success",
      message: "Date configurate correttamente",
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    // Loop ricerca MRN (SENZA estrazione risultati)
    let processedCount = 0;

    for (let mrnIndex = 0; mrnIndex < totalMRNs; mrnIndex++) {
      const currentMRN = mrnValues[mrnIndex];

      mainWindow?.webContents.send("automation:status", {
        type: "info",
        message: `Ricerca MRN ${mrnIndex + 1}/${totalMRNs}: ${currentMRN}`,
      });

      // Aggiorna progresso
      mainWindow?.webContents.send("automation:progress", {
        current: mrnIndex + 1,
        total: totalMRNs,
      });

      // Compila campo ricerca MRN
      const mrnFilled = await webAutomation.fillSearchMRN(currentMRN);
      if (!mrnFilled) {
        mainWindow?.webContents.send("automation:status", {
          type: "warning",
          message: `Impossibile compilare campo MRN per: ${currentMRN}`,
        });
        continue;
      }

      await new Promise(resolve => setTimeout(resolve, 300));

      // Click bottone "Trova"
      const findClicked = await webAutomation.clickFindButton();
      if (!findClicked) {
        mainWindow?.webContents.send("automation:status", {
          type: "warning",
          message: `Impossibile cliccare Trova per: ${currentMRN}`,
        });
        continue;
      }

      // Attendi caricamento risultati
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Estrai risultati dalla tabella
      const tableResults = await webAutomation.extractTableResults(currentMRN);

      if (!tableResults || tableResults.length === 0) {
        mainWindow?.webContents.send("automation:status", {
          type: "warning",
          message: `Nessun risultato trovato per MRN: ${currentMRN}`,
        });
        continue; // Passa al prossimo MRN
      }

      // Analizza colonna "Nome Messaggio"
      const nomeMessaggioValues = new Set(
        tableResults.map(row => row.nomeMessaggio)
      );

      // Log valori trovati
      mainWindow?.webContents.send("automation:status", {
        type: "info",
        message: `Trovati ${tableResults.length} risultati. Nome Messaggio: ${Array.from(nomeMessaggioValues).join(", ")}`,
      });

      // DECISIONE: Verifica se MRN già scaricato
      const hasNCTSArrival = nomeMessaggioValues.has("NCTS Arrival Notification IT");
      const hasNCTSUnloading = nomeMessaggioValues.has("NCTS Unloading Remarks IT");

      if (hasNCTSArrival && hasNCTSUnloading) {
        // CASO B: MRN già scaricato
        mainWindow?.webContents.send("automation:status", {
          type: "warning",
          message: `⏭ MRN già scaricato (trovato NCTS Unloading Remarks): ${currentMRN}`,
        });
        processedCount++;
        continue; // Skip questo MRN
      }

      if (!hasNCTSArrival) {
        // CASO C: Nessun NCTS Arrival trovato
        mainWindow?.webContents.send("automation:status", {
          type: "warning",
          message: `⚠ NCTS Arrival Notification non trovato per MRN: ${currentMRN}`,
        });
        continue;
      }

      // CASO A: Solo NCTS Arrival → vai avanti con click
      mainWindow?.webContents.send("automation:status", {
        type: "success",
        message: `✓ MRN valido. Procedo con apertura dichiarazione: ${currentMRN}`,
      });

      // Double-click su cella NCTS Arrival Notification IT
      const clicked = await webAutomation.doubleClickNCTSArrival(currentMRN);

      if (!clicked) {
        mainWindow?.webContents.send("automation:status", {
          type: "error",
          message: `Impossibile aprire dichiarazione per MRN: ${currentMRN}`,
        });
        continue;
      }

      // Step 5: Click bottone "Note di scarico"
      mainWindow?.webContents.send("automation:status", {
        type: "info",
        message: 'Click su bottone "Note di scarico"...',
      });

      const unloadingButtonClicked = await webAutomation.clickUnloadingRemarksButton();
      if (!unloadingButtonClicked) {
        mainWindow?.webContents.send("automation:status", {
          type: "error",
          message: `Impossibile cliccare "Note di scarico" per MRN: ${currentMRN}`,
        });
        continue;
      }

      // Step 6: Click bottone OK
      mainWindow?.webContents.send("automation:status", {
        type: "info",
        message: 'Click su bottone OK...',
      });

      const okClicked = await webAutomation.clickOKButton();
      if (!okClicked) {
        mainWindow?.webContents.send("automation:status", {
          type: "error",
          message: `Impossibile cliccare OK per MRN: ${currentMRN}`,
        });
        continue;
      }

      // Step 7: Click tab "Nota di scarico"
      mainWindow?.webContents.send("automation:status", {
        type: "info",
        message: 'Click su tab "Nota di scarico"...',
      });

      const tabClicked = await webAutomation.clickUnloadingRemarksTab();
      if (!tabClicked) {
        mainWindow?.webContents.send("automation:status", {
          type: "error",
          message: `Impossibile cliccare tab "Nota di scarico" per MRN: ${currentMRN}`,
        });
        continue;
      }

      // Step 8: Compila campo "Stato dei sigilli OK"
      mainWindow?.webContents.send("automation:status", {
        type: "info",
        message: 'Compilazione campo "Stato dei sigilli OK"...',
      });

      const sealFieldFilled = await webAutomation.fillSealStatusField();
      if (!sealFieldFilled) {
        mainWindow?.webContents.send("automation:status", {
          type: "error",
          message: `Impossibile compilare campo "Stato dei sigilli OK" per MRN: ${currentMRN}`,
        });
        continue;
      }

      // Step 9: Click pulsante "Invia" e attendi redirect
      mainWindow?.webContents.send("automation:status", {
        type: "info",
        message: 'Click su pulsante "Invia"...',
      });

      const inviaClicked = await webAutomation.clickInviaButton();
      if (!inviaClicked) {
        mainWindow?.webContents.send("automation:status", {
          type: "error",
          message: `Impossibile cliccare "Invia" per MRN: ${currentMRN}`,
        });
        continue;
      }

      // MRN completato con successo
      mainWindow?.webContents.send("automation:status", {
        type: "success",
        message: `✓ MRN ${currentMRN} completato con successo! Redirect a /cm/declarations effettuato.`,
      });

      processedCount++;
    }

    // Completamento
    mainWindow?.webContents.send("automation:status", {
      type: "success",
      message: `Automazione completata! ${processedCount}/${totalMRNs} MRN processati con successo. Browser lasciato aperto per verifica.`,
    });

    // NON chiudere il browser per permettere verifica manuale
    // Browser rimane aperto intenzionalmente

    return { success: true, count: processedCount };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Errore sconosciuto",
    };
  }
});

ipcMain.handle("automation:process-rows", async () => {
  try {
    if (!webAutomation || !excelHandler) {
      return { success: false, error: "Automazione non inizializzata" };
    }

    const allRows = excelHandler.readAllRows();

    if (allRows.length === 0) {
      return { success: false, error: "Nessun dato trovato nell'Excel" };
    }

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < allRows.length; i++) {
      const rowData = allRows[i];

      // Type guard: skip if rowData is undefined
      if (!rowData) {
        continue;
      }

      try {
        // Invia progresso
        mainWindow?.webContents.send("automation:progress", {
          current: i + 1,
          total: allRows.length,
          rowData,
        });

        // Processa riga (QUI personalizzare la logica)
        const results = await processRow(webAutomation, rowData);

        // Scrivi risultati
        if (Object.keys(results).length > 0 && rowData._rowNumber) {
          excelHandler.writeRow(rowData._rowNumber, results);
        }

        successCount++;

        mainWindow?.webContents.send("automation:status", {
          type: "success",
          message: `Riga ${i + 1}/${allRows.length} completata`,
        });
      } catch (error) {
        errorCount++;
        mainWindow?.webContents.send("automation:status", {
          type: "error",
          message: `Errore riga ${i + 1}: ${
            error instanceof Error ? error.message : "Errore sconosciuto"
          }`,
        });

        // Screenshot errore
        await webAutomation.takeScreenshot(`error_row_${rowData._rowNumber}`);
      }
    }

    // Salva Excel
    await excelHandler.save();

    return {
      success: true,
      stats: {
        total: allRows.length,
        success: successCount,
        errors: errorCount,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Errore sconosciuto",
    };
  }
});

ipcMain.handle("automation:stop", async () => {
  try {
    // Emit part-changed event - Reset parte corrente
    mainWindow?.webContents.send("automation:part-changed", { part: null });

    if (webAutomation) {
      await webAutomation.close();
      webAutomation = null;
    }

    if (excelHandler) {
      excelHandler.close();
      excelHandler = null;
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Errore sconosciuto",
    };
  }
});

ipcMain.handle("automation:get-url", async () => {
  try {
    if (!webAutomation) {
      return { success: false, url: "about:blank" };
    }

    const url = webAutomation.getCurrentUrl();
    return { success: true, url };
  } catch (error) {
    return { success: false, url: "about:blank" };
  }
});

ipcMain.handle("excel:select-file", async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [
        { name: "File Excel", extensions: ["xlsx", "xls"] },
        { name: "Tutti i file", extensions: ["*"] },
      ],
      title: "Seleziona file Excel con colonna MRN",
    });

    if (result.canceled) {
      return { success: true, cancelled: true };
    }

    const filePath = result.filePaths[0];
    const fileName = basename(filePath);

    return { success: true, filePath, fileName };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Errore selezione file",
    };
  }
});

// ========================================
// IPC HANDLERS - AUTO-UPDATE
// ========================================

/**
 * Restituisce la versione corrente dell'app
 */
ipcMain.handle("update:get-version", async () => {
  return app.getVersion();
});

/**
 * Avvia il download manuale di un aggiornamento disponibile
 */
ipcMain.handle("update:download", async () => {
  try {
    console.log("[AUTO-UPDATE] Avvio download aggiornamento...");
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error) {
    console.error("[AUTO-UPDATE] Errore download:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Errore download aggiornamento",
    };
  }
});

/**
 * Installa l'aggiornamento scaricato e riavvia l'app
 */
ipcMain.handle("update:install", async () => {
  try {
    console.log("[AUTO-UPDATE] Installazione aggiornamento e riavvio...");
    setImmediate(() => {
      autoUpdater.quitAndInstall(false, true);
    });
    return { success: true };
  } catch (error) {
    console.error("[AUTO-UPDATE] Errore installazione:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Errore installazione aggiornamento",
    };
  }
});

/**
 * Controlla manualmente la disponibilità di aggiornamenti
 */
ipcMain.handle("update:check", async () => {
  try {
    console.log("[AUTO-UPDATE] Controllo manuale aggiornamenti...");
    const result = await autoUpdater.checkForUpdates();
    return { success: true, updateInfo: result?.updateInfo };
  } catch (error) {
    console.error("[AUTO-UPDATE] Errore controllo manuale:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Errore controllo aggiornamenti",
    };
  }
});
}

/**
 * Funzione per processare una riga (da personalizzare)
 */
async function processRow(
  _web: WebAutomation,
  rowData: RowData
): Promise<RowData> {
  console.log(`Processamento riga ${rowData._rowNumber}:`, rowData);

  // Navigate to Dichiarazioni menu after login
  console.log("Navigazione al menu Dichiarazioni...");
  const navigationSuccess = await _web.navigateToDeclarations();

  if (!navigationSuccess) {
    throw new Error("Failed to navigate to Dichiarazioni menu");
  }

  console.log("Navigazione completata con successo");

  // TODO: Add specific row processing logic here
  // Example: extract data, fill forms, etc.

  const results: RowData = {};
  return results;
}

// ========================================
// AUTO-UPDATER CONFIGURATION
// ========================================

/**
 * Configura e inizializza autoUpdater per gestire aggiornamenti da GitHub Releases
 * L'app controlla aggiornamenti all'avvio e permette download/installazione manuale
 */
function setupAutoUpdater() {
  // Configurazione autoUpdater
  autoUpdater.autoDownload = false; // Non scaricare automaticamente (chiediamo conferma utente)
  autoUpdater.autoInstallOnAppQuit = true; // Installa automaticamente quando l'app si chiude

  // Logger per debug (opzionale)
  autoUpdater.logger = require("electron-log");
  autoUpdater.logger.transports.file.level = "info";

  // Event: Inizio controllo aggiornamenti
  autoUpdater.on("checking-for-update", () => {
    console.log("[AUTO-UPDATE] Controllo aggiornamenti in corso...");
    mainWindow?.webContents.send("update:checking");
  });

  // Event: Aggiornamento disponibile
  autoUpdater.on("update-available", (info: any) => {
    console.log("[AUTO-UPDATE] Aggiornamento disponibile:", info.version);
    mainWindow?.webContents.send("update:available", {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes,
    });
  });

  // Event: Nessun aggiornamento disponibile
  autoUpdater.on("update-not-available", (info: any) => {
    console.log("[AUTO-UPDATE] Nessun aggiornamento disponibile (versione corrente:", info.version, ")");
    mainWindow?.webContents.send("update:not-available");
  });

  // Event: Errore durante controllo/download
  autoUpdater.on("error", (error: Error) => {
    console.error("[AUTO-UPDATE] Errore:", error.message);
    mainWindow?.webContents.send("update:error", error.message);
  });

  // Event: Progresso download (percentuale)
  autoUpdater.on("download-progress", (progressObj: any) => {
    const progressPercent = Math.round(progressObj.percent);
    console.log(`[AUTO-UPDATE] Download: ${progressPercent}% (${progressObj.transferred}/${progressObj.total} bytes)`);
    mainWindow?.webContents.send("update:download-progress", progressPercent);
  });

  // Event: Download completato, pronto per installazione
  autoUpdater.on("update-downloaded", (info: any) => {
    console.log("[AUTO-UPDATE] Download completato. Versione:", info.version);
    mainWindow?.webContents.send("update:downloaded", {
      version: info.version,
    });
  });

  // Controlla aggiornamenti 5 secondi dopo l'avvio (per dare tempo alla UI)
  setTimeout(() => {
    console.log("[AUTO-UPDATE] Controllo aggiornamenti avviato...");
    autoUpdater.checkForUpdates().catch((err: Error) => {
      console.error("[AUTO-UPDATE] Errore controllo aggiornamenti:", err.message);
    });
  }, 5000);

  // Controlla aggiornamenti ogni 4 ore (14400000 ms)
  setInterval(() => {
    console.log("[AUTO-UPDATE] Controllo periodico aggiornamenti...");
    autoUpdater.checkForUpdates().catch((err: Error) => {
      console.error("[AUTO-UPDATE] Errore controllo periodico:", err.message);
    });
  }, 4 * 60 * 60 * 1000);
}

// Gestione lifecycle app
app.whenReady().then(() => {
  // Setup IPC handlers prima di tutto
  setupIPCHandlers();

  // Setup auto-updater
  setupAutoUpdater();

  // Crea splash immediatamente
  createSplashWindow();

  // Crea main window (nascosta, si carica in background)
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createSplashWindow();
    createWindow();
  }
});
