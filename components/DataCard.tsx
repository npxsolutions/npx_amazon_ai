export default function DataCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

export const th: React.CSSProperties = {
  textAlign: "left",
  fontSize: 11.5,
  textTransform: "uppercase",
  letterSpacing: 0.3,
  color: "var(--text-muted)",
  fontWeight: 600,
  padding: "10px 14px",
  borderBottom: "1px solid var(--gridline)",
  whiteSpace: "nowrap",
};

export const td: React.CSSProperties = {
  padding: "10px 14px",
  borderBottom: "1px solid var(--gridline)",
  fontSize: 13.5,
  color: "var(--text-primary)",
  verticalAlign: "top",
};

export function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ ...td, color: "var(--text-muted)", textAlign: "center", padding: "24px 14px" }}>
        {label}
      </td>
    </tr>
  );
}
