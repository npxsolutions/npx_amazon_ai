import { fetchDashboard } from "@/lib/fetchDashboard";
import { gbp, pct, num, relativeTime, truthy } from "@/lib/format";
import StatTile from "@/components/StatTile";
import Section from "@/components/Section";
import DataCard, { th, td, EmptyRow } from "@/components/DataCard";
import ListingOrderButtons from "@/components/ListingOrderButtons";
import ExportCsvButton from "@/components/ExportCsvButton";
import { toCsvTable, type CsvColumn } from "@/lib/csv";
import AutoRefresh from "@/components/AutoRefresh";
import Badge from "@/components/Badge";
import type { BuyCandidate, EligibleSku } from "@/lib/types";

const BUY_LIST_COLUMNS: CsvColumn<BuyCandidate>[] = [
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
  { label: "Opportunity status", get: (r) => r.opportunity_status ?? "not yet scored" },
  { label: "Listing status", get: (r) => r.listing_status ?? "not listed" },
];

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

  const buyList = data.buy_candidates.filter((c) => truthy(c.listable));
  const totalContribution = buyList.reduce(
    (sum, c) => sum + (c.contribution ?? 0) * (c.quantity_to_order ?? 0),
    0
  );
  const totalCapital = buyList.reduce((sum, c) => sum + (c.capital_required ?? 0), 0);
  const liveCount = buyList.filter((c) => c.listing_status === "live" || c.listing_status === "already_live").length;
  const eligibleTop50 = data.eligible_skus.slice(0, 50);

  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 20px 64px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 8 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Buy List</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "2px 0 0" }}>
            BeautyFort — buy candidates cleared to sell on Amazon right now, live from the automation pipeline
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
        <StatTile label="Listable now" value={num(buyList.length)} tone="good" />
        <StatTile label="Listings live" value={num(liveCount)} sub={`of ${num(buyList.length)} listable`} />
        <StatTile label="Potential contribution" value={gbp(totalContribution)} sub="if fully ordered" />
        <StatTile label="Capital required" value={gbp(totalCapital)} sub="to order the full list" />
      </div>

      <Section
        title="Buy list"
        sub="Cleared by Amazon's real SP-API restrictions check — create the listing via SP-API, then place a test-mode BeautyFort order once it's live. Product type and attributes are looked up live from Amazon's own Catalog API for the ASIN."
        right={<ExportCsvButton {...toCsvTable(buyList, BUY_LIST_COLUMNS)} filenamePrefix="buy-list" />}
      >
        <DataCard>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th style={th}>ASIN</th>
                  <th style={th}>Product</th>
                  <th style={th}>Score</th>
                  <th style={th}>Selling price</th>
                  <th style={th}>Margin</th>
                  <th style={th}>ROI</th>
                  <th style={th}>Contribution</th>
                  <th style={th}>Qty to order</th>
                  <th style={th}>Capital required</th>
                  <th style={th}>Listing / Order</th>
                </tr>
              </thead>
              <tbody>
                {buyList.length === 0 ? (
                  <EmptyRow colSpan={10} label="No listable buy candidates right now." />
                ) : (
                  buyList.map((c) => (
                    <tr key={c.asin}>
                      <td style={td}>
                        <a href={`https://www.amazon.co.uk/dp/${c.asin}`} target="_blank" rel="noreferrer">
                          {c.asin}
                        </a>
                      </td>
                      <td style={td}>
                        {c.product_title ?? "—"}
                        {c.brand ? <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.brand}</div> : null}
                      </td>
                      <td style={{ ...td }} className="tabular">
                        {num(c.score)}
                      </td>
                      <td style={{ ...td }} className="tabular">
                        {gbp(c.selling_price)}
                      </td>
                      <td style={{ ...td }} className="tabular">
                        {pct(c.margin)}
                      </td>
                      <td style={{ ...td }} className="tabular">
                        {pct(c.roi)}
                      </td>
                      <td style={{ ...td, fontWeight: 600 }} className="tabular">
                        {gbp(c.contribution)}
                      </td>
                      <td style={{ ...td }} className="tabular">
                        {num(c.quantity_to_order)}
                        {c.supplier_stock != null ? (
                          <span style={{ color: "var(--text-muted)" }}> / {num(c.supplier_stock)} in stock</span>
                        ) : null}
                      </td>
                      <td style={{ ...td }} className="tabular">
                        {gbp(c.capital_required)}
                      </td>
                      <td style={td}>
                        <ListingOrderButtons
                          opportunityId={c.opportunity_id}
                          initialListingStatus={c.listing_status}
                          initialListingIssues={c.listing_issues}
                        />
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
        sub={`Every catalog SKU cleared by Amazon's real SP-API restrictions check — top 50 by score. ${num(
          data.eligible_skus_summary.scored
        )} of ${num(data.eligible_skus_summary.total_eligible)} have gone through profitability scoring so far; the rest are awaiting fresh price/competition data before they can be scored.`}
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
                  <th style={th}>Supplier SKU</th>
                  <th style={th}>Score</th>
                  <th style={th}>Margin</th>
                  <th style={th}>ROI</th>
                  <th style={th}>Contribution</th>
                  <th style={th}>Stock</th>
                  <th style={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {eligibleTop50.length === 0 ? (
                  <EmptyRow colSpan={9} label="No eligible SKUs yet." />
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
                        {r.brand ? <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.brand}</div> : null}
                      </td>
                      <td style={td}>{r.supplier_sku ?? "—"}</td>
                      <td style={{ ...td }} className="tabular">
                        {r.score != null ? num(r.score) : <span style={{ color: "var(--text-muted)" }}>not scored</span>}
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
                      <td style={{ ...td }} className="tabular">
                        {r.supplier_stock != null ? num(r.supplier_stock) : "—"}
                      </td>
                      <td style={td}>
                        <Badge label={r.opportunity_status ?? (r.listing_status ?? "not scored")} />
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
        All figures come straight from the n8n automation pipeline&apos;s Postgres database — nothing on this page is
        estimated or AI-generated. Generated at {new Date(data.generated_at).toLocaleString("en-GB")}.
      </footer>
    </main>
  );
}
