type Tone = "good" | "warning" | "serious" | "critical" | "neutral";

const TONE_MAP: Record<string, Tone> = {
  // opportunity status
  buy_candidate: "good",
  review: "warning",
  reject: "critical",
  // PO status
  DRAFT: "warning",
  SUBMITTED: "good",
  SUBMIT_FAILED: "critical",
  // approval status
  approved: "good",
  pending: "warning",
  rejected: "critical",
  // severity
  high: "critical",
  medium: "serious",
  low: "warning",
  ok: "good",
  info: "neutral",
  // account health status
  GREAT: "good",
  BAD: "critical",
  ERROR: "critical",
  WARNING: "warning",
  CHECKED: "neutral",
  NONE: "good",
  // risk flags (product_opportunities.risks)
  amazon_on_listing: "serious",
  high_competition: "serious",
  low_margin: "warning",
  low_roi: "warning",
  negative_contribution: "critical",
  calc_error: "critical",
  gated_restricted: "critical",
  approval_required: "warning",
  eligibility_unknown: "neutral",
  // eligible-SKU scoring-pipeline status (not an opportunity status yet)
  awaiting_price_data: "neutral",
  queued_for_scoring: "neutral",
};

export function toneFor(label: string): Tone {
  return TONE_MAP[label] ?? "neutral";
}

export default function Badge({ label, tone }: { label: string; tone?: Tone }) {
  const resolved = tone ?? toneFor(label);
  const styles: Record<Tone, { fg: string; bg: string }> = {
    good: { fg: "var(--status-good)", bg: "var(--status-good-soft)" },
    warning: { fg: "var(--status-warning)", bg: "var(--status-warning-soft)" },
    serious: { fg: "var(--status-serious)", bg: "var(--status-serious-soft)" },
    critical: { fg: "var(--status-critical)", bg: "var(--status-critical-soft)" },
    neutral: { fg: "var(--text-secondary)", bg: "var(--surface-sunken)" },
  };
  const s = styles[resolved];
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 12,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 999,
        color: s.fg,
        background: s.bg,
        whiteSpace: "nowrap",
      }}
    >
      {label.replace(/_/g, " ")}
    </span>
  );
}
