"use server";

import { revalidatePath } from "next/cache";

// Calls the n8n "Dashboard Actions (40)" webhook. This ONLY updates an
// approval_status column in Postgres (purchase_orders or pricing_decisions).
// It never pushes a price live to Amazon and never submits a live supplier
// order — those stay gated by their own separate, existing workflows.
export type DashboardActionType = "approve_po" | "reject_po" | "approve_repricing" | "reject_repricing";

export interface DashboardActionResult {
  ok: boolean;
  error?: string;
}

export async function runDashboardAction(action: DashboardActionType, id: number): Promise<DashboardActionResult> {
  const url = process.env.DASHBOARD_ACTION_URL;
  const key = process.env.DASHBOARD_API_KEY;

  if (!url || !key) {
    return { ok: false, error: "DASHBOARD_ACTION_URL or DASHBOARD_API_KEY is not configured." };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-dashboard-key": key },
      body: JSON.stringify({ action, id }),
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return { ok: false, error: (body && body.error) || `Action failed with HTTP ${res.status}.` };
    }

    const body = await res.json().catch(() => null);
    if (!body || !body.id) {
      return { ok: false, error: "Nothing was updated — it may have already been actioned by someone else." };
    }

    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: `Could not reach the action API: ${message}` };
  }
}
