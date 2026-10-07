"use client";

import { useMemo, useState } from "react";
import DataTable, { type Column, type Row } from "./DataTable";
import ExportCsvButton from "./ExportCsvButton";
import type { BfDirectDispatchRow } from "@/lib/types";

const COLUMNS: Column[] = [
  { key: "product_name", label: "Product", type: "product", subKey: "brand_sku" },
  { key: "gating", label: "Gating", type: "badge" },
  { key: "bf_stock", label: "BF stock", type: "number" },
  { key: "cost_ex_vat", label: "Cost ex VAT", type: "gbp" },
  { key: "cost_inc_vat", label: "Cost inc VAT", type: "gbp" },
  { key: "total_cost_ex_vat", label: "Cost + ship ex VAT", type: "gbp" },
  { key: "referral_pct", label: "Referral %", type: "number" },
  { key: "breakeven_price", label: "Break-even", type: "gbp" },
  { key: "price_10pct_margin", label: "10% margin", type: "gbp" },
  { key: "price_20pct_margin", label: "20% margin", type: "gbp" },
  { key: "price_30pct_margin", label: "30% margin", type: "gbp" },
  { key: "price_40pct_margin", label: "40% margin", type: "gbp" },
  { key: "buy_box_price", label: "Buy Box", type: "gbp", subKey: "buy_box_note" },
  { key: "amazon_fees_at_buy_box", label: "Amazon fees", type: "gbp" },
  { key: "profit_at_buy_box", label: "Profit at Buy Box", type: "gbp", good: true },
  { key: "margin", label: "Margin", type: "pct" },
  { key: "rrp", label: "RRP", type: "gbp" },
  { key: "seller_count", label: "Sellers", type: "number" },
  { key: "barcode", label: "Barcode", type: "text" },
];

type ToggleKey =
  | "is_ungated"
  | "is_exact_match"
  | "in_stock"
  | "has_buy_box"
  | "profitable_at_buy_box"
  | "hide_amazon"
  | "hide_suspect"
  | "ready_to_list";

const TOGGLES: { key: ToggleKey; label: string; hint: string }[] = [
  { key: "ready_to_list", label: "Ready to list", hint: "Ungated, exact match, in stock, profitable at Buy Box, Buy Box looks real" },
  { key: "is_ungated", label: "Ungated", hint: "Amazon lets you list this ASIN" },
  { key: "is_exact_match", label: "Exact match", hint: "High-confidence title / barcode match" },
  { key: "in_stock", label: "In stock at BF", hint: "In today's Beauty Fort stock file" },
  { key: "has_buy_box", label: "Has Buy Box", hint: "Amazon price known" },
  { key: "profitable_at_buy_box", label: "Profitable", hint: "Makes money at today's Buy Box after fees, VAT and £4.74 shipping" },
  { key: "hide_amazon", label: "Hide Amazon on listing", hint: "Remove listings where Amazon itself sells" },
  { key: "hide_suspect", label: "Hide suspect Buy Box", hint: "Remove Buy Box prices over 1.5× RRP (likely bad data)" },
];

const MARGINS = [0, 10, 20, 30, 40];

const CSV_HEADER = [
  "BF SKU", "ASIN", "Product", "Brand", "Barcode", "Gating", "BF stock", "Cost ex VAT", "Cost inc VAT",
  "Cost + shipping ex VAT", "Referral %", "Break-even", "Price 10% margin", "Price 20% margin",
  "Price 30% margin", "Price 40% margin", "Buy Box", "Buy Box basis", "Amazon fees at Buy Box",
  "Profit at Buy Box", "Margin %", "RRP", "Sellers", "Amazon on listing",
];

const switchStyle = (on: boolean): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
  padding: "6px 12px",
  borderRadius: 999,
  border: `1px solid ${on ? "var(--accent)" : "var(--border)"}`,
  background: on ? "var(--accent)" : "transparent",
  color: on ? "#fff" : "var(--text-secondary)",
  cursor: "pointer",
  fontWeight: 600,
  whiteSpace: "nowrap",
});

