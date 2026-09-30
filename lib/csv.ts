export type CsvCell = string | number | null | undefined;

export interface CsvColumn<T> {
  label: string;
  get: (row: T) => CsvCell;
}

// Runs on the server: turns rows + column getters into plain data that can be
// passed to the client-side ExportCsvButton (functions can't cross that boundary).
export function toCsvTable<T>(rows: T[], columns: CsvColumn<T>[]): { header: string[]; data: CsvCell[][] } {
  return {
    header: columns.map((c) => c.label),
    data: rows.map((row) => columns.map((c) => c.get(row) ?? null)),
  };
}
