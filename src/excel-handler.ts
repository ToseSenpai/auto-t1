/**
 * Gestione file Excel con exceljs
 */

import ExcelJS from "exceljs";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";
import { Config } from "./config.js";

export interface RowData {
  [column: string]: ExcelJS.CellValue;
  _rowNumber?: number;
}

export class ExcelHandler {
  private workbook: ExcelJS.Workbook | null = null;
  private worksheet: ExcelJS.Worksheet | null | undefined = null;

  constructor(private filePath: string) {}

  /**
   * Carica il file Excel
   */
  async load(createIfMissing: boolean = true): Promise<boolean> {
    try {
      if (existsSync(this.filePath)) {
        this.workbook = new ExcelJS.Workbook();
        await this.workbook.xlsx.readFile(this.filePath);

        const sheetName = Config.EXCEL_CONFIG.sheetName;
        this.worksheet = this.workbook.getWorksheet(sheetName);

        if (!this.worksheet) {
          // Se il foglio non esiste, prendi il primo disponibile
          this.worksheet = this.workbook.worksheets[0] ?? null;
          if (this.worksheet) {
            console.log(
              `Foglio '${sheetName}' non trovato, uso '${this.worksheet.name}'`
            );
          }
        }

        console.log(`File Excel caricato: ${this.filePath}`);
        return true;
      } else if (createIfMissing) {
        console.log(`File non trovato, creo nuovo file: ${this.filePath}`);
        this.workbook = new ExcelJS.Workbook();
        this.worksheet = this.workbook.addWorksheet(
          Config.EXCEL_CONFIG.sheetName
        );
        await this.save();
        return true;
      } else {
        console.log(`File non trovato: ${this.filePath}`);
        return false;
      }
    } catch (error) {
      console.error(`Errore nel caricamento del file Excel:`, error);
      return false;
    }
  }

  /**
   * Salva le modifiche nel file Excel
   */
  async save(): Promise<boolean> {
    try {
      if (!this.workbook) {
        console.log("Nessun workbook da salvare");
        return false;
      }

      // Crea la directory se non esiste
      const dir = dirname(this.filePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      await this.workbook.xlsx.writeFile(this.filePath);
      console.log(`File Excel salvato: ${this.filePath}`);
      return true;
    } catch (error) {
      console.error(`Errore nel salvataggio del file Excel:`, error);
      return false;
    }
  }

  /**
   * Legge i dati da una riga specifica
   */
  readRow(rowNumber: number): RowData {
    if (!this.worksheet) {
      throw new Error("Worksheet non caricato");
    }

    const row = this.worksheet.getRow(rowNumber);
    const rowData: RowData = {};

    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      // Usa la lettera della colonna come chiave (A, B, C, ...)
      const columnLetter = this.columnNumberToLetter(colNumber);
      rowData[columnLetter] = cell.value;
    });

    return rowData;
  }

  /**
   * Scrive un valore in una cella specifica
   */
  writeCell(row: number, column: string, value: ExcelJS.CellValue): void {
    if (!this.worksheet) {
      throw new Error("Worksheet non caricato");
    }

    this.worksheet.getCell(`${column}${row}`).value = value;
  }

  /**
   * Legge tutte le righe con dati
   */
  readAllRows(startRow?: number): RowData[] {
    if (!this.worksheet) {
      throw new Error("Worksheet non caricato");
    }

    const start = startRow ?? Config.EXCEL_CONFIG.dataStartRow;
    const allRows: RowData[] = [];
    const maxRow = this.worksheet.rowCount;

    for (let rowNum = start; rowNum <= maxRow; rowNum++) {
      const rowData = this.readRow(rowNum);

      // Aggiungi solo righe non vuote
      if (Object.keys(rowData).length > 0) {
        rowData._rowNumber = rowNum; // Aggiungi numero riga per riferimento
        allRows.push(rowData);
      }
    }

    return allRows;
  }

  /**
   * Scrive un dizionario di dati in una riga
   */
  writeRow(row: number, data: RowData): void {
    if (!this.worksheet) {
      throw new Error("Worksheet non caricato");
    }

    for (const [column, value] of Object.entries(data)) {
      // Salta il campo interno _rowNumber
      if (column !== "_rowNumber") {
        this.writeCell(row, column, value);
      }
    }
  }

  /**
   * Legge le intestazioni delle colonne
   */
  getHeaders(): string[] {
    if (!this.worksheet) {
      throw new Error("Worksheet non caricato");
    }

    const headerRow = Config.EXCEL_CONFIG.headerRow;
    const headers: string[] = [];
    const row = this.worksheet.getRow(headerRow);

    row.eachCell({ includeEmpty: false }, (cell) => {
      if (cell.value) {
        headers.push(String(cell.value));
      }
    });

    return headers;
  }

  /**
   * Converte numero colonna in lettera (1 -> A, 2 -> B, etc.)
   */
  private columnNumberToLetter(column: number): string {
    let letter = "";
    while (column > 0) {
      const remainder = (column - 1) % 26;
      letter = String.fromCharCode(65 + remainder) + letter;
      column = Math.floor((column - 1) / 26);
    }
    return letter;
  }

  /**
   * Chiude il workbook
   */
  close(): void {
    this.workbook = null;
    this.worksheet = null;
    console.log("File Excel chiuso");
  }
}
