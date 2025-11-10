/**
 * Electron Main Process
 * Processo principale che gestisce finestra, browser view e comunicazione IPC
 */

const { app, BrowserWindow, ipcMain, dialog } = require("electron");
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
    backgroundColor: "#f3f4f6",
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

        // Apri DevTools solo in dev
        if (isDev) {
          mainWindow.webContents.openDevTools();
        }
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

      if (isDev) {
        mainWindow.webContents.openDevTools();
      }
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
        message: `${mrnProgress} Campo Data/Ora di arrivo compilato (ora corrente + 1 ora)`,
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
