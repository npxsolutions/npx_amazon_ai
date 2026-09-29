export default function Section({
  title,
  sub,
  children,
  right,
  collapsible = false,
  defaultOpen = false,
}: {
  title: string;
  sub?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const heading = (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
      <div>
        <span style={{ fontSize: 16, fontWeight: 700 }}>{title}</span>
        {sub ? <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "2px 0 0" }}>{sub}</p> : null}
      </div>
      {right}
    </div>
  );

  if (collapsible) {
    return (
      <section style={{ marginTop: 32 }}>
        <details open={defaultOpen}>
          <summary style={{ cursor: "pointer" }}>{heading}</summary>
          <div style={{ marginTop: 12 }}>{children}</div>
        </details>
      </section>
    );
  }

  return (
    <section style={{ marginTop: 32 }}>
      {heading}
      <div style={{ marginTop: 12 }}>{children}</div>
    </section>
  );
}
