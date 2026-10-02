import { fetchDashboard } from "@/lib/fetchDashboard";
import { gbp, pct, num, relativeTime } from "@/lib/format";
import StatTile from "@/components/StatTile";
import Section from "@/components/Section";
import DataCard, { th, td, EmptyRow } from "@/components/DataCard";
import DataTable, { type Column, type DetailLine, type Row } from "@/components/DataTable";
import ExportCsvButton from "@/components/ExportCsvButton";
import { toCsvTable, type CsvColumn } from "@/lib/csv";
import AutoRefresh from "@/components/AutoRefresh";
import Badge from "@/components/Badge";
import type { BuyPlanRow, EligibleSku, SellableRow, UnlockAction, UnlockProduct, WatchRow } from "@/lib/types";

const pctText = (v: number | null) => (v != null ? (v * 100).toFixed(1) + "%" : null);

// Full export of everything sellable without brand approval (not just the fast sellers shown).
const SELLABLE_COLUMNS: CsvColumn<SellableRow>[] = [
  { label: "Supplier SKU", get: (r) => r.supplier_sku },
  { label: "ASIN", get: (r) => r.asin },
  { label: "Product", get: (r) => r.product_title },
  { label: "Brand", get: (r) => r.brand },
  { label: "Verdict", get: (r) => r.verdict },
  { label: "Reason", get: (r) => r.reason },
  { label: "Your sales per month", get: (r) => r.units_month },
  { label: "Listing sales per month (all sellers)", get: (r) => r.market_units_month },
  { label: "Sellers on listing", get: (r) => r.seller_count },
  { label: "Amazon on listing", get: (r) => (r.amazon_present ? "yes" : "no") },
  { label: "Live Buy Box", get: (r) => (r.live_buy_box ? "yes" : "no") },
  { label: "Selling price (GBP)", get: (r) => r.selling_price },
  { label: "Unit cost ex VAT (GBP)", get: (r) => r.unit_cost_ex_vat },
  { label: "Unit cost inc VAT (GBP)", get: (r) => r.unit_cost_inc_vat },
  { label: "Profit per unit (GBP)", get: (r) => r.profit_per_unit },
  { label: "Margin", get: (r) => pctText(r.margin) },
  { label: "ROI", get: (r) => pctText(r.roi) },
  { label: "Profit per month (GBP)", get: (r) => r.profit_month },
  { label: "30-day qty", get: (r) => r.qty_30d },
  { label: "30-day cash inc VAT (GBP)", get: (r) => r.cash_30d_inc_vat },
  { label: "BeautyFort stock", get: (r) => r.supplier_stock },
  { label: "Hazmat blocked (Amazon)", get: (r) => (r.hazmat_blocked ? "yes" : "no") },
  { label: "Last priced", get: (r) => r.last_priced_at },
];

const UNLOCK_PRODUCT_COLUMNS: CsvColumn<UnlockProduct>[] = [
  { label: "Approval needed", get: (u) => (u.blocker === "hazmat" ? "Dangerous goods (hazmat)" : `Brand: ${u.brand ?? "?"}`) },
  { label: "Supplier SKU", get: (u) => u.supplier_sku },
  { label: "ASIN", get: (u) => u.asin },
  { label: "Product", get: (u) => u.product_title },
  { label: "Unit cost ex VAT (GBP)", get: (u) => u.unit_cost_ex_vat },
  { label: "Profit per unit (GBP)", get: (u) => u.profit_per_unit },
  { label: "Margin", get: (u) => pctText(u.margin) },
  { label: "ROI", get: (u) => pctText(u.roi) },
  { label: "Your sales per month", get: (u) => u.units_month },
  { label: "Profit per month (GBP)", get: (u) => u.profit_month },
  { label: "30-day qty", get: (u) => u.qty_30d },
  { label: "30-day cash inc VAT (GBP)", get: (u) => u.cash_30d_inc_vat },
  { label: "BeautyFort stock", get: (u) => u.supplier_stock },
  { label: "This approval alone unlocks it", get: (u) => (u.unlocks_alone ? "yes" : "no — " + (u.blockers ?? []).join(", ")) },
];

