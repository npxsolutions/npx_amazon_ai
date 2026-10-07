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
  opportunity_id: number;
  amazon_product_id: number;
  asin: string;
  product_id: number;
  score: number;
  margin: number;
  roi: number;
  contribution: number;
  capital_required: number;
  listable: string | boolean;
  risks: string[];
  product_title: string | null;
  brand: string | null;
  supplier_sku: string | null;
  unit_cost_ex_vat: number | null;
  unit_cost_inc_vat: number | null;
  supplier_stock: number | null;
  quantity_to_order: number;
  line_cost_ex_vat: number | null;
  line_cost_inc_vat: number | null;
  selling_price: number | null;
  amazon_referral_fee: number | null;
  fba_fulfilment_fee: number | null;
  digital_services_fee: number | null;
  total_amazon_fees: number | null;
  break_even_price: number | null;
  listing_id: number | null;
  listing_status: string | null;
  listing_issues: unknown[] | null;
  seller_count: number | null;
  amazon_present: boolean | null;
  last_priced_at: string | null;
}

export interface EligibleSku {
  asin: string;
  product_title: string | null;
  brand: string | null;
  supplier_sku: string | null;
  supplier_stock: number | null;
  score: number | null;
  margin: number | null;
  roi: number | null;
  contribution: number | null;
  capital_required: number | null;
  opportunity_status: string | null;
  risks: string[] | null;
  listing_status: string | null;
  eligibility_checked_at: string;
  seller_count: number | null;
  amazon_present: boolean | null;
  buy_box_price: number | null;
  last_priced_at: string | null;
}

// One line of the budget-constrained buy plan built by workflow 07 (Build Buy Plan).
export interface BuyPlanRow {
  opportunity_id: number;
  asin: string;
  product_id: number;
  amazon_product_id: number;
  product_title: string | null;
  brand: string | null;
  supplier_sku: string | null;
  supplier_stock: number | null;
  unit_cost_ex_vat: number | null;
  unit_cost_inc_vat: number | null;
  profit_per_unit: number | null;
  margin: number | null;
  roi: number | null;
  plan_rank: number;
  order_qty: number;
  order_cash_inc_vat: number;
  monthly_profit: number;
  partial: boolean | null;
  est_units_month: number | null;
  market_units_month: number | null;
  velocity_source: string | null;
  reason: string | null;
  selling_price: number | null;
  price_basis: string | null;
  live_buy_box: number | null;
  avg30_buy_box: number | null;
  avg90_buy_box: number | null;
  net_revenue: number | null;
  effective_unit_cost: number | null;
  amazon_referral_fee: number | null;
  referral_rate: number | null;
  referral_source: string | null;
  fba_fulfilment_fee: number | null;
  digital_services_fee: number | null;
  fba_fee_source: string | null;
  break_even_price: number | null;
  max_purchase_cost: number | null;
  seller_count: number | null;
  amazon_present: boolean | null;
  risks: string[] | null;
  listing_id: number | null;
  listing_status: string | null;
  last_priced_at: string | null;
}

export interface BuyPlanSummary {
  budget_inc_vat: number | null;
  planned_at: string | null;
  planned_cash_inc_vat: number;
  planned_monthly_profit: number;
  planned_lines: number;
  planned_units: number;
  buy_count: number;
  watch_count: number;
  skip_count: number;
  priced_last_24h: number;
  total_scored: number;
}

// Every ASIN the seller can list today without brand approval, scored by 07.
export interface SellableRow {
  opportunity_id: number;
  listing_status: string | null;
  listing_issues: unknown[] | null;
  asin: string;
  supplier_sku: string | null;
  product_title: string | null;
  brand: string | null;
  verdict: "BUY" | "WATCH" | "SKIP" | string | null;
  reason: string | null;
  units_month: number | null;
  market_units_month: number | null;
  seller_count: number | null;
  amazon_present: boolean | null;
  live_buy_box: boolean | null;
  selling_price: number | null;
  profit_per_unit: number | null;
  margin: number | null;
  roi: number | null;
  profit_month: number | null;
  qty_30d: number | null;
  cash_30d_inc_vat: number | null;
  unit_cost_inc_vat: number | null;
  unit_cost_ex_vat: number | null;
  supplier_stock: number | null;
  hazmat_blocked: boolean | null;
  last_priced_at: string | null;
}

// One product behind an approval in unlock_actions.
export interface UnlockProduct {
  blocker: string;
  brand: string | null;
  asin: string;
  supplier_sku: string | null;
  product_title: string | null;
  profit_per_unit: number | null;
  margin: number | null;
  roi: number | null;
  units_month: number | null;
  profit_month: number | null;
  qty_30d: number | null;
  cash_30d_inc_vat: number | null;
  unit_cost_ex_vat: number | null;
  supplier_stock: number | null;
  unlocks_alone: boolean | null;
  blockers: string[] | null;
}

// One approval you could get, and the profitable products it would open up (07 blockers[]).
export interface UnlockAction {
  blocker: "brand_approval" | "hazmat" | string;
  brand: string | null;
  products: number;
  monthly_profit: number | null;
  unlocked_alone: number;
  monthly_profit_alone: number | null;
  stock_cash_inc_vat: number | null;
}

