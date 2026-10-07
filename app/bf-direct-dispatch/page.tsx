import { fetchBfDirectDispatch } from "@/lib/fetchBfDirectDispatch";
import { gbp, num, relativeTime } from "@/lib/format";
import NavTabs from "@/components/NavTabs";
import StatTile from "@/components/StatTile";
import Section from "@/components/Section";
import DataCard from "@/components/DataCard";
import BfDirectDispatchTable from "@/components/BfDirectDispatchTable";

export const dynamic = "force-dynamic";

export const metadata = { title: "BF Direct Dispatch — NPX Amazon Control Center" };

export default async function BfDirectDispatchPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const { scope: scopeParam } = await searchParams;
  const scope = scopeParam === "all" ? "all" : "ungated";
  const { data, error } = await fetchBfDirectDispatch(scope);

  if (!data) {
    return (
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 20px 64px" }}>
        <NavTabs active="bf-dd" />
        <h1 style={{ fontSize: 20 }}>BF Direct Dispatch unavailable</h1>
        <p style={{ color: "var(--text-muted)" }}>{error}</p>
      </main>
    );
  }

  const rows = data.rows;
  const ready = rows.filter((r) => r.ready_to_list);
  const readyProfit = ready.reduce((s, r) => s + (r.profit_at_buy_box ?? 0), 0);
  const ready20 = ready.filter((r) => (r.margin_pct_at_buy_box ?? -1) >= 20).length;
  const dropped = rows.filter((r) => !r.in_bf_file).length;

  return (
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 20px 64px" }}>
      <NavTabs active="bf-dd" />
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 8 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>BF Direct Dispatch</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "2px 0 0" }}>
            Beauty Fort products matched to Amazon, priced for merchant-fulfilled direct dispatch: cost + £4.74 delivery,
            Amazon referral + 2% DSF, VAT. Margin = profit ÷ sale price ex VAT.
          </p>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-muted)", textAlign: "right" }} className="tabular">
          Stock file {data.stock_file_pulled_at ? relativeTime(data.stock_file_pulled_at) : "not pulled yet"}
          <br />
          {scope === "all" ? (
            <a href="/bf-direct-dispatch">Show ungated only</a>
          ) : (
            <a href="/bf-direct-dispatch?scope=all">Include gated products (slower)</a>
          )}
        </div>
      </header>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
        <StatTile label="Ready to list" value={num(ready.length)} sub="ungated · exact · in stock · profitable" tone="good" />
        <StatTile label="Ready at 20%+ margin" value={num(ready20)} />
        <StatTile label="Profit if each sells once" value={gbp(readyProfit)} sub="ready-to-list products, at Buy Box" />
        <StatTile label="Not in BF stock file" value={num(dropped)} sub="treated as out of stock" tone={dropped ? "warning" : "neutral"} />
      </div>

      <Section
        title={scope === "all" ? "All matched products" : "Ungated products"}
        sub="Toggle filters below; every column can also be filtered and sorted. Buy Box and gating are as of the last Amazon check."
      >
        <DataCard>
          <BfDirectDispatchTable rows={rows} />
        </DataCard>
      </Section>
    </main>
  );
}
