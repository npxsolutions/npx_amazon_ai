"use client";

import { useState, useTransition } from "react";
import { createListing, addOrder, type AddOrderResult } from "@/lib/actions";
import Badge from "./Badge";

function issueText(issue: unknown): string {
  if (typeof issue === "string") return issue;
  if (issue && typeof issue === "object" && "message" in issue) {
    return String((issue as { message?: unknown }).message);
  }
  return JSON.stringify(issue);
}

export default function ListingOrderButtons({
  opportunityId,
  initialListingStatus,
  initialListingIssues,
}: {
  opportunityId: number;
  initialListingStatus: string | null;
  initialListingIssues?: unknown[] | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [listingStatus, setListingStatus] = useState<string | null>(initialListingStatus);
  const [listingIssues, setListingIssues] = useState<unknown[] | null | undefined>(initialListingIssues);
  const [missing, setMissing] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<AddOrderResult | null>(null);

  const isLive = listingStatus === "live" || listingStatus === "already_live";

  function handleCreateListing() {
    setError(null);
    setMissing(null);
    startTransition(async () => {
      const result = await createListing(opportunityId);
      if (result.ok) {
        setListingStatus(result.status ?? "live");
        setListingIssues(result.issues ?? null);
      } else if (result.error === "missing_required_attributes") {
        setMissing(result.missing ?? []);
        setError("Amazon needs more information before this can be listed.");
      } else {
        setError(result.error ?? "Listing failed.");
      }
    });
  }

  function handleAddOrder() {
    setError(null);
    startTransition(async () => {
      const result = await addOrder(opportunityId);
      setOrderResult(result);
      if (!result.ok) {
        setError(
          result.error === "listing_not_live"
            ? "Listing isn't live yet — create the listing first."
            : result.error ?? "Order failed."
        );
      }
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        {isLive ? (
          <Badge label="listing live" tone="good" />
        ) : listingStatus === "rejected" ? (
          <Badge label="listing rejected" tone="critical" />
        ) : (
          <Badge label="not listed" tone="neutral" />
        )}

        {!isLive ? (
          <button type="button" disabled={isPending} onClick={handleCreateListing} style={btnStyle("var(--status-good)", isPending)}>
            {isPending ? "Working…" : "Create Listing"}
          </button>
        ) : null}

        <button
          type="button"
          disabled={isPending || !isLive}
          onClick={handleAddOrder}
          style={btnStyle(isLive ? "var(--status-warning)" : "var(--text-muted)", isPending || !isLive)}
          title={isLive ? "Places a test-mode BeautyFort order" : "Create the listing first"}
        >
          {isPending ? "Working…" : "Add Order (test)"}
        </button>
      </div>

      {missing?.length ? (
        <div style={{ fontSize: 11, color: "var(--status-warning)" }}>Missing: {missing.join(", ")}</div>
      ) : null}

      {listingIssues?.length ? (
        <div style={{ fontSize: 11, color: "var(--status-critical)" }}>
          {listingIssues.map(issueText).join("; ")}
        </div>
      ) : null}

      {orderResult ? (
        <div style={{ fontSize: 11, color: orderResult.ok ? "var(--status-good)" : "var(--status-critical)" }}>
          {orderResult.ok
            ? `Test order placed — ${orderResult.orderReference ?? "no ref"} (${orderResult.status ?? "unknown"})`
            : orderResult.errors?.length
            ? `Order failed: ${orderResult.errors.map(issueText).join("; ")}`
            : "Order failed."}
        </div>
      ) : null}

      {error && !missing?.length ? <div style={{ fontSize: 11, color: "var(--status-critical)" }}>{error}</div> : null}
    </div>
  );
}

function btnStyle(color: string, disabled: boolean): React.CSSProperties {
  return {
    fontSize: 12,
    fontWeight: 600,
    padding: "3px 10px",
    borderRadius: 6,
    border: `1px solid ${color}`,
    color,
    background: "transparent",
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.6 : 1,
  };
}
