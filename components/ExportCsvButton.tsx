"use client";

import type { BuyCandidate } from "@/lib/types";

function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const COLUMNS: { label: string; get: (c: BuyCandidate) => string | number | null | undefined }[] = [
  { label: "ASIN", get: (c) => c.asin },
  { label: "Product", get: (c) => c.product_title },
  { label: "Brand", get: (c) => c.brand },
  { label: "Score", get: (c) => c.score },
  { label: "Selling price (GBP)", get: (c) => c.selling_price },
  { label: "Margin", get: (c) => (c.margin != null ? (c.margin * 100).toFixed(1) + "%" : null) },
  { label: "ROI", get: (c) => (c.roi != null ? (c.roi * 100).toFixed(1) + "%" : null) },
  { label: "Contribution per unit (GBP)", get: (c) => c.contribution },
  { label: "Qty to order", get: (c) => c.quantity_to_order },
  { label: "Capital required (GBP)", get: (c) => c.capital_required },
  { label: "Break-even price (GBP)", get: (c) => c.break_even_price },
  { label: "Supplier SKU", get: (c) => c.supplier_sku },
  { label: "Supplier stock", get: (c) => c.supplier_stock },
  { label: "Listing status", get: (c) => c.listing_status ?? "not listed" },
];

export default function ExportCsvButton({ rows }: { rows: BuyCandidate[] }) {
  function handleExport() {
    const header = COLUMNS.map((c) => csvCell(c.label)).join(",");
    const lines = rows.map((row) => COLUMNS.map((c) => csvCell(c.get(row))).join(","));
    const csv = [header, ...lines].join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `buy-list-${stamp}.csv`;
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
      title={rows.length === 0 ? "Nothing to export" : "Download this list as a CSV file"}
    >
      Export CSV ({rows.length})
    </button>
  );
}
