"use client";

export interface CsvColumn<T> {
  label: string;
  get: (row: T) => string | number | null | undefined;
}

function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export default function ExportCsvButton<T>({
  rows,
  columns,
  filenamePrefix,
  label,
}: {
  rows: T[];
  columns: CsvColumn<T>[];
  filenamePrefix: string;
  label?: string;
}) {
  function handleExport() {
    const header = columns.map((c) => csvCell(c.label)).join(",");
    const lines = rows.map((row) => columns.map((c) => csvCell(c.get(row))).join(","));
    const csv = [header, ...lines].join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `${filenamePrefix}-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={rows.length === 0}
      style={{
        fontSize: 12.5,
        fontWeight: 600,
        padding: "7px 14px",
        borderRadius: 7,
        border: "1px solid var(--accent)",
        color: "var(--accent)",
        background: "transparent",
        cursor: rows.length === 0 ? "default" : "pointer",
        opacity: rows.length === 0 ? 0.5 : 1,
        whiteSpace: "nowrap",
      }}
      title={rows.length === 0 ? "Nothing to export" : `Download this list as a CSV file`}
    >
      {label ?? "Export CSV"} ({rows.length})
    </button>
  );
}
