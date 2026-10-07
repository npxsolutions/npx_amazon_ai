import type { BfDirectDispatchPayload } from "./types";

export interface BfDirectDispatchResult {
  data: BfDirectDispatchPayload | null;
  error: string | null;
}

// Server-side fetch against the Supabase edge function "bf-dd-data", which reads the
// public.bf_product_economics view. The key never reaches the browser.
export async function fetchBfDirectDispatch(scope: "ungated" | "all"): Promise<BfDirectDispatchResult> {
  const url = process.env.BF_DD_API_URL;
  const key = process.env.BF_DD_API_KEY;

  if (!url || !key) {
    return {
      data: null,
      error:
        "BF_DD_API_URL and BF_DD_API_KEY are not set. Add them in your Vercel project's Environment Variables (see .env.example).",
    };
  }

  try {
    const res = await fetch(`${url}?scope=${scope}`, {
      headers: { "x-functions-token": key },
      cache: "no-store",
    });

    if (!res.ok) {
      return { data: null, error: `BF Direct Dispatch API responded with HTTP ${res.status}.` };
    }

    const data = (await res.json()) as BfDirectDispatchPayload;
    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { data: null, error: `Could not reach the BF Direct Dispatch API: ${message}` };
  }
}