// Supplier order sheet: exactly what to put on the BeautyFort PO.
const BUY_PLAN_COLUMNS: CsvColumn<BuyPlanRow>[] = [
  { label: "Rank", get: (r) => r.plan_rank },
  { label: "Supplier SKU", get: (r) => r.supplier_sku },
  { label: "ASIN", get: (r) => r.asin },
  { label: "Product", get: (r) => r.product_title },
  { label: "Brand", get: (r) => r.brand },
  { label: "Order qty", get: (r) => r.order_qty },
  { label: "Unit cost ex VAT (GBP)", get: (r) => r.unit_cost_ex_vat },
  { label: "Unit cost inc VAT (GBP)", get: (r) => r.unit_cost_inc_vat },
  { label: "Line cost ex VAT (GBP)", get: (r) => (r.unit_cost_ex_vat != null ? +(r.unit_cost_ex_vat * r.order_qty).toFixed(2) : null) },
  { label: "Line cost inc VAT (GBP)", get: (r) => r.order_cash_inc_vat },
  { label: "Selling price used (GBP)", get: (r) => r.selling_price },
  { label: "Price basis", get: (r) => priceBasisLabel(r.price_basis) },
  { label: "Live Buy Box (GBP)", get: (r) => r.live_buy_box },
  { label: "90-day avg Buy Box (GBP)", get: (r) => r.avg90_buy_box },
  { label: "VAT on sale (GBP)", get: (r) => vatOnSale(r) },
  { label: "Net of VAT (GBP)", get: (r) => r.net_revenue },
  { label: "Referral fee (GBP)", get: (r) => r.amazon_referral_fee },
  { label: "Referral rate", get: (r) => (r.referral_rate != null ? (r.referral_rate * 100).toFixed(1) + "%" : null) },
  { label: "FBA fee (GBP)", get: (r) => r.fba_fulfilment_fee },
  { label: "Digital services fee (GBP)", get: (r) => r.digital_services_fee },
  { label: "Total Amazon fees (GBP)", get: (r) => totalFees(r) },
  { label: "Prep centre per unit (GBP)", get: (r) => prepCost(r) },
  { label: "Profit per unit (GBP)", get: (r) => r.profit_per_unit },
  { label: "Margin", get: (r) => (r.margin != null ? (r.margin * 100).toFixed(1) + "%" : null) },
  { label: "ROI", get: (r) => (r.roi != null ? (r.roi * 100).toFixed(1) + "%" : null) },
  { label: "Expected sales per month (you)", get: (r) => r.est_units_month },
  { label: "Expected profit per month (GBP)", get: (r) => r.monthly_profit },
  { label: "Break-even price (GBP)", get: (r) => r.break_even_price },
  { label: "Max buy price ex VAT (GBP)", get: (r) => r.max_purchase_cost },
  { label: "Fees source", get: (r) => (r.fba_fee_source === "keepa_pick_and_pack" ? "Amazon (via Keepa)" : "estimated") },
  { label: "Last priced", get: (r) => r.last_priced_at },
  { label: "Sellers on listing", get: (r) => r.seller_count },
  { label: "Supplier stock", get: (r) => r.supplier_stock },
];

const WATCH_COLUMNS: CsvColumn<WatchRow>[] = [
  { label: "ASIN", get: (r) => r.asin },
  { label: "Product", get: (r) => r.product_title },
  { label: "Brand", get: (r) => r.brand },
  { label: "Expected profit per month (GBP)", get: (r) => r.est_monthly_profit },
  { label: "Expected sales per month (you)", get: (r) => r.est_units_month },
  { label: "Profit per unit (GBP)", get: (r) => r.profit_per_unit },
  { label: "What's blocking it", get: (r) => r.reason },
  { label: "Eligibility", get: (r) => r.eligibility },
];