export default function BfDirectDispatchTable({ rows }: { rows: BfDirectDispatchRow[] }) {
  const [on, setOn] = useState<Record<ToggleKey, boolean>>({
    ready_to_list: false,
    is_ungated: true,
    is_exact_match: true,
    in_stock: true,
    has_buy_box: false,
    profitable_at_buy_box: false,
    hide_amazon: false,
    hide_suspect: true,
  });
  const [minMargin, setMinMargin] = useState(0);

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (on.ready_to_list && !r.ready_to_list) return false;
        if (on.is_ungated && !r.is_ungated) return false;
        if (on.is_exact_match && !r.is_exact_match) return false;
        if (on.in_stock && !r.in_stock) return false;
        if (on.has_buy_box && !r.has_buy_box) return false;
        if (on.profitable_at_buy_box && !r.profitable_at_buy_box) return false;
        if (on.hide_amazon && r.amazon_on_listing) return false;
        if (on.hide_suspect && r.buy_box_suspect) return false;
        if (minMargin > 0 && (r.margin_pct_at_buy_box ?? -1) < minMargin) return false;
        return true;
      }),
    [rows, on, minMargin],
  );

  const tableRows: Row[] = useMemo(
    () =>
      filtered.map((r) => ({
        ...r,
        row_key: `${r.bf_sku}-${r.asin}`,
        brand_sku: [r.brand, r.bf_sku].filter(Boolean).join(" · "),
        margin: r.margin_pct_at_buy_box != null ? r.margin_pct_at_buy_box / 100 : null,
        buy_box_note: r.buy_box_basis === "avg30" ? "30-day avg" : r.buy_box_suspect ? "suspect" : null,
      })),
    [filtered],
  );

  const csvData = useMemo(
    () =>
      filtered.map((r) => [
        r.bf_sku, r.asin, r.product_name, r.brand, r.barcode, r.gating, r.bf_stock, r.cost_ex_vat, r.cost_inc_vat,
        r.total_cost_ex_vat, r.referral_pct, r.breakeven_price, r.price_10pct_margin, r.price_20pct_margin,
        r.price_30pct_margin, r.price_40pct_margin, r.buy_box_price, r.buy_box_basis, r.amazon_fees_at_buy_box,
        r.profit_at_buy_box, r.margin_pct_at_buy_box, r.rrp, r.seller_count, r.amazon_on_listing ? "yes" : "no",
      ]),
    [filtered],
  );

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", padding: "14px 14px 4px" }}>
        {TOGGLES.map((t) => (
          <button
            key={t.key}
            type="button"
            title={t.hint}
            aria-pressed={on[t.key]}
            onClick={() => setOn((s) => ({ ...s, [t.key]: !s[t.key] }))}
            style={switchStyle(on[t.key])}
          >
            {t.label}
          </button>
        ))}
        <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-secondary)" }}>
          Min margin
          <select
            value={minMargin}
            onChange={(e) => setMinMargin(Number(e.target.value))}
            style={{ fontSize: 13, padding: "5px 8px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface-page)", color: "var(--text-primary)" }}
          >
            {MARGINS.map((m) => (
              <option key={m} value={m}>
                {m === 0 ? "Any" : `${m}%+`}
              </option>
            ))}
          </select>
        </label>
        <span style={{ marginLeft: "auto", display: "inline-flex", gap: 10, alignItems: "center" }}>
          <span className="tabular" style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
            {filtered.length.toLocaleString("en-GB")} of {rows.length.toLocaleString("en-GB")} products
          </span>
          <ExportCsvButton header={CSV_HEADER} data={csvData} filenamePrefix="bf-direct-dispatch" />
        </span>
      </div>
      <DataTable
        rows={tableRows}
        columns={COLUMNS}
        rowKey="row_key"
        initialSort={{ key: "profit_at_buy_box", dir: "desc" }}
        pageSize={50}
        emptyLabel="No products match these toggles — switch some off."
      />
    </>
  );
}
