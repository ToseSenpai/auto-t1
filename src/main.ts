/**
 * Script principale per l'automazione web con Excel
 */

import { createInterface } from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { Config } from "./config.js";
import { ExcelHandler, RowData } from "./excel-handler.js";
import { WebAutomation } from "./web-automation.js";

/**
 * Richiede username e password all'utente
 */
async function getCredentials(): Promise<{ username: string; password: string }> {
  const rl = createInterface({ input, output });

  console.log("\n" + "=".repeat(50));
  console.log("AUTOMAZIONE WEB - LOGIN");
  console.log("=".repeat(50) + "\n");

  const username = await rl.question("Username: ");

  // Per la password, usiamo un metodo che nasconde l'input
  output.write("Password: ");
  const password = await new Promise<string>((resolve) => {
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let password = "";
    stdin.on("data", (char: string) => {
      // char è già string, no need to call toString()

      switch (char) {
        case "\n":
        case "\r":
        case "\u0004": // Ctrl+D
          stdin.setRawMode(false);
          stdin.pause();
          output.write("\n");
          resolve(password);
          return; // Return instead of break to avoid unreachable code
        case "\u0003": // Ctrl+C
          process.exit();
        case "\u007f": // Backspace
          password = password.slice(0, -1);
          output.clearLine(0);
          output.cursorTo(0);
          output.write("Password: " + "*".repeat(password.length));
          break;
        default:
          password += char;
          output.write("*");
          break;
      }
    });
  });

  rl.close();
  return { username: username.trim(), password };
}

/**
 * Processa una singola riga di dati Excel eseguendo le operazioni web
 */
async function processRow(
  _web: WebAutomation,
  rowData: RowData
): Promise<RowData> {
  console.log(`\n--- Processamento riga ${rowData._rowNumber ?? "?"} ---`);
  console.log(`Dati in input:`, rowData);

  // ESEMPIO DI OPERAZIONI DA PERSONALIZZARE
  // =======================================

  // Esempio 1: Navigare a una pagina
  // await _web.navigateTo("https://example.com/page");

  // Esempio 2: Compilare un campo con un valore da Excel
  // if (rowData.A) {
  //   await _web.fillField("#input-field", String(rowData.A));
  // }

  // Esempio 3: Cliccare un pulsante
  // await _web.clickButton("#submit-button");

  // Esempio 4: Attendere un elemento
  // await _web.waitForElement(".result-container", 10000);

  // Esempio 5: Estrarre dati dal sito
  // const result = await _web.getText(".result-text");

  // Esempio 6: Estrarre un attributo
  // const link = await web.getAttribute("a.download-link", "href");

  // Prepara i risultati da scrivere su Excel
  const results: RowData = {};

  // ESEMPIO: Scrivi un risultato nella colonna C
  // results.C = result;

  // ESEMPIO: Scrivi un link nella colonna D
  // results.D = link;

  console.log(`Risultati:`, results);
  return results;
}

/**
 * Funzione principale
 */
async function main(): Promise<void> {
  let excel: ExcelHandler | null = null;
  let web: WebAutomation | null = null;

  try {
    // 1. Ottieni credenziali dall'utente
    const { username, password } = await getCredentials();

    if (!username || !password) {
      console.log("\nErrore: Username e password sono obbligatori");
      return;
    }

    console.log("\n" + "=".repeat(50));
    console.log("INIZIALIZZAZIONE");
    console.log("=".repeat(50) + "\n");

    // 2. Carica file Excel
    const excelPath = Config.PATHS.excelInput;
    console.log(`Caricamento file Excel: ${excelPath}`);

    excel = new ExcelHandler(excelPath);
    if (!(await excel.load(true))) {
      console.log("\nErrore nel caricamento del file Excel");
      return;
    }

    // 3. Avvia browser e login
    web = new WebAutomation(username, password);

    if (!(await web.startBrowser())) {
      console.log("\nErrore nell'avvio del browser");
      return;
    }

    if (!(await web.login())) {
      console.log("\nErrore nel login");
      return;
    }

    console.log("\n" + "=".repeat(50));
    console.log("PROCESSAMENTO DATI");
    console.log("=".repeat(50) + "\n");

    // 4. Leggi tutte le righe da Excel
    const allRows = excel.readAllRows();

    if (allRows.length === 0) {
      console.log("Nessun dato trovato nel file Excel");
      console.log(
        `Assicurati che ci siano dati a partire dalla riga ${Config.EXCEL_CONFIG.dataStartRow}`
      );
      return;
    }

    console.log(`Trovate ${allRows.length} righe da processare\n`);

    // 5. Processa ogni riga
    let successCount = 0;
    let errorCount = 0;

    for (const rowData of allRows) {
      try {
        // Processa la riga ed ottieni i risultati
        const results = await processRow(web, rowData);

        // Scrivi i risultati su Excel
        if (Object.keys(results).length > 0 && rowData._rowNumber) {
          excel.writeRow(rowData._rowNumber, results);
          successCount++;
        }

        // Pausa opzionale tra le righe
        // await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Errore nel processamento della riga:`, error);
        errorCount++;
        await web.takeScreenshot(
          `error_row_${rowData._rowNumber ?? "unknown"}`
        );
        continue;
      }
    }

    // 6. Salva le modifiche su Excel
    console.log("\n" + "=".repeat(50));
    console.log("SALVATAGGIO RISULTATI");
    console.log("=".repeat(50) + "\n");

    if (await excel.save()) {
      console.log(`\nProcessamento completato!`);
      console.log(`  ✓ Righe elaborate con successo: ${successCount}`);
      if (errorCount > 0) {
        console.log(`  ✗ Righe con errori: ${errorCount}`);
      }
    } else {
      console.log("\nErrore nel salvataggio del file Excel");
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ERR_USE_AFTER_CLOSE") {
      // Ignora errori di readline dopo la chiusura
      return;
    }
    console.error(`\nErrore imprevisto:`, error);
  } finally {
    // 7. Chiudi tutto
    console.log("\n" + "=".repeat(50));
    console.log("CHIUSURA");
    console.log("=".repeat(50) + "\n");

    if (web) {
      await web.close();
    }

    if (excel) {
      excel.close();
    }

    console.log("Programma terminato\n");
  }
}

// Esegui il programma
main().catch(console.error);
