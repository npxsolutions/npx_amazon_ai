"use client";

import { useMemo, useState, useTransition } from "react";
import { gbp, num, pct } from "@/lib/format";
import { createListing, type CreateListingResult } from "@/lib/actions";
import ListingOrderButtons from "./ListingOrderButtons";
import Badge from "./Badge";

// Everything here is plain data: server components can't pass functions to client components,
// so columns describe how to render a value by type instead of carrying render callbacks.
export type ColumnType = "text" | "product" | "number" | "gbp" | "pct" | "badge";

export interface Column {
  key: string;
  label: string;
  type: ColumnType;
  /** Key of a pre-formatted secondary line shown under the value. */
  subKey?: string;
  /** Colour the value green (profit columns). */
  good?: boolean;
  /** Turn off filtering for this column. */
  noFilter?: boolean;
}

export type Row = Record<string, unknown>;

export interface DetailLine {
  label: string;
  value: string;
  note?: string;
  minus?: boolean;
  strong?: boolean;
}

interface Props {
  rows: Row[];
  columns: Column[];
  rowKey: string;
  /** Adds tick boxes and "Create listings for selected", plus per-row Create Listing / Add Order buttons. */
  listing?: { idKey: string; statusKey: string; issuesKey?: string };
  /** Key of a DetailLine[] shown in an expandable panel under the product. */
  detailKey?: string;
  detailLabel?: string;
  initialSort?: { key: string; dir: "asc" | "desc" };
  pageSize?: number;
  emptyLabel: string;
}

const th: React.CSSProperties = {
  textAlign: "left",
  fontSize: 11.5,
  textTransform: "uppercase",
  letterSpacing: 0.3,
  color: "var(--text-muted)",
  fontWeight: 600,
  padding: "10px 12px 6px",
  whiteSpace: "nowrap",
  verticalAlign: "bottom",
};
const td: React.CSSProperties = {
  padding: "9px 12px",
  borderTop: "1px solid var(--gridline)",
  fontSize: 13.5,
  color: "var(--text-primary)",
  verticalAlign: "top",
};
const muted: React.CSSProperties = { fontSize: 11.5, color: "var(--text-muted)" };
const input: React.CSSProperties = {
  width: "100%",
  minWidth: 56,
  fontSize: 12,
  padding: "4px 6px",
  border: "1px solid var(--border)",
  borderRadius: 5,
  background: "var(--surface-page)",
  color: "var(--text-primary)",
};

function asNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

function format(type: ColumnType, v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  switch (type) {
    case "gbp":
      return gbp(asNumber(v));
    case "pct":
      return pct(asNumber(v));
    case "number":
      return num(asNumber(v));
    default:
      return String(v);
  }
}

const isNumeric = (t: ColumnType) => t === "number" || t === "gbp" || t === "pct";

type Filter = { text?: string; min?: string; max?: string };

