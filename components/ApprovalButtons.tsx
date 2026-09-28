"use client";

import { useState, useTransition } from "react";
import { runDashboardAction, type DashboardActionType } from "@/lib/actions";
import Badge from "./Badge";

export default function ApprovalButtons({
  status,
  id,
  approveAction,
  rejectAction,
}: {
  status: string;
  id: number;
  approveAction: DashboardActionType;
  rejectAction: DashboardActionType;
}) {
  const [isPending, startTransition] = useTransition();
  const [localStatus, setLocalStatus] = useState(status);
  const [error, setError] = useState<string | null>(null);

  if (localStatus !== "pending") {
    return <Badge label={localStatus} />;
  }

  function act(action: DashboardActionType, nextStatus: string) {
    setError(null);
    startTransition(async () => {
      const result = await runDashboardAction(action, id);
      if (result.ok) {
        setLocalStatus(nextStatus);
      } else {
        setError(result.error ?? "Action failed.");
      }
    });
  }

  const buttonStyle = (color: string): React.CSSProperties => ({
    fontSize: 12,
    fontWeight: 600,
    padding: "3px 10px",
    borderRadius: 6,
    border: `1px solid ${color}`,
    color,
    background: "transparent",
    cursor: isPending ? "default" : "pointer",
    opacity: isPending ? 0.6 : 1,
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      <Badge label={localStatus} />
      <button type="button" disabled={isPending} onClick={() => act(approveAction, "approved")} style={buttonStyle("var(--status-good)")}>
        Approve
      </button>
      <button type="button" disabled={isPending} onClick={() => act(rejectAction, "rejected")} style={buttonStyle("var(--status-critical)")}>
        Reject
      </button>
      {error ? <span style={{ fontSize: 11, color: "var(--status-critical)" }}>{error}</span> : null}
    </div>
  );
}