const UNLOCK_COLUMNS: CsvColumn<UnlockAction>[] = [
  { label: "Action", get: (u) => unlockTitle(u) },
  { label: "Profitable products it opens up", get: (u) => u.products },
  { label: "Expected profit per month (GBP)", get: (u) => u.monthly_profit },
  { label: "Products this alone unlocks", get: (u) => u.unlocked_alone },
  { label: "Profit per month this alone unlocks (GBP)", get: (u) => u.monthly_profit_alone },
  { label: "Stock to buy inc VAT (GBP)", get: (u) => u.stock_cash_inc_vat },
];

/** Plain-English action for an approval blocker. */
function unlockTitle(u: UnlockAction): string {
  if (u.blocker === "hazmat") return "Get dangerous-goods (hazmat) approval";
  if (u.blocker === "brand_approval") return `Apply for ${u.brand ?? "brand"} approval`;
  return u.blocker.replace(/_/g, " ");
}

function unlockHow(u: UnlockAction): string {
  if (u.blocker === "hazmat")
    return "Get the safety data sheets (SDS) from BeautyFort and submit them in Seller Central for these fragrances/aerosols.";
  return "Seller Central → Add a Product → search one of the ASINs → Apply to sell (usually needs an invoice from an authorised distributor).";
}

const ELIGIBLE_SKU_COLUMNS: CsvColumn<EligibleSku>[] = [
  { label: "ASIN", get: (r) => r.asin },
  { label: "Product", get: (r) => r.product_title },
  { label: "Brand", get: (r) => r.brand },
  { label: "Supplier SKU", get: (r) => r.supplier_sku },
  { label: "Supplier stock", get: (r) => r.supplier_stock },
  { label: "Score", get: (r) => r.score },
  { label: "Margin", get: (r) => (r.margin != null ? (r.margin * 100).toFixed(1) + "%" : null) },
  { label: "ROI", get: (r) => (r.roi != null ? (r.roi * 100).toFixed(1) + "%" : null) },
  { label: "Contribution per unit (GBP)", get: (r) => r.contribution },
  { label: "Capital required (GBP)", get: (r) => r.capital_required },
  { label: "Sellers on listing", get: (r) => r.seller_count },
  { label: "Amazon on listing", get: (r) => (r.amazon_present ? "yes" : r.amazon_present === false ? "no" : null) },
  { label: "Last priced", get: (r) => r.last_priced_at },
  { label: "Risks", get: (r) => (r.risks && r.risks.length ? r.risks.join("; ") : r.opportunity_status ? "none" : null) },
  { label: "Opportunity status", get: (r) => r.opportunity_status ?? (r.last_priced_at ? "queued for scoring" : "awaiting price data") },
  { label: "Listing status", get: (r) => r.listing_status ?? "not listed" },
];

// ---- Interactive table definitions (plain data only — they cross into a client component) ----

const PLAN_TABLE: Column[] = [
  { key: "plan_rank", label: "#", type: "number" },
  { key: "product_title", label: "Product", type: "product", subKey: "product_sub" },
  { key: "selling_price", label: "Sells at", type: "gbp", subKey: "price_sub" },
  { key: "total_fees", label: "Amazon fees", type: "gbp", subKey: "fees_sub" },
  { key: "unit_cost_ex_vat", label: "Your cost", type: "gbp", subKey: "cost_sub" },
  { key: "profit_per_unit", label: "Profit / unit", type: "gbp", subKey: "margin_sub" },
  { key: "roi", label: "ROI", type: "pct" },
  { key: "order_qty", label: "Order", type: "number", subKey: "qty_sub" },
  { key: "order_cash_inc_vat", label: "Cost inc VAT", type: "gbp", subKey: "cash_sub" },
  { key: "est_units_month", label: "Sells / month", type: "number", subKey: "units_sub" },
  { key: "monthly_profit", label: "Profit / month", type: "gbp", good: true },
];

