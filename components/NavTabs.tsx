const TABS = [
  { key: "buy", label: "What to buy", href: "/" },
  { key: "bf-dd", label: "BF Direct Dispatch", href: "/bf-direct-dispatch" },
] as const;

export default function NavTabs({ active }: { active: (typeof TABS)[number]["key"] }) {
  return (
    <nav style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)", marginBottom: 20 }}>
      {TABS.map((t) => {
        const on = t.key === active;
        return (
          <a
            key={t.key}
            href={t.href}
            aria-current={on ? "page" : undefined}
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              padding: "8px 14px",
              marginBottom: -1,
              textDecoration: "none",
              color: on ? "var(--text-primary)" : "var(--text-muted)",
              borderBottom: on ? "2px solid var(--accent)" : "2px solid transparent",
            }}
          >
            {t.label}
          </a>
        );
      })}
    </nav>
  );
}
