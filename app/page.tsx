import { fetchDashboard } from "@/lib/fetchDashboard";
import { gbp, pct, num, relativeTime, dateShort, truthy } from "@/lib/format";
import Badge, { toneFor } from "@/components/Badge";
import StatTile from "@/components/StatTile";
import Section from "@/components/Section";
import DataCard, { th, td, EmptyRow } from "@/components/DataCard";

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

  const ds = data.daily_summary;
  const cap = ds?.capital_position;
  const priorityIsRisk = ds?.priority_basis === "risk";

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 20px 64px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 8 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>NPX Amazon Control Center</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "2px 0 0" }}>
            BeautyFort wholesale operations — live from the automation pipeline
          </p>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-muted)" }} className="tabular">
          Updated {relativeTime(data.generated_at)}
        </div>
      </header>

      {/* Priority banner */}
      {ds?.priority_action ? (
        <div
          style={{
            marginTop: 24,
            background: "var(--surface-card)",
            border: "1px solid var(--border)",
            borderLeft: `4px solid ${priorityIsRisk ? "var(--status-critical)" : "var(--status-good)"}`,
            borderRadius: 8,
            padding: "16px 18px",
          }}
        >
          <div style={{ fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--text-muted)", fontWeight: 600 }}>
            Today&apos;s priority — {priorityIsRisk ? "risk-led" : "opportunity-led"}
          </div>
          <div style={{ fontSize: 15.5, marginTop: 6, lineHeight: 1.5 }}>{ds.priority_action}</div>
          {ds.why ? (
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8, lineHeight: 1.5 }}>{ds.why}</div>
          ) : null}
        </div>
      ) : null}

      {/* Stat tiles */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
        <StatTile
          label="Available capital"
          value={gbp(cap?.available_capital ?? data.cashflow?.net)}
          sub={cap ? `${gbp(cap.committed_outflows)} committed` : undefined}
        />
        <StatTile
          label="Buy candidates"
          value={num(data.opportunity_counts.buy_candidate)}
          sub={`of ${num(
            data.opportunity_counts.buy_candidate + data.opportunity_counts.review + data.opportunity_counts.reject
          )} scored`}
          tone="good"
        />
        <StatTile
          label="Pending approvals"
          value={num(ds?.pending_approvals?.count ?? 0)}
          sub={ds?.pending_approvals ? `${gbp(ds.pending_approvals.cash_required)} cash required` : undefined}
          tone={(ds?.pending_approvals?.count ?? 0) > 0 ? "warning" : "neutral"}
        />
        <StatTile
          label="Workflow errors (24h)"
          value={num(data.workflow_health_summary.total_errors_24h)}
          sub={data.workflow_health.length ? data.workflow_health.map((w) => w.workflow).join(", ") : "none"}
          tone={data.workflow_health_summary.total_errors_24h > 0 ? "critical" : "good"}
        />
        <StatTile
          label="Account health flags"
          value={num(data.account_health_summary.high + data.account_health_summary.medium)}
          sub={`${data.account_health_summary.high} high · ${data.account_health_summary.medium} medium`}
          tone={data.account_health_summary.high > 0 ? "critical" : data.account_health_summary.medium > 0 ? "warning" : "good"}
        />
        <StatTile
          label="Returns (30d)"
          value={num(data.returns_summary.count_30d)}
          sub={gbp(data.returns_summary.refund_30d) + " refunded"}
        />
      </div>

      {/* Biggest opportunity / risk */}
      <div style={{ display: "flex", gap: 16, marginTop: 24, flexWrap: "wrap" }}>
        {ds?.biggest_opportunity ? (
          <div style={{ flex: "1 1 380px" }}>
            <DataCard>
              <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--gridline)" }}>
                <div style={{ fontSize: 11.5, textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600 }}>
                  Biggest opportunity
                </div>
                <div style={{ fontSize: 14.5, fontWeight: 600, marginTop: 4 }}>{ds.biggest_opportunity.title}</div>
                <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>
                  {ds.biggest_opportunity.asin} · {ds.biggest_opportunity.brand ?? "—"}
                </div>
              </div>
              <div style={{ padding: "12px 16px", display: "flex", gap: 20, flexWrap: "wrap" }} className="tabular">
                <Metric label="Score" value={num(ds.biggest_opportunity.score)} />
                <Metric label="Margin" value={pct(ds.biggest_opportunity.margin)} />
                <Metric label="ROI" value={pct(ds.biggest_opportunity.roi)} />
                <Metric label="Contribution/unit" value={gbp(ds.biggest_opportunity.contribution)} />
              </div>
            </DataCard>
          </div>
        ) : null}
        {ds?.biggest_risk ? (
          <div style={{ flex: "1 1 380px" }}>
            <DataCard>
              <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--gridline)" }}>
                <div style={{ fontSize: 11.5, textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600 }}>
                  Biggest risk
                </div>
                <div style={{ fontSize: 14.5, fontWeight: 600, marginTop: 4 }}>{ds.biggest_risk.summary}</div>
              </div>
              <div style={{ padding: "12px 16px" }}>
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{ds.biggest_risk.action}</div>
              </div>
            </DataCard>
          </div>
        ) : null}
      </div>

      {/* Buy candidates table */}
      <Section
        title="Buy candidates"
        sub={`Top ${Math.min(
          data.buy_candidates.length,
          30
        )} by score — selling price, fees (referral + FBA + Amazon's Digital Services Fee), contribution and break-even come straight from the VAT + FBA Profitability engines; SKU, order qty and VAT cost preview what Buy Decision & PO Drafting (08) would draft today. No AI in any of these numbers.`}
      >
        <DataCard>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th style={th}>ASIN</th>
                  <th style={th}>SKU</th>
                  <th style={th}>Score</th>
                  <th style={th}>Selling price</th>
                  <th style={th}>Amazon fees</th>
                  <th style={th}>Contribution (profit/unit)</th>
                  <th style={th}>Margin</th>
                  <th style={th}>ROI</th>
                  <th style={th}>Break-even price</th>
                  <th style={th}>Qty to order</th>
                  <th style={th}>Unit cost (ex VAT)</th>
                  <th style={th}>Unit cost (inc VAT)</th>
                  <th style={th}>Order cost (ex VAT)</th>
                  <th style={th}>Order cost (inc VAT)</th>
                  <th style={th}>Listable</th>
                  <th style={th}>Risks</th>
                </tr>
              </thead>
              <tbody>
                {data.buy_candidates.length === 0 ? (
                  <EmptyRow colSpan={16} label="No buy candidates right now." />
                ) : (
                  data.buy_candidates.map((c) => (
                    <tr key={c.asin}>
                      <td style={td}>
                        <a href={`https://www.amazon.co.uk/dp/${c.asin}`} target="_blank" rel="noreferrer">
                          {c.asin}
                        </a>
                      </td>
                      <td style={{ ...td, color: "var(--text-secondary)" }} className="tabular">
                        {c.supplier_sku ?? "—"}
                      </td>
                      <td style={{ ...td }} className="tabular">
                        {num(c.score)}
                      </td>
                      <td style={{ ...td }} className="tabular">
                        {gbp(c.selling_price)}
                      </td>
                      <td style={{ ...td, color: "var(--text-secondary)" }} className="tabular">
                        {gbp(c.total_amazon_fees)}
                        {c.amazon_referral_fee != null && c.fba_fulfilment_fee != null ? (
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            {gbp(c.amazon_referral_fee)} referral + {gbp(c.fba_fulfilment_fee)} FBA
                            {c.digital_services_fee != null ? <> + {gbp(c.digital_services_fee)} DST</> : null}
                          </div>
                        ) : null}
                      </td>
                      <td style={{ ...td, fontWeight: 600 }} className="tabular">
                        {gbp(c.contribution)}
                      </td>
                      <td style={{ ...td }} className="tabular">
                        {pct(c.margin)}
                      </td>
                      <td style={{ ...td }} className="tabular">
                        {pct(c.roi)}
                      </td>
                      <td style={{ ...td }} className="tabular">
                        {gbp(c.break_even_price)}
                      </td>
                      <td style={{ ...td }} className="tabular">
                        {num(c.quantity_to_order)}
                        {c.supplier_stock != null ? (
                          <span style={{ color: "var(--text-muted)" }}> / {num(c.supplier_stock)} in stock</span>
                        ) : null}
                      </td>
                      <td style={{ ...td }} className="tabular">
                        {gbp(c.unit_cost_ex_vat)}
                      </td>
                      <td style={{ ...td }} className="tabular">
                        {gbp(c.unit_cost_inc_vat)}
                      </td>
                      <td style={{ ...td }} className="tabular">
                        {gbp(c.line_cost_ex_vat)}
                      </td>
                      <td style={{ ...td, fontWeight: 600 }} className="tabular">
                        {gbp(c.line_cost_inc_vat)}
                      </td>
                      <td style={td}>
                        <Badge label={truthy(c.listable) ? "listable" : "blocked"} tone={truthy(c.listable) ? "good" : "warning"} />
                      </td>
                      <td style={td}>
                        {c.risks?.length ? (
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {c.risks.map((r) => (
                              <Badge key={r} label={r} tone="neutral" />
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DataCard>
      </Section>

      {/* PO pipeline */}
      <Section title="Purchase order pipeline">
        <DataCard>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th style={th}>PO number</th>
                  <th style={th}>Status</th>
                  <th style={th}>Approval</th>
                  <th style={th}>Total (inc VAT)</th>
                  <th style={th}>Cash required</th>
                  <th style={th}>Expected contribution</th>
                  <th style={th}>Expected ROI</th>
                  <th style={th}>Items</th>
                  <th style={th}>Created</th>
                </tr>
              </thead>
              <tbody>
                {data.po_pipeline.length === 0 ? (
                  <EmptyRow colSpan={9} label="No purchase orders yet." />
                ) : (
                  data.po_pipeline.map((po) => (
                    <tr key={po.id}>
                      <td style={{ ...td, fontWeight: 600 }}>{po.po_number}</td>
                      <td style={td}>
                        <Badge label={po.status} />
                      </td>
                      <td style={td}>
                        <Badge label={po.approval_status} />
                      </td>
                      <td style={{ ...td }} className="tabular">
                        {gbp(po.total_inc_vat)}
                      </td>
                      <td style={{ ...td }} className="tabular">
                        {gbp(po.cash_required)}
                      </td>
                      <td style={{ ...td }} className="tabular">
                        {gbp(po.expected_contribution)}
                      </td>
                      <td style={{ ...td }} className="tabular">
                        {pct(po.expected_roi)}
                      </td>
                      <td style={{ ...td }} className="tabular">
                        {po.item_count}
                      </td>
                      <td style={{ ...td, color: "var(--text-muted)" }} className="tabular">
                        {dateShort(po.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DataCard>
      </Section>

      {/* Compliance issues */}
      {ds?.compliance_issues?.items?.length ? (
        <Section
          title="Compliance — documentation needed"
          sub={`${ds.compliance_issues.items.length} buy candidates blocked pending hazmat/SDS documentation`}
        >
          <DataCard>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th style={th}>ASIN</th>
                    <th style={th}>Title</th>
                    <th style={th}>Status</th>
                    <th style={th}>Missing documents</th>
                  </tr>
                </thead>
                <tbody>
                  {ds.compliance_issues.items.map((item) => (
                    <tr key={item.asin}>
                      <td style={td}>
                        <a href={`https://www.amazon.co.uk/dp/${item.asin}`} target="_blank" rel="noreferrer">
                          {item.asin}
                        </a>
                      </td>
                      <td style={td}>{item.title}</td>
                      <td style={td}>
                        <Badge label={item.opportunity_status} />
                      </td>
                      <td style={{ ...td, color: "var(--text-secondary)" }}>{item.missing_documents.join("; ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DataCard>
        </Section>
      ) : null}

      {/* Account health */}
      <Section title="Account health">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <StatTile label="OK" value={num(data.account_health_summary.ok)} tone="good" />
          <StatTile label="Low" value={num(data.account_health_summary.low)} tone="warning" />
          <StatTile label="Medium" value={num(data.account_health_summary.medium)} tone="serious" />
          <StatTile label="High" value={num(data.account_health_summary.high)} tone="critical" />
        </div>
        <DataCard>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th style={th}>Severity</th>
                  <th style={th}>Category</th>
                  <th style={th}>Detail</th>
                  <th style={th}>Observed</th>
                </tr>
              </thead>
              <tbody>
                {data.account_health_alerts.length === 0 ? (
                  <EmptyRow colSpan={4} label="No high or medium severity account health issues." />
                ) : (
                  data.account_health_alerts.map((a, i) => (
                    <tr key={`${a.metric}-${i}`}>
                      <td style={td}>
                        <Badge label={a.severity} />
                      </td>
                      <td style={{ ...td, textTransform: "capitalize" }}>{a.category}</td>
                      <td style={{ ...td, color: "var(--text-secondary)" }}>{a.detail}</td>
                      <td style={{ ...td, color: "var(--text-muted)" }} className="tabular">
                        {dateShort(a.observed_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DataCard>
      </Section>

      {/* Workflow health */}
      <Section
        title="Workflow health"
        sub="Every failure across the 39-workflow pipeline reports here via Central Error Logger — a clean run shows nothing"
      >
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <StatTile
            label="Workflows affected (24h)"
            value={num(data.workflow_health_summary.workflows_with_errors_24h)}
            tone={data.workflow_health_summary.workflows_with_errors_24h > 0 ? "critical" : "good"}
          />
          <StatTile
            label="Errors (24h)"
            value={num(data.workflow_health_summary.total_errors_24h)}
            tone={data.workflow_health_summary.total_errors_24h > 0 ? "critical" : "good"}
          />
          <StatTile
            label="Errors (7d)"
            value={num(data.workflow_health_summary.total_errors_7d)}
            tone={data.workflow_health_summary.total_errors_7d > 0 ? "warning" : "good"}
          />
        </div>
        <DataCard>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th style={th}>Workflow</th>
                  <th style={th}>Errors (24h)</th>
                  <th style={th}>Errors (7d)</th>
                  <th style={th}>Last error</th>
                  <th style={th}>When</th>
                </tr>
              </thead>
              <tbody>
                {data.workflow_health.length === 0 ? (
                  <EmptyRow colSpan={5} label="No workflow errors in the last 7 days — everything's running clean." />
                ) : (
                  data.workflow_health.map((w) => (
                    <tr key={w.workflow}>
                      <td style={{ ...td, fontWeight: 600 }}>{w.workflow}</td>
                      <td style={{ ...td }} className="tabular">
                        {w.errors_24h > 0 ? <Badge label={String(w.errors_24h)} tone="critical" /> : num(w.errors_24h)}
                      </td>
                      <td style={{ ...td }} className="tabular">
                        {num(w.errors_7d)}
                      </td>
                      <td style={{ ...td, color: "var(--text-secondary)" }}>{w.last_error_message}</td>
                      <td style={{ ...td, color: "var(--text-muted)" }} className="tabular">
                        {relativeTime(w.last_error_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DataCard>
      </Section>

      {/* Recent alerts */}
      <Section title="Recent alerts" sub="Last 15 delivered notifications across all workflows">
        <DataCard>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th style={th}>Severity</th>
                  <th style={th}>Workflow</th>
                  <th style={th}>Message</th>
                  <th style={th}>When</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_alerts.length === 0 ? (
                  <EmptyRow colSpan={4} label="No alerts recently." />
                ) : (
                  data.recent_alerts.map((a, i) => (
                    <tr key={`${a.workflow}-${i}`}>
                      <td style={td}>
                        <Badge label={a.severity} />
                      </td>
                      <td style={{ ...td, color: "var(--text-secondary)" }}>{a.workflow}</td>
                      <td style={td}>{a.message ?? "—"}</td>
                      <td style={{ ...td, color: "var(--text-muted)" }} className="tabular">
                        {dateShort(a.created_at)}
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 600 }}>{value}</div>
    </div>
  );
}