export default function DataTable({
  rows,
  columns,
  rowKey,
  listing,
  detailKey,
  detailLabel = "Details",
  initialSort,
  pageSize = 50,
  emptyLabel,
}: Props) {
  const [filters, setFilters] = useState<Record<string, Filter>>({});
  const [sort, setSort] = useState(initialSort ?? null);
  const [limit, setLimit] = useState(pageSize);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Record<string, CreateListingResult | "pending">>({});
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Badge columns filter by exact value from a dropdown of what's present.
  const badgeOptions = useMemo(() => {
    const out: Record<string, string[]> = {};
    for (const c of columns) {
      if (c.type !== "badge") continue;
      out[c.key] = Array.from(new Set(rows.map((r) => String(r[c.key] ?? "")).filter(Boolean))).sort();
    }
    return out;
  }, [rows, columns]);

  const filtered = useMemo(() => {
    const active = Object.entries(filters).filter(([, f]) => f.text || f.min || f.max);
    let out = rows;
    if (active.length) {
      out = rows.filter((r) =>
        active.every(([key, f]) => {
          const col = columns.find((c) => c.key === key);
          if (!col) return true;
          const v = r[key];
          if (isNumeric(col.type)) {
            const n = asNumber(v);
            const scale = col.type === "pct" ? 100 : 1; // percentages are typed as e.g. 40, stored as 0.4
            if (f.min && (n === null || n * scale < parseFloat(f.min))) return false;
            if (f.max && (n === null || n * scale > parseFloat(f.max))) return false;
            return true;
          }
          if (col.type === "badge") return !f.text || String(v ?? "") === f.text;
          const hay = [v, col.subKey ? r[col.subKey] : null, col.type === "product" ? r.asin : null]
            .filter((x) => x != null)
            .join(" ")
            .toLowerCase();
          return !f.text || hay.includes(f.text.toLowerCase());
        })
      );
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      const numeric = col ? isNumeric(col.type) : false;
      out = [...out].sort((a, b) => {
        const av = a[sort.key];
        const bv = b[sort.key];
        let cmp: number;
        if (numeric) {
          const an = asNumber(av);
          const bn = asNumber(bv);
          if (an === null && bn === null) cmp = 0;
          else if (an === null) return 1; // blanks always last
          else if (bn === null) return -1;
          else cmp = an - bn;
        } else {
          cmp = String(av ?? "").localeCompare(String(bv ?? ""));
        }
        return sort.dir === "asc" ? cmp : -cmp;
      });
    }
    return out;
  }, [rows, columns, filters, sort]);

  const visible = filtered.slice(0, limit);
  const keyOf = (r: Row) => String(r[rowKey]);
  const listable = (r: Row) => listing != null && r[listing.statusKey] !== "live" && r[listing.statusKey] !== "already_live";

  function setFilter(key: string, patch: Filter) {
    setFilters((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
    setLimit(pageSize);
  }

  function toggleSort(key: string) {
    setSort((prev) => (prev && prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }));
  }

  function toggleRow(k: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  const selectableFiltered = filtered.filter(listable);
  const allFilteredSelected = selectableFiltered.length > 0 && selectableFiltered.every((r) => selected.has(keyOf(r)));
  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) selectableFiltered.forEach((r) => next.delete(keyOf(r)));
      else selectableFiltered.forEach((r) => next.add(keyOf(r)));
      return next;
    });
  }

  // Lists one at a time through the same workflow as the per-row button (40% ROI floor applies),
  // so a failure on one product never stops the rest and Amazon isn't hammered.
  function runBulkListing() {
    if (!listing) return;
    const queue = rows.filter((r) => selected.has(keyOf(r)) && listable(r));
    setConfirming(false);
    startTransition(async () => {
      for (const r of queue) {
        const k = keyOf(r);
        setResults((prev) => ({ ...prev, [k]: "pending" }));
        let res: CreateListingResult;
        try {
          res = await createListing(Number(r[listing.idKey]));
        } catch (err) {
          res = { ok: false, error: err instanceof Error ? err.message : "Listing failed." };
        }
        setResults((prev) => ({ ...prev, [k]: res }));
        if (res.ok) {
          setSelected((prev) => {
            const next = new Set(prev);
            next.delete(k);
            return next;
          });
        }
      }
    });
  }

  const done = Object.values(results).filter((r): r is CreateListingResult => r !== "pending");
  const okCount = done.filter((r) => r.ok).length;
  const failCount = done.length - okCount;
  const pendingCount = Object.values(results).filter((r) => r === "pending").length;
  const anyFilter = Object.values(filters).some((f) => f.text || f.min || f.max);
  const colCount = columns.length + (listing ? 2 : 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "10px 12px 0" }}>
        <span style={muted}>
          {num(filtered.length)} of {num(rows.length)} shown
          {anyFilter ? " (filtered)" : ""}
        </span>
        {anyFilter ? (
          <button type="button" onClick={() => setFilters({})} style={linkBtn}>
            Clear filters
          </button>
        ) : null}
        {listing ? (
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {pendingCount > 0 || done.length > 0 ? (
              <span style={muted}>
                {pendingCount > 0 ? `Listing… ${num(done.length)} of ${num(done.length + pendingCount)} done · ` : ""}
                {okCount > 0 ? `${num(okCount)} listed` : ""}
                {okCount > 0 && failCount > 0 ? " · " : ""}
                {failCount > 0 ? <span style={{ color: "var(--status-critical)" }}>{num(failCount)} failed</span> : null}
              </span>
            ) : null}
            {confirming ? (
              <>
                <span style={{ fontSize: 12.5, color: "var(--status-warning)", fontWeight: 600 }}>
                  Create {num(selected.size)} live Amazon listing{selected.size === 1 ? "" : "s"}?
                </span>
                <button type="button" onClick={runBulkListing} style={btn("var(--status-good)", false)}>
                  Yes, list them
                </button>
                <button type="button" onClick={() => setConfirming(false)} style={linkBtn}>
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={selected.size === 0 || isPending}
                onClick={() => setConfirming(true)}
                style={btn("var(--status-good)", selected.size === 0 || isPending)}
                title="Creates real live offers on Amazon, each priced at the Buy Box but never below your 40% ROI floor"
              >
                {isPending ? "Listing…" : `Create listings for selected (${num(selected.size)})`}
              </button>
            )}
          </span>
        ) : null}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              {listing ? (
                <th style={{ ...th, width: 28 }}>
                  <input
                    type="checkbox"
                    aria-label="Select all shown"
                    checked={allFilteredSelected}
                    onChange={toggleAll}
                    disabled={selectableFiltered.length === 0}
                  />
                </th>
              ) : null}
              {columns.map((c) => (
                <th key={c.key} style={th}>
                  <button type="button" onClick={() => toggleSort(c.key)} style={{ ...linkBtn, ...th, padding: 0 }}>
                    {c.label}
                    {sort && sort.key === c.key ? (sort.dir === "asc" ? " ▲" : " ▼") : ""}
                  </button>
                </th>
              ))}
              {listing ? <th style={th}>Listing / Order</th> : null}
            </tr>
            <tr>
              {listing ? <th style={{ ...th, paddingTop: 0 }} /> : null}
              {columns.map((c) => (
                <th key={c.key} style={{ ...th, paddingTop: 0, paddingBottom: 8 }}>
                  {c.noFilter ? null : c.type === "badge" ? (
                    <select
                      value={filters[c.key]?.text ?? ""}
                      onChange={(e) => setFilter(c.key, { text: e.target.value })}
                      style={input}
                      aria-label={`Filter ${c.label}`}
                    >
                      <option value="">All</option>
                      {(badgeOptions[c.key] ?? []).map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : isNumeric(c.type) ? (
                    <div style={{ display: "flex", gap: 4 }}>
                      <input
                        inputMode="decimal"
                        placeholder={c.type === "pct" ? "min %" : "min"}
                        value={filters[c.key]?.min ?? ""}
                        onChange={(e) => setFilter(c.key, { min: e.target.value })}
                        style={input}
                        aria-label={`${c.label} minimum`}
                      />
                      <input
                        inputMode="decimal"
                        placeholder={c.type === "pct" ? "max %" : "max"}
                        value={filters[c.key]?.max ?? ""}
                        onChange={(e) => setFilter(c.key, { max: e.target.value })}
                        style={input}
                        aria-label={`${c.label} maximum`}
                      />
                    </div>
                  ) : (
                    <input
                      placeholder="contains…"
                      value={filters[c.key]?.text ?? ""}
                      onChange={(e) => setFilter(c.key, { text: e.target.value })}
                      style={input}
                      aria-label={`Filter ${c.label}`}
                    />
                  )}
                </th>
              ))}
              {listing ? <th style={{ ...th, paddingTop: 0 }} /> : null}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={colCount} style={{ ...td, ...muted, textAlign: "center", padding: "24px 12px" }}>
                  {anyFilter ? "Nothing matches these filters." : emptyLabel}
                </td>
              </tr>
            ) : (
              visible.map((r) => {
                const k = keyOf(r);
                const res = results[k];
                const details = detailKey ? (r[detailKey] as DetailLine[] | undefined) : undefined;
                return (
                  <tr key={k} style={selected.has(k) ? { background: "var(--accent-soft)" } : undefined}>
                    {listing ? (
                      <td style={td}>
                        <input
                          type="checkbox"
                          aria-label={`Select ${String(r.product_title ?? k)}`}
                          checked={selected.has(k)}
                          onChange={() => toggleRow(k)}
                          disabled={!listable(r)}
                        />
                      </td>
                    ) : null}
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        style={{
                          ...td,
                          ...(c.type === "product" ? { maxWidth: 340 } : {}),
                          ...(c.good ? { fontWeight: 600, color: "var(--status-good)" } : {}),
                        }}
                        className={isNumeric(c.type) ? "tabular" : undefined}
                      >
                        {c.type === "badge" ? (
                          r[c.key] ? <Badge label={String(r[c.key])} /> : "—"
                        ) : c.type === "product" ? (
                          <>
                            {String(r[c.key] ?? "—")}
                            <div style={muted}>
                              {c.subKey && r[c.subKey] ? `${String(r[c.subKey])} · ` : ""}
                              <a href={`https://www.amazon.co.uk/dp/${String(r.asin)}`} target="_blank" rel="noreferrer">
                                {String(r.asin)}
                              </a>
                            </div>
                            {details && details.length ? (
                              <details style={{ marginTop: 6 }}>
                                <summary style={{ ...muted, cursor: "pointer", color: "var(--text-secondary)" }}>
                                  {detailLabel}
                                </summary>
                                <table style={{ marginTop: 6, width: "auto", minWidth: 260 }}>
                                  <tbody>
                                    {details.map((d) => (
                                      <tr key={d.label}>
                                        <td
                                          style={{
                                            padding: "2px 12px 2px 0",
                                            fontSize: 12.5,
                                            color: d.strong ? "var(--text-primary)" : "var(--text-secondary)",
                                            fontWeight: d.strong ? 600 : 400,
                                          }}
                                        >
                                          {d.minus ? "− " : ""}
                                          {d.label}
                                          {d.note ? <span style={{ ...muted, marginLeft: 6 }}>{d.note}</span> : null}
                                        </td>
                                        <td
                                          className="tabular"
                                          style={{ padding: "2px 0", fontSize: 12.5, textAlign: "right", fontWeight: d.strong ? 600 : 400 }}
                                        >
                                          {d.value}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </details>
                            ) : null}
                          </>
                        ) : (
                          <>
                            {format(c.type, r[c.key])}
                            {c.subKey && r[c.subKey] ? (
                              <div style={{ ...muted, fontWeight: 400 }}>{String(r[c.subKey])}</div>
                            ) : null}
                          </>
                        )}
                      </td>
                    ))}
                    {listing ? (
                      <td style={td}>
                        <ListingOrderButtons
                          key={`${k}-${res && res !== "pending" ? (res.ok ? "ok" : "fail") : "init"}`}
                          opportunityId={Number(r[listing.idKey])}
                          initialListingStatus={
                            res && res !== "pending" && res.ok ? res.status ?? "live" : (r[listing.statusKey] as string | null)
                          }
                          initialListingIssues={
                            res && res !== "pending" && !res.ok
                              ? [res.error === "missing_required_attributes" ? `Missing: ${(res.missing ?? []).join(", ")}` : res.error ?? "Listing failed."]
                              : listing.issuesKey
                              ? (r[listing.issuesKey] as unknown[] | null)
                              : null
                          }
                        />
                        {res === "pending" ? <div style={muted}>Listing…</div> : null}
                      </td>
                    ) : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > visible.length ? (
        <div style={{ padding: "10px 12px", borderTop: "1px solid var(--gridline)" }}>
          <button type="button" onClick={() => setLimit((l) => l + pageSize)} style={linkBtn}>
            Show {num(Math.min(pageSize, filtered.length - visible.length))} more ({num(filtered.length - visible.length)} hidden)
          </button>
        </div>
      ) : null}
    </div>
  );
}

const linkBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "var(--accent)",
  cursor: "pointer",
  fontSize: 12.5,
  padding: 0,
  textAlign: "left",
};

function btn(color: string, disabled: boolean): React.CSSProperties {
  return {
    fontSize: 12.5,
    fontWeight: 600,
    padding: "6px 12px",
    borderRadius: 7,
    border: `1px solid ${color}`,
    color: disabled ? "var(--text-muted)" : color,
    borderColor: disabled ? "var(--border)" : color,
    background: "transparent",
    cursor: disabled ? "default" : "pointer",
    whiteSpace: "nowrap",
  };
}
