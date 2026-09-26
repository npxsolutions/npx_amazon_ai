type Tone = "good" | "warning" | "serious" | "critical" | "neutral";

export default function StatTile({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: Tone;
}) {
  const toneColor: Record<Tone, string> = {
    good: "var(--status-good)",
    warning: "var(--status-warning)",
    serious: "var(--status-serious)",
    critical: "var(--status-critical)",
    neutral: "var(--text-primary)",
  };
  return (
    <div
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "16px 18px",
        flex: "1 1 160px",
        minWidth: 160,
      }}
    >
      <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.4 }}>
        {label}
      </div>
      <div className="tabular" style={{ fontSize: 28, fontWeight: 600, color: toneColor[tone], marginTop: 4 }}>
        {value}
      </div>
      {sub ? (
        <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 4 }}>{sub}</div>
      ) : null}
    </div>
  );
}
