/**
 * Electron Main Process
 * Processo principale che gestisce finestra, browser view e comunicazione IPC
 */

const { app, BrowserWindow, ipcMain, dialog, Menu } = require("electron");
const { join, basename } = require("path");

import { WebAutomation } from "../src/web-automation";
import { ExcelHandler } from "../src/excel-handler";
import type { RowData } from "../src/excel-handler";
import type { BrowserWindow as BrowserWindowType } from "electron";

let mainWindow: BrowserWindowType | null = null;
let splashWindow: BrowserWindowType | null = null;
let webAutomation: WebAutomation | null = null;
let excelHandler: ExcelHandler | null = null;

const isDev = process.env.NODE_ENV === "development";

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 500,
    height: 200,
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
    const { username, password, excelPath } = data;

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

      mainWindow?.webContents.send("automation:status", {
        type: "info",
        message: `${mrnProgress} Inizio elaborazione MRN: ${currentMRN}`,
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

      // Compila campo Data/Ora di arrivo (step 7)
      mainWindow?.webContents.send("automation:status", {
        type: "info",
        message: `${mrnProgress} Compilazione campo Data/Ora di arrivo...`,
      });

      const dateTimeSuccess = await webAutomation.fillArrivalDateTime();
      if (!dateTimeSuccess) {
        return {
          success: false,
          error: `${mrnProgress} Impossibile compilare campo Data/Ora di arrivo`,
        };
      }

      mainWindow?.webContents.send("automation:status", {
        type: "success",
        message: `${mrnProgress} Campo Data/Ora di arrivo compilato (oggi alle 20:00)`,
      });

      // Delay per rallentare la macro
      await new Promise(resolve => setTimeout(resolve, 1000));

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

        // Click su "Nuova dichiarazione" per il prossimo MRN
        const newDeclSuccess = await webAutomation.clickNewDeclaration();
        if (!newDeclSuccess) {
          return {
            success: false,
            error: `${mrnProgress} Impossibile cliccare su 'Nuova dichiarazione' per MRN successivo`,
          };
        }

        // Attendi extra dopo clickNewDeclaration() (che già attende internamente)
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

// Gestione lifecycle app
app.whenReady().then(() => {
  // Setup IPC handlers prima di tutto
  setupIPCHandlers();

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
