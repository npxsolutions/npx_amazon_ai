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

// Calls the n8n "Dashboard Listing & Order Actions (41)" webhook. create_listing
// looks up the product type straight from Amazon's own Catalog Items API for the
// ASIN and submits a real LISTING_OFFER_ONLY offer via the SP-API Listings Items
// API (publishes directly — no Slack copy-approval step). add_order calls the
// real "BeautyFort Place Order" workflow but that workflow's own Order Config
// node stays pinned to testMode=true; this action never flips it, and only
// succeeds once the listing is live.
export interface CreateListingResult {
  ok: boolean;
  status?: string; // "live" | "already_live" | "rejected"
  issues?: unknown[];
  productType?: string | null;
  missing?: string[];
  listing_id?: number;
  error?: string;
}

export interface AddOrderResult {
  ok: boolean;
  orderReference?: string | null;
  status?: string | null;
  orderTotal?: number | null;
  errors?: unknown[];
  testMode?: boolean;
  listing_status?: string;
  error?: string;
}

async function callListingWebhook<T extends { ok: boolean; error?: string }>(
  body: Record<string, unknown>,
  label: string
): Promise<T> {
  const url = process.env.DASHBOARD_LISTING_URL;
  const key = process.env.DASHBOARD_API_KEY;

  if (!url || !key) {
    return { ok: false, error: "DASHBOARD_LISTING_URL or DASHBOARD_API_KEY is not configured." } as T;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-dashboard-key": key },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const parsed = await res.json().catch(() => null);
    if (!parsed) {
      return { ok: false, error: `${label} failed with HTTP ${res.status}.` } as T;
    }

    if (parsed.ok) {
      revalidatePath("/");
    }
    return parsed as T;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: `Could not reach the listing API: ${message}` } as T;
  }
}

export async function createListing(opportunityId: number): Promise<CreateListingResult> {
  return callListingWebhook<CreateListingResult>({ action: "create_listing", id: opportunityId }, "Create listing");
}

export async function addOrder(opportunityId: number, quantity?: number): Promise<AddOrderResult> {
  return callListingWebhook<AddOrderResult>(
    { action: "add_order", id: opportunityId, ...(quantity ? { quantity } : {}) },
    "Add order"
  );
}
