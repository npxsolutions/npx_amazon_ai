import { fetchDashboard } from "@/lib/fetchDashboard";
import { gbp, pct, num, relativeTime } from "@/lib/format";
import StatTile from "@/components/StatTile";
import Section from "@/components/Section";
import DataCard, { th, td, EmptyRow } from "@/components/DataCard";
import ListingOrderButtons from "@/components/ListingOrderButtons";
import ExportCsvButton from "@/components/ExportCsvButton";
import { toCsvTable, type CsvColumn } from "@/lib/csv";
import AutoRefresh from "@/components/AutoRefresh";
import Badge from "@/components/Badge";
import type { BuyPlanRow, EligibleSku, UnlockAction, WatchRow } from "@/lib/types";

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

/** Small inline row of risk-flag badges, or a reassuring "Clean" tag when there are none. */
function RiskChips({ risks }: { risks: string[] | null | undefined }) {
  if (!risks || risks.length === 0) {
    return <Badge label="clean" tone="good" />;
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      {risks.map((r) => (
        <Badge key={r} label={r} />
      ))}
    </div>
  );
}

/** Competition signal: seller count plus a flag when Amazon itself is on the listing. */
function CompetitionCell({
  sellerCount,
  amazonPresent,
}: {
  sellerCount: number | null | undefined;
  amazonPresent: boolean | null | undefined;
}) {
  if (sellerCount == null && amazonPresent == null) {
    return <span style={{ color: "var(--text-muted)" }}>no price data</span>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span className="tabular">{sellerCount != null ? `${num(sellerCount)} sellers` : "—"}</span>
      {amazonPresent ? (
        <span style={{ fontSize: 11, color: "var(--status-serious)", fontWeight: 600 }}>Amazon on listing</span>
      ) : null}
    </div>
  );
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

/** Per-unit waterfall from selling price to profit, plus the price and fee evidence behind it. */
function Breakdown({ r }: { r: BuyPlanRow }) {
  const line = (label: string, value: string, opts: { minus?: boolean; strong?: boolean; note?: string } = {}) => (
    <tr>
      <td style={{ padding: "3px 12px 3px 0", color: opts.strong ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: opts.strong ? 600 : 400 }}>
        {opts.minus ? "− " : ""}
        {label}
        {opts.note ? <span style={{ ...muted, marginLeft: 6 }}>{opts.note}</span> : null}
      </td>
      <td className="tabular" style={{ padding: "3px 0", textAlign: "right", fontWeight: opts.strong ? 600 : 400 }}>
        {value}
      </td>
    </tr>
  );
  const keepaFees = r.fba_fee_source === "keepa_pick_and_pack";
  return (
    <div style={{ display: "flex", gap: 32, flexWrap: "wrap", fontSize: 12.5 }}>
      <table style={{ minWidth: 260 }}>
        <tbody>
          {line("Selling price", gbp(r.selling_price), { strong: true, note: priceBasisLabel(r.price_basis) })}
          {line("VAT on sale", gbp(vatOnSale(r)), { minus: true })}
          {line(
            "Referral fee",
            gbp(r.amazon_referral_fee),
            { minus: true, note: r.referral_rate != null ? `${(r.referral_rate * 100).toFixed(1)}%` : undefined }
          )}
          {line("FBA fee", gbp(r.fba_fulfilment_fee), { minus: true, note: keepaFees ? "Amazon's fee for this item" : "estimate" })}
          {line("Digital services fee", gbp(r.digital_services_fee), { minus: true })}
          {line("Your cost ex VAT", gbp(r.effective_unit_cost ?? r.unit_cost_ex_vat), { minus: true, note: "VAT reclaimed" })}
          {line("Profit per unit", gbp(r.profit_per_unit), { strong: true, note: `${pct(r.margin, 1)} margin · ${pct(r.roi)} ROI` })}
        </tbody>
      </table>
      <table style={{ minWidth: 240 }}>
        <tbody>
          {line("Live Buy Box", gbp(r.live_buy_box))}
          {line("30-day average", gbp(r.avg30_buy_box))}
          {line("90-day average", gbp(r.avg90_buy_box))}
          {line("Break-even price", gbp(r.break_even_price), { note: "sell below this and you lose money" })}
          {line("Max you should pay", gbp(r.max_purchase_cost), { note: "ex VAT, per unit" })}
          {line("Cash per unit", gbp(r.unit_cost_inc_vat), { note: "inc VAT" })}
          {line("Last priced", relativeTime(r.last_priced_at))}
        </tbody>
      </table>
    </div>
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
  const unlockProfit = unlocks.reduce((sum, u) => sum + (u.monthly_profit_alone ?? 0), 0);
  const s = data.buy_plan_summary;
  const budget = s?.budget_inc_vat ?? null;
  const spend = s?.planned_cash_inc_vat ?? 0;
  const monthlyProfit = s?.planned_monthly_profit ?? 0;
  const monthlyReturn = spend > 0 ? monthlyProfit / spend : null;
  const unspent = budget != null ? Math.max(0, budget - spend) : null;
  const watchProfit = watch.reduce((sum, w) => sum + (w.est_monthly_profit ?? 0), 0);
  const eligibleTop50 = data.eligible_skus.slice(0, 50);

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
        sub="Ranked by profit per month for every pound spent. Each quantity is 30 days of the sales you can expect after splitting the listing with the other sellers, capped by supplier stock and the budget. Profit uses Amazon's real referral and FBA fees for each product and never assumes a price above the 90-day average."
        right={<ExportCsvButton {...toCsvTable(plan, BUY_PLAN_COLUMNS)} filenamePrefix="buy-plan" label="Export order sheet" />}
      >
        <DataCard>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th style={th}>#</th>
                  <th style={th}>Product</th>
                  <th style={th}>Sells at</th>
                  <th style={th}>Amazon fees</th>
                  <th style={th}>Your cost</th>
                  <th style={th}>Profit / unit</th>
                  <th style={th}>Order</th>
                  <th style={th}>Cost inc VAT</th>
                  <th style={th}>Sells / month</th>
                  <th style={th}>Profit / month</th>
                  <th style={th}>Listing / Order</th>
                </tr>
              </thead>
              <tbody>
                {plan.length === 0 ? (
                  <EmptyRow
                    colSpan={11}
                    label="Nothing clears every check right now — the approvals below are what would change that."
                  />
                ) : (
                  plan.map((r) => {
                    const note = qtyNote(r);
                    return (
                      <tr key={r.asin}>
                        <td style={{ ...td, color: "var(--text-muted)" }} className="tabular">
                          {r.plan_rank}
                        </td>
                        <td style={{ ...td, maxWidth: 320 }}>
                          {r.product_title ?? "—"}
                          <div style={muted}>
                            {[r.brand, r.supplier_sku].filter(Boolean).join(" · ")}
                            {" · "}
                            <a href={`https://www.amazon.co.uk/dp/${r.asin}`} target="_blank" rel="noreferrer">
                              {r.asin}
                            </a>
                          </div>
                          <div style={{ ...muted, marginTop: 2 }}>
                            {r.seller_count != null ? `${num(r.seller_count)} sellers` : "sellers unknown"}
                            {r.amazon_present ? " · Amazon on listing" : ""}
                          </div>
                          <details style={{ marginTop: 6 }}>
                            <summary style={{ ...muted, cursor: "pointer", color: "var(--text-secondary)" }}>
                              Price &amp; fees
                            </summary>
                            <div style={{ marginTop: 8 }}>
                              <Breakdown r={r} />
                            </div>
                          </details>
                        </td>
                        <td style={td} className="tabular">
                          {gbp(r.selling_price)}
                          <div style={muted}>{r.price_basis === "live_buy_box" ? "live price" : "90-day avg"}</div>
                        </td>
                        <td style={td} className="tabular">
                          {gbp(totalFees(r))}
                          <div style={muted}>
                            {gbp(r.amazon_referral_fee)} + {gbp(r.fba_fulfilment_fee)} FBA
                          </div>
                        </td>
                        <td style={td} className="tabular">
                          {gbp(r.unit_cost_ex_vat)}
                          <div style={muted}>ex VAT</div>
                        </td>
                        <td style={{ ...td, fontWeight: 600 }} className="tabular">
                          {gbp(r.profit_per_unit)}
                          <div style={{ ...muted, fontWeight: 400 }}>
                            {pct(r.margin)} margin · {pct(r.roi)} ROI
                          </div>
                        </td>
                        <td style={{ ...td, fontWeight: 600 }} className="tabular">
                          {num(r.order_qty)}
                          {note ? <div style={{ ...muted, fontWeight: 400 }}>{note}</div> : null}
                        </td>
                        <td style={td} className="tabular">
                          {gbp(r.order_cash_inc_vat)}
                          <div style={muted}>{gbp(r.unit_cost_inc_vat)} each</div>
                        </td>
                        <td style={td} className="tabular">
                          {num(r.est_units_month)}
                          <div style={muted}>of {num(r.market_units_month)} total</div>
                        </td>
                        <td style={{ ...td, fontWeight: 600, color: "var(--status-good)" }} className="tabular">
                          {gbp(r.monthly_profit)}
                        </td>
                        <td style={td}>
                          <ListingOrderButtons
                            opportunityId={r.opportunity_id}
                            initialListingStatus={r.listing_status}
                            initialListingIssues={null}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </DataCard>
      </Section>

      <Section
        title="Unlock more profit"
        sub={`Approvals that open up products which already clear every profit check — ranked by the profit they'd add each month.${
          unlockProfit > 0 ? ` Doing all of these unlocks at least ${gbp(unlockProfit)}/month on their own.` : ""
        } Numbers grow as more of the catalogue gets priced.`}
        right={<ExportCsvButton {...toCsvTable(unlocks, UNLOCK_COLUMNS)} filenamePrefix="unlock-actions" />}
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
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th style={th}>Product</th>
                  <th style={th}>Profit / month</th>
                  <th style={th}>Profit / unit</th>
                  <th style={th}>What&apos;s blocking it</th>
                  <th style={th}>Competition</th>
                </tr>
              </thead>
              <tbody>
                {watch.length === 0 ? (
                  <EmptyRow colSpan={5} label="Nothing on the watch list has sales data yet." />
                ) : (
                  watch.map((w) => (
                    <tr key={w.asin}>
                      <td style={{ ...td, maxWidth: 320 }}>
                        {w.product_title ?? "—"}
                        <div style={muted}>
                          {w.brand ? `${w.brand} · ` : null}
                          <a href={`https://www.amazon.co.uk/dp/${w.asin}`} target="_blank" rel="noreferrer">
                            {w.asin}
                          </a>
                        </div>
                      </td>
                      <td style={{ ...td, fontWeight: 600 }} className="tabular">
                        {gbp(w.est_monthly_profit)}
                        <div style={{ ...muted, fontWeight: 400 }}>{num(w.est_units_month)} sales/month</div>
                      </td>
                      <td style={td} className="tabular">
                        {gbp(w.profit_per_unit)}
                        <div style={muted}>margin {pct(w.margin)}</div>
                      </td>
                      <td style={td}>{w.reason ?? "—"}</td>
                      <td style={td}>
                        <CompetitionCell sellerCount={w.seller_count} amazonPresent={w.amazon_present} />
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
        title="Eligible SKUs"
        collapsible
        sub={`Every catalog SKU cleared by Amazon's SP-API restrictions check — top 50 by score. ${num(
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
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th style={th}>ASIN</th>
                  <th style={th}>Product</th>
                  <th style={th}>Status</th>
                  <th style={th}>Score</th>
                  <th style={th}>Margin</th>
                  <th style={th}>ROI</th>
                  <th style={th}>Contribution</th>
                  <th style={th}>Competition</th>
                  <th style={th}>Risks</th>
                  <th style={th}>Stock</th>
                </tr>
              </thead>
              <tbody>
                {eligibleTop50.length === 0 ? (
                  <EmptyRow colSpan={10} label="No eligible SKUs yet." />
                ) : (
                  eligibleTop50.map((r) => (
                    <tr key={r.asin}>
                      <td style={td}>
                        <a href={`https://www.amazon.co.uk/dp/${r.asin}`} target="_blank" rel="noreferrer">
                          {r.asin}
                        </a>
                      </td>
                      <td style={td}>
                        {r.product_title ?? "—"}
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {[r.brand, r.supplier_sku].filter(Boolean).join(" · ") || null}
                        </div>
                      </td>
                      <td style={td}>
                        <Badge label={eligibleStatusLabel(r)} />
                      </td>
                      <td style={{ ...td }} className="tabular">
                        {r.score != null ? num(r.score) : <span style={{ color: "var(--text-muted)" }}>—</span>}
                      </td>
                      <td style={{ ...td }} className="tabular">
                        {pct(r.margin)}
                      </td>
                      <td style={{ ...td }} className="tabular">
                        {pct(r.roi)}
                      </td>
                      <td style={{ ...td, fontWeight: 600 }} className="tabular">
                        {gbp(r.contribution)}
                      </td>
                      <td style={td}>
                        <CompetitionCell sellerCount={r.seller_count} amazonPresent={r.amazon_present} />
                      </td>
                      <td style={td}>
                        {r.opportunity_status ? (
                          <RiskChips risks={r.risks} />
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>not scored yet</span>
                        )}
                      </td>
                      <td style={{ ...td }} className="tabular">
                        {r.supplier_stock != null ? num(r.supplier_stock) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
