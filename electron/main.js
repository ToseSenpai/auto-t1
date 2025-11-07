import { app, BrowserWindow, BrowserView, ipcMain } from "electron";
import { join } from "path";
import { WebAutomation } from "../src/web-automation.js";
import { ExcelHandler } from "../src/excel-handler.js";
let mainWindow = null;
let splashWindow = null;
let browserView = null;
let webAutomation = null;
let excelHandler = null;
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
    splashWindow.loadFile(join(__dirname, "../splash.html"));
    splashWindow.on("closed", () => {
        splashWindow = null;
    });
    setTimeout(() => {
        if (splashWindow && !splashWindow.isDestroyed()) {
            console.warn("Force closing splash window after timeout");
            splashWindow.destroy();
            splashWindow = null;
        }
    }, 5000);
}
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        show: false,
        webPreferences: {
            preload: join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true,
        },
        title: "Auto-T1 - Automazione Web",
        backgroundColor: "#1f2937",
    });
    if (isDev) {
        mainWindow.loadURL("http://localhost:5173");
    }
    else {
        mainWindow.loadFile(join(__dirname, "../dist/index.html"));
    }
    mainWindow.once("ready-to-show", () => {
        if (splashWindow && !splashWindow.isDestroyed()) {
            splashWindow.close();
            splashWindow = null;
        }
        setTimeout(() => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.show();
                createBrowserView();
                if (isDev) {
                    mainWindow.webContents.openDevTools();
                }
            }
        }, 100);
    });
    mainWindow.on("closed", () => {
        mainWindow = null;
        browserView = null;
    });
}
function createBrowserView() {
    if (!mainWindow)
        return;
    browserView = new BrowserView({
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    mainWindow.setBrowserView(browserView);
    const { width, height } = mainWindow.getBounds();
    browserView.setBounds({
        x: 350,
        y: 0,
        width: width - 350,
        height: height,
    });
    browserView.setAutoResize({
        width: true,
        height: true,
    });
    browserView.webContents.loadFile(join(__dirname, "../browser-status.html"));
}
ipcMain.handle("automation:start", async (_, data) => {
    try {
        const { username, password, excelPath } = data;
        webAutomation = new WebAutomation(username, password);
        excelHandler = new ExcelHandler(excelPath);
        const excelLoaded = await excelHandler.load(true);
        if (!excelLoaded) {
            return { success: false, error: "Errore caricamento Excel" };
        }
        const browserStarted = await webAutomation.startBrowser();
        if (!browserStarted) {
            return { success: false, error: "Errore avvio browser" };
        }
        if (browserView) {
            browserView.webContents.loadFile(join(__dirname, "../browser-status.html"));
        }
        const loginSuccess = await webAutomation.login();
        if (!loginSuccess) {
            return { success: false, error: "Errore login" };
        }
        mainWindow?.webContents.send("automation:status", {
            type: "info",
            message: "Login completato con successo",
        });
        return { success: true };
    }
    catch (error) {
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
            try {
                mainWindow?.webContents.send("automation:progress", {
                    current: i + 1,
                    total: allRows.length,
                    rowData,
                });
                const results = await processRow(webAutomation, rowData);
                if (Object.keys(results).length > 0 && rowData._rowNumber) {
                    excelHandler.writeRow(rowData._rowNumber, results);
                }
                successCount++;
                mainWindow?.webContents.send("automation:status", {
                    type: "success",
                    message: `Riga ${i + 1}/${allRows.length} completata`,
                });
            }
            catch (error) {
                errorCount++;
                mainWindow?.webContents.send("automation:status", {
                    type: "error",
                    message: `Errore riga ${i + 1}: ${error instanceof Error ? error.message : "Errore sconosciuto"}`,
                });
                await webAutomation.takeScreenshot(`error_row_${rowData._rowNumber}`);
            }
        }
        await excelHandler.save();
        return {
            success: true,
            stats: {
                total: allRows.length,
                success: successCount,
                errors: errorCount,
            },
        };
    }
    catch (error) {
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
        if (browserView) {
            browserView.webContents.loadFile(join(__dirname, "../browser-status.html"));
        }
        return { success: true };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Errore sconosciuto",
        };
    }
});
async function processRow(web, rowData) {
    console.log(`Processamento riga ${rowData._rowNumber}:`, rowData);
    const results = {};
    return results;
}
app.whenReady().then(() => {
    createSplashWindow();
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
//# sourceMappingURL=main.js.map