const SELL_NOW_TABLE: Column[] = [
  { key: "product_title", label: "Product", type: "product", subKey: "product_sub" },
  { key: "verdict", label: "Verdict", type: "badge" },
  { key: "reason", label: "Why", type: "text" },
  { key: "units_month", label: "Sells / month", type: "number", subKey: "units_sub" },
  { key: "seller_count", label: "Sellers", type: "number" },
  { key: "profit_per_unit", label: "Profit / unit", type: "gbp", subKey: "margin_sub" },
  { key: "roi", label: "ROI", type: "pct" },
  { key: "profit_month", label: "Profit / month", type: "gbp", good: true },
  { key: "qty_30d", label: "30-day qty", type: "number" },
  { key: "cash_30d_inc_vat", label: "30-day cash", type: "gbp" },
  { key: "supplier_stock", label: "BF stock", type: "number" },
];

const WATCH_TABLE: Column[] = [
  { key: "product_title", label: "Product", type: "product", subKey: "product_sub" },
  { key: "est_monthly_profit", label: "Profit / month", type: "gbp", good: true },
  { key: "est_units_month", label: "Sells / month", type: "number" },
  { key: "profit_per_unit", label: "Profit / unit", type: "gbp" },
  { key: "margin", label: "Margin", type: "pct" },
  { key: "reason", label: "What's blocking it", type: "text" },
  { key: "seller_count", label: "Sellers", type: "number" },
  { key: "amazon", label: "Amazon sells", type: "badge" },
];

const ELIGIBLE_TABLE: Column[] = [
  { key: "product_title", label: "Product", type: "product", subKey: "product_sub" },
  { key: "status", label: "Status", type: "badge" },
  { key: "score", label: "Score", type: "number" },
  { key: "margin", label: "Margin", type: "pct" },
  { key: "roi", label: "ROI", type: "pct" },
  { key: "contribution", label: "Profit / unit", type: "gbp" },
  { key: "seller_count", label: "Sellers", type: "number" },
  { key: "amazon", label: "Amazon sells", type: "badge" },
  { key: "risks", label: "Risks", type: "text" },
  { key: "supplier_stock", label: "Stock", type: "number" },
];

const yesNo = (v: boolean | null | undefined) => (v ? "yes" : v === false ? "no" : null);

/** Per-unit waterfall from selling price to profit, as plain lines for the expandable panel. */
function breakdownLines(r: BuyPlanRow): DetailLine[] {
  const keepaFees = r.fba_fee_source === "keepa_pick_and_pack";
  return [
    { label: "Selling price", value: gbp(r.selling_price), strong: true, note: priceBasisLabel(r.price_basis) },
    { label: "VAT on sale", value: gbp(vatOnSale(r)), minus: true },
    { label: "Referral fee", value: gbp(r.amazon_referral_fee), minus: true, note: r.referral_rate != null ? `${(r.referral_rate * 100).toFixed(1)}%` : undefined },
    { label: "FBA fee", value: gbp(r.fba_fulfilment_fee), minus: true, note: keepaFees ? "Amazon's fee for this item" : "estimate" },
    { label: "Digital services fee", value: gbp(r.digital_services_fee), minus: true },
    { label: "Prep centre", value: gbp(prepCost(r)), minus: true, note: "label + polybag" },
    { label: "Your cost ex VAT", value: gbp(r.effective_unit_cost ?? r.unit_cost_ex_vat), minus: true, note: "VAT reclaimed" },
    { label: "Profit per unit", value: gbp(r.profit_per_unit), strong: true, note: `${pct(r.margin, 1)} margin · ${pct(r.roi)} ROI` },
    { label: "Live Buy Box", value: gbp(r.live_buy_box) },
    { label: "30-day average", value: gbp(r.avg30_buy_box) },
    { label: "90-day average", value: gbp(r.avg90_buy_box) },
    { label: "Break-even price", value: gbp(r.break_even_price), note: "sell below this and you lose money" },
    { label: "Max you should pay", value: gbp(r.max_purchase_cost), note: "ex VAT, per unit" },
    { label: "Last priced", value: relativeTime(r.last_priced_at) },
  ];
}

/** Resolves the eligible-SKU status badge: real opportunity status once scored, otherwise where it sits in the pricing/scoring queue. */
function eligibleStatusLabel(r: EligibleSku): string {
  if (r.opportunity_status) return r.opportunity_status;
  return r.last_priced_at ? "queued_for_scoring" : "awaiting_price_data";
}

