// Shape of the payload returned by the n8n "Dashboard Data API (39)" webhook.
// Deeply-nested, rarely-rendered sections are typed loosely (Record<string, unknown>)
// rather than fully modeled - they're read defensively in the UI.

export interface RiskCandidate {
  score: number;
  action: string;
  summary: string;
  category: string;
  exposure_gbp: number | null;
  ref: Record<string, unknown> | null;
}

export interface OpportunityRef {
  asin: string;
  brand?: string;
  score: number;
  title: string;
  margin: number;
  roi: number;
  status: string;
  contribution: number;
  capital_required: number;
  opportunity_id: number;
  product_id: number;
  risks?: string[];
  summary?: string;
}

export interface ComplianceIssueItem {
  asin: string;
  score: number;
  title: string;
  product_id: number;
  compliance_status: string;
  missing_documents: string[];
  opportunity_status: string;
  verification_status: string;
}

export interface DailySummary {
  what?: string;
  why?: string;
  engine?: string;
  run_date?: string;
  workflow?: string;
  confidence?: number | null;
  created_at?: string;
  generated_at?: string;
  deterministic?: boolean;
  priority_basis?: string;
  priority_action?: string;
  recommended_action?: string;
  expected_impact?: string | null;
  biggest_risk?: RiskCandidate;
  biggest_opportunity?: OpportunityRef;
  risk_candidates?: RiskCandidate[];
  top_opportunities?: OpportunityRef[];
  products_to_scale?: OpportunityRef[];
  products_to_investigate?: (OpportunityRef & { reason?: string })[];
  products_declining_economics?: Record<string, unknown>[];
  products_requiring_replenishment?: Record<string, unknown>[];
  products_to_stop?: Record<string, unknown>[];
  open_alerts?: Record<string, unknown>[];
  alert_counts_24h?: Record<string, number>;
  workflow_errors_24h?: { count: number; workflows: string[] };
  replenishment_counts?: {
    reorder: number;
    stockout: number;
    latest_run_at: string | null;
    capital_required: number;
  };
  capital_position?: {
    net: number;
    budget: string | number;
    available_capital: string | number;
    committed_outflows: string | number;
    period_start: string;
  };
  pending_approvals?: { count: number; cash_required: number; expected_contribution: number };
  compliance_issues?: { items: ComplianceIssueItem[]; counts: Record<string, number> };
  account_health_issues?: { status: string; note: string | null; items: Record<string, unknown>[] };
  supplier_issues?: Record<string, unknown>;
  pricing_issues?: unknown[];
  ppc_issues?: { status: string; note?: string; items: unknown[] };
  opportunity_counts?: {
    total: number;
    reject: number;
    review: number;
    new_24h: number;
    buy_candidate: number;
    new_buy_candidates_24h: number;
  };
}

export interface BuyCandidate {
  asin: string;
  product_id: number;
  score: number;
  margin: number;
  roi: number;
  contribution: number;
  capital_required: number;
  listable: string | boolean;
  risks: string[];
}

export interface PoPipelineRow {
  id: number;
  po_number: string;
  status: string;
  approval_status: string;
  total_inc_vat: number;
  cash_required: number;
  expected_contribution: number;
  expected_roi: number;
  created_at: string;
  item_count: number;
}

export interface Cashflow {
  net: number;
  projected_inflow: number;
  projected_outflow: number;
  period_start: string;
  period_end: string;
  created_at: string;
}

export interface AccountHealthAlert {
  category: string;
  metric: string;
  status: string;
  severity: string;
  detail: string;
  observed_at: string;
}

export interface AccountHealthSummary {
  ok: number;
  low: number;
  medium: number;
  high: number;
}

export interface RecentAlert {
  notification_type: string;
  severity: string;
  product_ref: string | null;
  workflow: string;
  source: string;
  message: string | null;
  created_at: string;
}

export interface ReturnsSummary {
  count_30d: number;
  refund_30d: number;
}

export interface DashboardPayload {
  generated_at: string;
  daily_summary: DailySummary | null;
  buy_candidates: BuyCandidate[];
  opportunity_counts: { buy_candidate: number; review: number; reject: number; top_score: number | null };
  po_pipeline: PoPipelineRow[];
  cashflow: Cashflow | null;
  account_health_alerts: AccountHealthAlert[];
  account_health_summary: AccountHealthSummary;
  recent_alerts: RecentAlert[];
  returns_summary: ReturnsSummary;
}