export interface WatchRow {
  asin: string;
  product_title: string | null;
  brand: string | null;
  est_monthly_profit: number | null;
  est_units_month: number | null;
  profit_per_unit: number | null;
  margin: number | null;
  roi: number | null;
  reason: string | null;
  eligibility: string | null;
  seller_count: number | null;
  amazon_present: boolean | null;
  risks: string[] | null;
}

export interface EligibleSkusSummary {
  total_eligible: number;
  scored: number;
  not_yet_scored: number;
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

export interface WorkflowHealthItem {
  workflow: string;
  errors_24h: number;
  errors_7d: number;
  last_error_at: string;
  last_error_message: string;
}

export interface WorkflowHealthSummary {
  workflows_with_errors_24h: number;
  total_errors_24h: number;
  total_errors_7d: number;
  last_error_at: string | null;
}

export interface SupplierRow {
  id: number;
  name: string;
  supplier_code: string | null;
  status: string;
  reliability_score: number | null;
  default_lead_time_days: number | null;
  product_count: number;
  last_sync_status: string | null;
  last_sync_at: string | null;
  last_sync_finished_at: string | null;
  records_processed: number | null;
  records_changed: number | null;
  records_failed: number | null;
  last_sync_error: string | null;
}

export interface RepricingRow {
  id: number;
  asin: string;
  product_id: number;
  selling_state: string;
  min_price: number | null;
  target_price: number | null;
  max_price: number | null;
  current_price: number | null;
  recommended_price: number | null;
  price_change_pct: number | null;
  reason: string | null;
  requires_approval: boolean;
  approval_status: string;
  created_at: string;
}

export interface RepricingSummary {
  total_tracked: number;
  pending_approval: number;
  price_increases: number;
  price_decreases: number;
}

export interface InventoryRow {
  asin: string;
  sku: string | null;
  title: string | null;
  sellable: number | null;
  reserved: number | null;
  inbound: number | null;
  available: number | null;
  days_cover: number | null;
  stockout_risk: string | null;
  inventory_value: number | null;
  recommendation: string | null;
  recommended_qty: number | null;
}

export interface InventorySummary {
  total_skus: number;
  low_days_cover: number;
  no_days_cover_data: number;
  total_inventory_value: number;
}

export interface DashboardPayload {
  generated_at: string;
  daily_summary: DailySummary | null;
  buy_candidates: BuyCandidate[];
  buy_plan?: BuyPlanRow[];
  buy_plan_summary?: BuyPlanSummary | null;
  watch_list?: WatchRow[];
  unlock_actions?: UnlockAction[];
  unlock_products?: UnlockProduct[];
  sellable_now?: SellableRow[];
  opportunity_counts: { buy_candidate: number; review: number; reject: number; top_score: number | null };
  eligible_skus: EligibleSku[];
  eligible_skus_summary: EligibleSkusSummary;
  po_pipeline: PoPipelineRow[];
  cashflow: Cashflow | null;
  account_health_alerts: AccountHealthAlert[];
  account_health_summary: AccountHealthSummary;
  suppliers: SupplierRow[];
  repricing: RepricingRow[];
  repricing_summary: RepricingSummary;
  inventory: InventoryRow[];
  inventory_summary: InventorySummary;
  recent_alerts: RecentAlert[];
  returns_summary: ReturnsSummary;
  workflow_health: WorkflowHealthItem[];
  workflow_health_summary: WorkflowHealthSummary;
}

// BF Direct Dispatch tab — rows from the Supabase view public.bf_product_economics (via edge function bf-dd-data).
export interface BfDirectDispatchRow {
  bf_sku: string;
  barcode: string | null;
  brand: string | null;
  product_name: string | null;
  asin: string;
  match_confidence: string | null;
  cost_ex_vat: number | null;
  cost_inc_vat: number | null;
  total_cost_ex_vat: number | null;
  bf_stock: number | null;
  referral_pct: number | null;
  breakeven_price: number | null;
  price_10pct_margin: number | null;
  price_20pct_margin: number | null;
  price_30pct_margin: number | null;
  price_40pct_margin: number | null;
  buy_box_price: number | null;
  buy_box_basis: "live" | "avg30" | null;
  seller_count: number | null;
  amazon_fees_at_buy_box: number | null;
  profit_at_buy_box: number | null;
  /** Percent, e.g. 26.1 */
  margin_pct_at_buy_box: number | null;
  rrp: number | null;
  gating: string;
  is_ungated: boolean;
  is_exact_match: boolean;
  in_stock: boolean;
  has_buy_box: boolean;
  profitable_at_buy_box: boolean;
  amazon_on_listing: boolean;
  buy_box_suspect: boolean;
  ready_to_list: boolean;
  in_bf_file: boolean;
}

export interface BfDirectDispatchPayload {
  generated_at: string;
  scope: "ungated" | "all";
  stock_file_pulled_at: string | null;
  rows: BfDirectDispatchRow[];
}