/** Why the order quantity is what it is: 30 days of expected sales, unless the supplier or the budget capped it. */
function qtyNote(r: BuyPlanRow): string | null {
  if (r.partial) return "cut to fit budget";
  if (r.supplier_stock != null && r.order_qty >= r.supplier_stock) return "all supplier stock";
  return null;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Output VAT Amazon collects on each sale: selling price less the net-of-VAT revenue scoring used. */
function vatOnSale(r: BuyPlanRow): number | null {
  return r.selling_price != null && r.net_revenue != null ? round2(r.selling_price - r.net_revenue) : null;
}

function totalFees(r: BuyPlanRow): number | null {
  if (r.amazon_referral_fee == null && r.fba_fulfilment_fee == null) return null;
  return round2((r.amazon_referral_fee ?? 0) + (r.fba_fulfilment_fee ?? 0) + (r.digital_services_fee ?? 0));
}

/**
 * Prep-centre cost per unit (label + polybag), as charged in scoring. Not stored as its own
 * field: it is exactly what is left after VAT, Amazon fees, product cost and profit.
 */
function prepCost(r: BuyPlanRow): number | null {
  if (r.net_revenue == null || r.profit_per_unit == null) return null;
  const cost = r.effective_unit_cost ?? r.unit_cost_ex_vat;
  if (cost == null) return null;
  const v = round2(
    r.net_revenue - (r.amazon_referral_fee ?? 0) - (r.fba_fulfilment_fee ?? 0) - (r.digital_services_fee ?? 0) - cost - r.profit_per_unit
  );
  return v > 0 ? v : 0;
}

function priceBasisLabel(basis: string | null): string {
  switch (basis) {
    case "live_buy_box":
      return "live Buy Box";
    case "avg90_buy_box":
      return "90-day average (live price is above it)";
    case "avg30_buy_box_no_live":
      return "30-day average (no live Buy Box)";
    case "avg90_buy_box_no_live":
      return "90-day average (no live Buy Box)";
    default:
      return "unknown";
  }
}

/** Expandable list of the products one approval opens up (pick an ASIN to apply with). */
function UnlockProductList({ products }: { products: UnlockProduct[] }) {
  if (!products.length) return null;
  const cell: React.CSSProperties = { padding: "4px 10px 4px 0", fontSize: 12, verticalAlign: "top" };
  return (
    <details style={{ marginTop: 6 }}>
      <summary style={{ ...muted, cursor: "pointer", color: "var(--text-secondary)" }}>
        Show {num(products.length)} product{products.length === 1 ? "" : "s"}
      </summary>
      <div style={{ overflowX: "auto", marginTop: 6 }}>
        <table>
          <thead>
            <tr>
              {["Product", "Profit / unit", "Sells / month", "Profit / month", "30 days", "BF stock"].map((h) => (
                <th key={h} style={{ ...cell, ...muted, textAlign: "left", fontWeight: 600 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={`${p.blocker}-${p.asin}`}>
                <td style={{ ...cell, maxWidth: 300 }}>
                  {p.product_title ?? "—"}
                  <div style={muted}>
                    {p.supplier_sku ? `${p.supplier_sku} · ` : ""}
                    <a href={`https://www.amazon.co.uk/dp/${p.asin}`} target="_blank" rel="noreferrer">
                      {p.asin}
                    </a>
                    {p.unlocks_alone ? "" : " · also needs: " + (p.blockers ?? []).filter((b) => b !== p.blocker).join(", ").replace(/_/g, " ")}
                  </div>
                </td>
                <td style={cell} className="tabular">
                  {gbp(p.profit_per_unit)}
                  <div style={muted}>{pct(p.margin)} margin</div>
                </td>
                <td style={cell} className="tabular">
                  {num(p.units_month)}
                </td>
                <td style={{ ...cell, fontWeight: 600 }} className="tabular">
                  {gbp(p.profit_month)}
                </td>
                <td style={cell} className="tabular">
                  {num(p.qty_30d)} · {gbp(p.cash_30d_inc_vat)}
                </td>
                <td style={cell} className="tabular">
                  {p.supplier_stock != null ? num(p.supplier_stock) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

const muted: React.CSSProperties = { fontSize: 11.5, color: "var(--text-muted)" };

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const { data, error } = await fetchDashboard();

  if (error || !data) {
    return (
      <main style={{ maxWidth: 640, margin: "80px auto", padding: "0 20px", fontFamily: "system-ui, sans-serif" }}>
        <h1 style={{ fontSize: 20 }}>Dashboard unavailable</h1>
        <p style={{ color: "#a33", fontSize: 14 }}>{error ?? "Unknown error."}</p>
        <p style={{ color: "#666", fontSize: 13 }}>
          Check that <code>DASHBOARD_API_URL</code> and <code>DASHBOARD_API_KEY</code> are set correctly in this
          project&apos;s environment variables, and that the n8n &quot;Dashboard Data API (39)&quot; workflow is
          active.
        </p>
      </main>
    );
  }

  const plan = data.buy_plan ?? [];
  const watch = data.watch_list ?? [];
  const unlocks = data.unlock_actions ?? [];
  const unlockProducts = data.unlock_products ?? [];
  const productsFor = (u: UnlockAction) =>
    unlockProducts.filter((p) => p.blocker === u.blocker && (p.brand ?? null) === (u.brand ?? null));
  const sellable = data.sellable_now ?? [];
  // SKIP covers products you've excluded (e.g. ones you've decided not to sell) and restricted ASINs.
  const fastSellers = sellable.filter(
    (r) => (r.profit_per_unit ?? 0) > 0 && !r.hazmat_blocked && (r.units_month ?? 0) > 0 && r.verdict !== "SKIP"
  );

  // Plain rows for the interactive tables (formatted secondary lines are built here, on the server).
  const planRows: Row[] = plan.map((r) => {
    const note = qtyNote(r);
    return {
      ...r,
      product_sub: [r.brand, r.supplier_sku, r.seller_count != null ? `${num(r.seller_count)} sellers` : null, r.amazon_present ? "Amazon on listing" : null]
        .filter(Boolean)
        .join(" · "),
      price_sub: r.price_basis === "live_buy_box" ? "live price" : "90-day avg",
      total_fees: totalFees(r),
      fees_sub: `${gbp(r.amazon_referral_fee)} + ${gbp(r.fba_fulfilment_fee)} FBA`,
      cost_sub: "ex VAT",
      margin_sub: `${pct(r.margin)} margin`,
      qty_sub: note,
      cash_sub: `${gbp(r.unit_cost_inc_vat)} each`,
      units_sub: `of ${num(r.market_units_month)} total`,
      details: breakdownLines(r),
    };
  });
  const sellRows: Row[] = fastSellers.map((r) => ({
    ...r,
    product_sub: [r.brand, r.supplier_sku].filter(Boolean).join(" · "),
    reason: r.verdict === "BUY" ? null : r.reason,
    units_sub: `of ${num(r.market_units_month)}${r.amazon_present ? " · Amazon sells" : ""}`,
    margin_sub: `${pct(r.margin)} margin`,
  }));
  const watchRows: Row[] = watch.map((w) => ({ ...w, product_sub: w.brand ?? "", amazon: yesNo(w.amazon_present) }));
  const eligibleRows: Row[] = data.eligible_skus.map((r) => ({
    ...r,
    product_sub: [r.brand, r.supplier_sku].filter(Boolean).join(" · "),
    status: eligibleStatusLabel(r),
    amazon: yesNo(r.amazon_present),
    risks: r.risks && r.risks.length ? r.risks.join(", ").replace(/_/g, " ") : r.opportunity_status ? "clean" : "not scored yet",
  }));
  const unlockProfit = unlocks.reduce((sum, u) => sum + (u.monthly_profit_alone ?? 0), 0);
  const s = data.buy_plan_summary;
  const budget = s?.budget_inc_vat ?? null;
  const spend = s?.planned_cash_inc_vat ?? 0;
  const monthlyProfit = s?.planned_monthly_profit ?? 0;
  const monthlyReturn = spend > 0 ? monthlyProfit / spend : null;
  const unspent = budget != null ? Math.max(0, budget - spend) : null;
  const watchProfit = watch.reduce((sum, w) => sum + (w.est_monthly_profit ?? 0), 0);

  return (
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 20px 64px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 8 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>What to buy</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "2px 0 0" }}>
            BeautyFort — the products that make the most profit per month for your budget, live from the automation
            pipeline
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 12.5, color: "var(--text-muted)" }} className="tabular">
            Updated {relativeTime(data.generated_at)}
          </div>
          <AutoRefresh />
        </div>
      </header>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
        <StatTile
          label="Spend"
          value={gbp(spend)}
          sub={budget != null ? `of ${gbp(budget)} budget inc VAT` : "inc VAT"}
        />
        <StatTile label="Profit per month" value={gbp(monthlyProfit)} tone="good" sub="expected, after all Amazon fees" />
        <StatTile
          label="Monthly return"
          value={monthlyReturn != null ? pct(monthlyReturn) : "—"}
          sub="profit per month ÷ cash spent"
        />
        <StatTile
          label="Products"
          value={num(s?.planned_lines ?? 0)}
          sub={`${num(s?.planned_units ?? 0)} units to order`}
        />
      </div>

      {s ? (
        <p style={{ ...muted, fontSize: 12.5, margin: "12px 2px 0" }}>
          {num(s.buy_count)} BUY · {num(s.watch_count)} WATCH · {num(s.skip_count)} SKIP across {num(s.total_scored)}{" "}
          scored products. {num(s.priced_last_24h)} of them have prices from the last 24 hours — the rest refresh at
          35 products every 15 minutes, so this list firms up as fresh prices arrive.
          {unspent != null && unspent >= 1 && plan.length > 0
            ? ` ${gbp(unspent)} of the budget is unused because nothing else currently clears every check.`
            : null}
        </p>
      ) : null}

      <Section
        title="Buy plan"
        sub="Ranked by profit per month for every pound spent. Each quantity is 30 days of the sales you can expect after splitting the listing with the other sellers, capped by supplier stock and the budget. Profit uses Amazon's real referral and FBA fees for each product plus your prep-centre cost, and never assumes a price above the 90-day average. Listings are priced at the Buy Box but never below your 40% ROI floor."
        right={<ExportCsvButton {...toCsvTable(plan, BUY_PLAN_COLUMNS)} filenamePrefix="buy-plan" label="Export order sheet" />}
      >
        <DataCard>
          <DataTable
            rows={planRows}
            columns={PLAN_TABLE}
            rowKey="asin"
            listing={{ idKey: "opportunity_id", statusKey: "listing_status" }}
            detailKey="details"
            detailLabel="Price & fees"
            initialSort={{ key: "plan_rank", dir: "asc" }}
            emptyLabel="Nothing clears every check right now — the approvals below are what would change that."
          />
        </DataCard>
      </Section>

      <Section
        title="Sell now — fast sellers"
        sub={`All ${num(
          fastSellers.length
        )} products you can list today without brand approval that make a profit after every fee and prep cost, fastest-selling first. The export has all ${num(
          sellable.length
        )} sellable products, including ones that don't currently make money.`}
        right={
          <ExportCsvButton
            {...toCsvTable(sellable, SELLABLE_COLUMNS)}
            filenamePrefix="sellable-now"
            label="Export all sellable"
          />
        }
      >
        <DataCard>
          <DataTable
            rows={sellRows}
            columns={SELL_NOW_TABLE}
            rowKey="asin"
            listing={{ idKey: "opportunity_id", statusKey: "listing_status", issuesKey: "listing_issues" }}
            initialSort={{ key: "units_month", dir: "desc" }}
            pageSize={40}
            emptyLabel="No profitable sellable products with sales data yet."
          />
        </DataCard>
      </Section>

      <Section
        title="Unlock more profit"
        sub={`Approvals that open up products which already clear every profit check — ranked by the profit they'd add each month.${
          unlockProfit > 0 ? ` Doing all of these unlocks at least ${gbp(unlockProfit)}/month on their own.` : ""
        } Numbers grow as more of the catalogue gets priced.`}
        right={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <ExportCsvButton {...toCsvTable(unlocks, UNLOCK_COLUMNS)} filenamePrefix="unlock-actions" label="Export approvals" />
            <ExportCsvButton
              {...toCsvTable(unlockProducts, UNLOCK_PRODUCT_COLUMNS)}
              filenamePrefix="unlock-products"
              label="Export all products"
            />
          </div>
        }
      >
        <DataCard>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th style={th}>Action</th>
                  <th style={th}>Profit / month</th>
                  <th style={th}>Products</th>
                  <th style={th}>Stock to buy</th>
                </tr>
              </thead>
              <tbody>
                {unlocks.length === 0 ? (
                  <EmptyRow colSpan={4} label="No approval-blocked products with sales data yet — this fills in as prices refresh." />
                ) : (
                  unlocks.map((u) => (
                    <tr key={`${u.blocker}-${u.brand ?? ""}`}>
                      <td style={{ ...td, maxWidth: 460 }}>
                        <span style={{ fontWeight: 600 }}>{unlockTitle(u)}</span>
                        <div style={muted}>{unlockHow(u)}</div>
                        <UnlockProductList products={productsFor(u)} />
                      </td>
                      <td style={{ ...td, fontWeight: 600, color: "var(--status-good)" }} className="tabular">
                        {gbp(u.monthly_profit)}
                        {u.unlocked_alone < u.products ? (
                          <div style={{ ...muted, fontWeight: 400 }}>{gbp(u.monthly_profit_alone)} on its own</div>
                        ) : null}
                      </td>
                      <td style={td} className="tabular">
                        {num(u.products)}
                        {u.unlocked_alone < u.products ? (
                          <div style={muted}>{num(u.products - u.unlocked_alone)} also need another approval</div>
                        ) : null}
                      </td>
                      <td style={td} className="tabular">
                        {gbp(u.stock_cash_inc_vat)}
                        <div style={muted}>inc VAT, first 30 days</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DataCard>
      </Section>

      <Section
        title="Close to profitable"
        sub={`Individual products held back by one thing — ranked by expected profit per month${
          watch.length ? ` (${gbp(watchProfit)}/month across these ${num(watch.length)})` : ""
        }.`}
        right={<ExportCsvButton {...toCsvTable(watch, WATCH_COLUMNS)} filenamePrefix="watch-list" />}
      >
        <DataCard>
          <DataTable
            rows={watchRows}
            columns={WATCH_TABLE}
            rowKey="asin"
            initialSort={{ key: "est_monthly_profit", dir: "desc" }}
            emptyLabel="Nothing on the watch list has sales data yet."
          />
        </DataCard>
      </Section>

      <Section
        title="Eligible SKUs"
        collapsible
        sub={`Every catalog SKU cleared by Amazon's SP-API restrictions check. ${num(
          data.eligible_skus_summary.scored
        )} of ${num(data.eligible_skus_summary.total_eligible)} have been scored so far.`}
        right={
          <ExportCsvButton
            {...toCsvTable(data.eligible_skus, ELIGIBLE_SKU_COLUMNS)}
            filenamePrefix="eligible-skus"
            label="Export all eligible"
          />
        }
      >
        <DataCard>
          <DataTable
            rows={eligibleRows}
            columns={ELIGIBLE_TABLE}
            rowKey="asin"
            initialSort={{ key: "score", dir: "desc" }}
            emptyLabel="No eligible SKUs yet."
          />
        </DataCard>
      </Section>

      <footer style={{ marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--gridline)", fontSize: 12, color: "var(--text-muted)" }}>
        All figures come straight from the n8n automation pipeline&apos;s Postgres database. Sales per month are
        Keepa&apos;s published monthly sales or, where Keepa doesn&apos;t publish one, 30-day sales-rank drops (a
        conservative undercount), split evenly across the sellers on the listing. Nothing on this page is
        AI-generated. Generated at {new Date(data.generated_at).toLocaleString("en-GB")}.
      </footer>
    </main>
  );
}
